#!/usr/bin/env node
/**
 * Admin dashboard API probe
 * -------------------------
 * Exercises every endpoint the admin dashboard (/dashboard) calls, prints a
 * pass/fail table, and shows which `period` values each analytics endpoint
 * actually accepts.
 *
 * Read-only by default. Mutating probes are opt-in (see flags).
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='...' \
 *     node scripts/dashboard_api_probe.mjs
 *
 * Options:
 *   --base-url <url>            API base (default: $API_BASE_URL or https://api.lydiacallcenter.org)
 *   --conversation-id <id>      Target for the conversation detail probe (default: first listed conversation)
 *   --support-request-id <id>   Target for the support-request detail probe (default: first listed request)
 *   --mutate                    Enable takeover → release on --conversation-id (undoes itself)
 *   --reply-text <text>         With --mutate, also send a real reply to --conversation-id
 *   --no-periods                Skip the period acceptance matrix
 *   --json                      Print a JSON summary after the table
 *   --help                      Show this help
 *
 * Env:
 *   API_BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD   (or ADMIN_ACCESS_TOKEN to skip login)
 *
 * Exit code: 0 when every executed probe passed (SKIPs allowed), 1 otherwise.
 */

const args = process.argv.slice(2);

function parseArgs(argv) {
  const parsed = {
    flags: new Set(),
    values: {},
  };
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) continue;
    const key = current.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      parsed.values[key] = next;
      i += 1;
    } else {
      parsed.flags.add(key);
    }
  }
  return parsed;
}

if (args.includes('--help') || args.includes('-h')) {
  const body = [
    'Admin dashboard API probe',
    '',
    'Usage:',
    "  ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='...' node scripts/dashboard_api_probe.mjs [options]",
    '',
    'Options:',
    '  --base-url <url>            API base (default: $API_BASE_URL or https://api.lydiacallcenter.org)',
    '  --conversation-id <id>      Target for conversation detail/takeover/release/reply',
    '  --support-request-id <id>   Target for support-request detail',
    '  --mutate                    Enable takeover → release on the target conversation',
    '  --reply-text <text>         With --mutate, also send a real reply (visible to the user!)',
    '  --no-periods                Skip the analytics period acceptance matrix',
    '  --json                      Also print a JSON summary',
    '',
    'Env: API_BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_ACCESS_TOKEN (skips login)',
  ].join('\n');
  console.log(body);
  process.exit(0);
}

const cli = parseArgs(args);
const BASE_URL = (cli.values['base-url'] || process.env.API_BASE_URL || 'https://api.lydiacallcenter.org')
  .trim()
  .replace(/\/+$/, '');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
let accessToken = (process.env.ADMIN_ACCESS_TOKEN || '').trim();
const REQUEST_TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS || 20000);

const results = [];
let authFailed = false;

// ── helpers ─────────────────────────────────────────────────────────────────

function maskToken(token) {
  if (!token) return '(none)';
  return token.length <= 10 ? `${token.slice(0, 4)}…` : `${token.slice(0, 8)}…`;
}

function buildUrl(path, query) {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request(method, path, { query, body, auth = true } = {}) {
  const startedAt = Date.now();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let json;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    return { ok: response.ok, status: response.status, ms: Date.now() - startedAt, text, json };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - startedAt,
      text: '',
      error: error?.name === 'AbortError' ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : String(error?.message || error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function record({ name, method, path, result, state, note }) {
  const outcome = state || (result.ok ? 'PASS' : 'FAIL');
  results.push({
    name,
    method,
    path,
    outcome,
    status: result.status || '-',
    ms: result.ms,
    note: note || (result.ok ? '' : errorSnippet(result)),
  });
  return result;
}

function errorSnippet(result) {
  if (result.error) return result.error;
  const body = (result.text || '').trim();
  if (!body) return 'empty response body';
  return body.length > 160 ? `${body.slice(0, 157)}…` : body;
}

function skip(name, method, path, note) {
  results.push({ name, method, path, outcome: 'SKIP', status: '-', ms: 0, note });
}

function describeShape(json) {
  if (json === undefined) return 'non-JSON body';
  if (Array.isArray(json)) return `array(${json.length})`;
  if (json && typeof json === 'object') {
    const keys = Object.keys(json);
    return keys.length <= 6 ? `{${keys.join(', ')}}` : `{${keys.slice(0, 6).join(', ')}, +${keys.length - 6}}`;
  }
  return typeof json;
}

function renderTable(rows, columns) {
  const widths = columns.map((column) => {
    const longest = rows.reduce(
      (max, row) => Math.max(max, String(row[column.key] ?? '').length),
      column.header.length,
    );
    return Math.min(longest, column.max || 60);
  });

  const line = (cells) =>
    cells
      .map((cell, index) => {
        const raw = String(cell ?? '');
        const value = raw.length > widths[index] ? `${raw.slice(0, widths[index] - 1)}…` : raw;
        return value.padEnd(widths[index]);
      })
      .join('  ')
      .trimEnd();

  console.log(line(columns.map((column) => column.header)));
  console.log(line(widths.map((width) => '─'.repeat(width))));
  for (const row of rows) {
    console.log(line(columns.map((column) => row[column.key])));
  }
}

// ── probes ──────────────────────────────────────────────────────────────────

async function probeLogin() {
  if (accessToken) {
    skip('Staff login (reused token)', 'POST', '/admin/login', `using ADMIN_ACCESS_TOKEN ${maskToken(accessToken)}`);
    return true;
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    skip('Staff login', 'POST', '/admin/login', 'ADMIN_EMAIL / ADMIN_PASSWORD not set');
    authFailed = true;
    return false;
  }

  const result = await request('POST', '/admin/login', {
    auth: false,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  const token = result.json?.access_token;
  const role = result.json?.user?.role;
  const note = result.ok
    ? `token ${maskToken(token)}, role=${role ?? '?'}, expires_in=${result.json?.expires_in ?? '?'}`
    : undefined;

  record({ name: 'Staff login', method: 'POST', path: '/admin/login', result, note });

  if (!result.ok || !token) {
    authFailed = true;
    return false;
  }

  accessToken = token;
  return true;
}

async function probeAdminSurface(targets) {
  const me = await request('GET', '/admin/me');
  record({
    name: 'Current staff user',
    method: 'GET',
    path: '/admin/me',
    result: me,
    note: me.ok ? `id=${me.json?.id ?? '?'}, is_active=${me.json?.is_active ?? '?'}` : undefined,
  });

  const dashboard = await request('GET', '/admin/dashboard');
  record({
    name: 'Dashboard stats',
    method: 'GET',
    path: '/admin/dashboard',
    result: dashboard,
    note: dashboard.ok ? `shape ${describeShape(dashboard.json)}` : undefined,
  });

  const conversations = await request('GET', '/admin/conversations', {
    query: { page: 1, page_size: 20 },
  });
  const conversationList = conversations.json?.conversations;
  record({
    name: 'Conversations list',
    method: 'GET',
    path: '/admin/conversations?page=1&page_size=20',
    result: conversations,
    note: conversations.ok
      ? `total=${conversations.json?.total ?? '?'}, returned=${Array.isArray(conversationList) ? conversationList.length : '?'}`
      : undefined,
  });

  const escalated = await request('GET', '/admin/conversations', {
    query: { page: 1, page_size: 100, is_escalated: true, is_human_takeover: false },
  });
  const escalatedConversations = escalated.json?.conversations ?? [];
  record({
    name: 'Conversations awaiting takeover',
    method: 'GET',
    path: '/admin/conversations?is_escalated=true&is_human_takeover=false',
    result: escalated,
    note: escalated.ok
      ? `${escalatedConversations.length} awaiting takeover (drives the header chip + bell)`
      : undefined,
  });

  // Audit page uses a raw fetch to /admin/audit-logs
  const auditLogs = await request('GET', '/admin/audit-logs', { query: { page: 1, limit: 20 } });
  record({
    name: 'Audit logs',
    method: 'GET',
    path: '/admin/audit-logs?page=1&limit=20',
    result: auditLogs,
    note: auditLogs.ok ? `shape ${describeShape(auditLogs.json)}` : undefined,
  });

  // Admin Accounts page
  const staff = await request('GET', '/admin/staff');
  const staffList = Array.isArray(staff.json?.staff) ? staff.json.staff : Array.isArray(staff.json) ? staff.json : [];
  record({
    name: 'Staff accounts',
    method: 'GET',
    path: '/admin/staff',
    result: staff,
    note: staff.ok ? `${staffList.length} account(s)` : undefined,
  });

  const conversationId =
    cli.values['conversation-id'] ||
    (Array.isArray(conversationList) && conversationList[0]?.id ? conversationList[0].id : undefined);

  if (!conversationId) {
    skip('Conversation detail', 'GET', '/admin/conversations/{id}', 'no conversation available to probe');
    skip('Conversation takeover', 'POST', '/admin/conversations/{id}/takeover', 'no conversation available to probe');
    skip('Conversation release', 'POST', '/admin/conversations/{id}/release', 'no conversation available to probe');
    skip('Conversation reply', 'POST', '/admin/conversations/{id}/reply', 'no conversation available to probe');
    return;
  }

  targets.conversationId = conversationId;

  const detail = await request('GET', `/admin/conversations/${encodeURIComponent(conversationId)}`);
  record({
    name: 'Conversation detail',
    method: 'GET',
    path: '/admin/conversations/{id}',
    result: detail,
    note: detail.ok
      ? `messages=${Array.isArray(detail.json?.messages) ? detail.json.messages.length : '?'}, escalated=${detail.json?.is_escalated ?? '?'}, takeover=${detail.json?.is_human_takeover ?? '?'}`
      : undefined,
  });

  const mutate = cli.flags.has('mutate');

  if (!mutate) {
    skip(
      'Conversation takeover',
      'POST',
      '/admin/conversations/{id}/takeover',
      'read-only run: pass --mutate --conversation-id <id> to probe (it releases afterwards)',
    );
    skip(
      'Conversation release',
      'POST',
      '/admin/conversations/{id}/release',
      'read-only run: pass --mutate --conversation-id <id> to probe',
    );
    skip(
      'Conversation reply',
      'POST',
      '/admin/conversations/{id}/reply',
      'never probed unless --mutate --reply-text is given (it messages the real user)',
    );
    return;
  }

  const takeover = await request('POST', `/admin/conversations/${encodeURIComponent(conversationId)}/takeover`);
  record({ name: 'Conversation takeover', method: 'POST', path: '/admin/conversations/{id}/takeover', result: takeover });

  if (takeover.ok) {
    const release = await request('POST', `/admin/conversations/${encodeURIComponent(conversationId)}/release`);
    record({
      name: 'Conversation release',
      method: 'POST',
      path: '/admin/conversations/{id}/release',
      result: release,
      note: release.ok ? 'state restored' : undefined,
    });
  } else {
    skip('Conversation release', 'POST', '/admin/conversations/{id}/release', 'skipped: takeover did not succeed');
  }

  if (cli.values['reply-text']) {
    const reply = await request('POST', `/admin/conversations/${encodeURIComponent(conversationId)}/reply`, {
      body: { content: cli.values['reply-text'] },
    });
    record({
      name: 'Conversation reply',
      method: 'POST',
      path: '/admin/conversations/{id}/reply',
      result: reply,
      note: reply.ok ? 'message delivered to the user' : undefined,
    });
  } else {
    skip(
      'Conversation reply',
      'POST',
      '/admin/conversations/{id}/reply',
      'skipped: pass --reply-text "<text>" to send a real message',
    );
  }
}

async function probeAnalyticsSummary() {
  const summary = await request('GET', '/v1/analytics/summary', { query: { period: 'week' } });
  record({
    name: 'Analytics summary',
    method: 'GET',
    path: '/v1/analytics/summary?period=week',
    result: summary,
    note: summary.ok ? `shape ${describeShape(summary.json)}` : undefined,
  });

  const users = await request('GET', '/analytics/users', { query: { period: 'week' } });
  record({
    name: 'User analytics',
    method: 'GET',
    path: '/analytics/users?period=week',
    result: users,
    note: users.ok ? `shape ${describeShape(users.json)}` : undefined,
  });

  const safety = await request('GET', '/analytics/safety', { query: { period: 'week' } });
  record({
    name: 'Safety analytics',
    method: 'GET',
    path: '/analytics/safety?period=week',
    result: safety,
    note: safety.ok ? `shape ${describeShape(safety.json)}` : undefined,
  });

  const performance = await request('GET', '/analytics/performance', { query: { period: 'week' } });
  record({
    name: 'Performance analytics',
    method: 'GET',
    path: '/analytics/performance?period=week',
    result: performance,
    note: performance.ok ? `shape ${describeShape(performance.json)}` : undefined,
  });
}

async function probeSupportRequests(targets) {
  const waiting = await request('GET', '/support-requests', { query: { status: 'waiting' } });
  const waitingRows = Array.isArray(waiting.json?.requests) ? waiting.json.requests : [];
  const statusCounts = waitingRows.reduce((acc, row) => {
    const key = String(row?.status ?? 'missing');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const statusSummary = Object.entries(statusCounts)
    .map(([status, count]) => `${status}=${count}`)
    .join(', ');

  record({
    name: 'Support queue (waiting)',
    method: 'GET',
    path: '/support-requests?status=waiting',
    result: waiting,
    note: waiting.ok
      ? `returned=${waitingRows.length}, total=${waiting.json?.total ?? '?'}, waiting_total=${waiting.json?.waiting_total ?? '?'}${
          statusSummary ? `, statuses: ${statusSummary}` : ''
        }`
      : undefined,
  });

  if (waiting.ok && waitingRows.some((row) => row?.status !== 'waiting')) {
    console.log(
      '\n  ! /support-requests?status=waiting returned rows whose status is not "waiting" —' +
        '\n    the server appears to ignore the status filter (a source of phantom queue counts).',
    );
  }

  let requestId = cli.values['support-request-id'] || waitingRows[0]?.id;
  if (!requestId) {
    const anyRequest = await request('GET', '/support-requests', { query: { page: 1, limit: 1 } });
    requestId = anyRequest.json?.requests?.[0]?.id;
  }

  if (!requestId) {
    skip('Support request detail', 'GET', '/support-requests/{id}', 'no support request available to probe');
    skip('Support request update', 'PUT', '/support-requests/{id}', 'no support request available to probe');
  } else {
    targets.supportRequestId = requestId;
    const detail = await request('GET', `/support-requests/${encodeURIComponent(requestId)}`);
    record({
      name: 'Support request detail',
      method: 'GET',
      path: '/support-requests/{id}',
      result: detail,
      note: detail.ok
        ? `status=${detail.json?.status ?? '?'}, urgency=${detail.json?.urgency ?? '?'}, transcript=${Array.isArray(detail.json?.conversation_transcript) ? detail.json.conversation_transcript.length : '?'}`
        : undefined,
    });

    if (cli.flags.has('mutate') && detail.ok) {
      // No-op write: resend the current status/urgency so nothing actually changes.
      const update = await request('PUT', `/support-requests/${encodeURIComponent(requestId)}`, {
        body: { status: detail.json?.status, urgency: detail.json?.urgency },
      });
      record({
        name: 'Support request update',
        method: 'PUT',
        path: '/support-requests/{id}',
        result: update,
        note: update.ok ? 'no-op update accepted' : undefined,
      });
    } else {
      skip(
        'Support request update',
        'PUT',
        '/support-requests/{id}',
        cli.flags.has('mutate') ? 'skipped: detail fetch failed' : 'read-only run: pass --mutate to send a no-op update',
      );
    }
  }

  skip(
    'Support request resolve/close/assign',
    '-',
    '/support-requests/{id}/*',
    'not probed: irreversible or reassigns live data',
  );
}

const PERIOD_ENDPOINTS = [
  { path: '/v1/analytics/summary', label: 'summary' },
  { path: '/analytics/users', label: 'users' },
  { path: '/analytics/safety', label: 'safety' },
  { path: '/analytics/performance', label: 'performance' },
];
const PERIODS = ['today', 'week', 'month', 'year', 'all'];

async function collectPeriodMatrix() {
  const rows = [];

  for (const endpoint of PERIOD_ENDPOINTS) {
    const row = { endpoint: `${endpoint.label}  ${endpoint.path}` };
    const bodies = {};
    for (const period of PERIODS) {
      const result = await request('GET', endpoint.path, { query: { period } });
      bodies[period] = result.text || '';
      row[period] = result.status === 0 ? 'ERR' : String(result.status);
    }

    const allStatus = row.all;
    if (allStatus === '200') {
      row.note =
        bodies.all === bodies.year
          ? "'all' accepted; payload identical to 'year'"
          : "'all' accepted; payload differs from 'year'";
    } else {
      row.note = `'all' rejected (HTTP ${allStatus})`;
    }
    rows.push(row);
  }

  return rows;
}

function printPeriodMatrix(rows) {
  console.log('\nAnalytics period acceptance\n');
  renderTable(rows, [
    { key: 'endpoint', header: 'Endpoint', max: 34 },
    ...PERIODS.map((period) => ({ key: period, header: period, max: 6 })),
    { key: 'note', header: 'Note', max: 46 },
  ]);

  console.log('\n  200 = accepted, 4xx = rejected, ERR = transport error.');
  console.log('  The dashboard sends "year" when "All Time" is selected (resolveApiAnalyticsPeriod).');
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Admin dashboard API probe\n  base: ${BASE_URL}\n  time: ${new Date().toISOString()}\n`);

  const targets = {};
  const authenticated = await probeLogin();
  let periodMatrix = [];

  if (authenticated) {
    await probeAdminSurface(targets);
    await probeAnalyticsSummary();
    await probeSupportRequests(targets);
    if (!cli.flags.has('no-periods')) periodMatrix = await collectPeriodMatrix();
  } else {
    const reason = authFailed ? 'not authenticated' : 'authentication skipped';
    skip('Admin & analytics probes', '-', '-', reason);
  }

  console.log('\nProbe results\n');
  renderTable(results, [
    { key: 'outcome', header: 'Result', max: 6 },
    { key: 'name', header: 'Check', max: 30 },
    { key: 'method', header: 'Method', max: 6 },
    { key: 'path', header: 'Path', max: 48 },
    { key: 'status', header: 'HTTP', max: 5 },
    { key: 'ms', header: 'ms', max: 6 },
    { key: 'note', header: 'Note', max: 70 },
  ]);

  const failed = results.filter((row) => row.outcome === 'FAIL');
  const passed = results.filter((row) => row.outcome === 'PASS').length;
  const skipped = results.filter((row) => row.outcome === 'SKIP').length;

  console.log(`\n${passed} passed, ${failed.length} failed, ${skipped} skipped.`);

  if (periodMatrix.length > 0) printPeriodMatrix(periodMatrix);
  if (failed.length > 0) {
    console.log('\nFailures:');
    for (const failure of failed) {
      console.log(`  - ${failure.method} ${failure.path} → HTTP ${failure.status}: ${failure.note}`);
    }
  }

  if (cli.flags.has('json')) {
    console.log('\nJSON summary\n');
    console.log(JSON.stringify({ baseUrl: BASE_URL, generatedAt: new Date().toISOString(), targets, results }, null, 2));
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\nProbe crashed:', error);
  process.exit(1);
});
