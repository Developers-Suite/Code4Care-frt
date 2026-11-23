import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('AuthService token refresh and 401 handling', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let AuthService: typeof import('./authService').AuthService;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.org');
    vi.stubGlobal('localStorage', createMemoryStorage());
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    ({ AuthService } = await import('./authService'));
    AuthService.storeToken({
      access_token: 'old-access',
      refresh_token: 'valid-refresh',
      token_type: 'bearer',
      expires_in: 3600,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('deduplicates concurrent refreshAccessToken calls into one /admin/refresh-token request', async () => {
    const refreshedSpy = vi.fn();
    const unsubscribe = AuthService.subscribeSessionEvents({ onTokenRefreshed: refreshedSpy });

    fetchMock.mockImplementationOnce(async () =>
      jsonResponse({ access_token: 'new-access', token_type: 'Bearer', expires_in: 3600 }),
    );

    const [first, second] = await Promise.all([
      AuthService.refreshAccessToken(),
      AuthService.refreshAccessToken(),
    ]);

    expect(first.access_token).toBe('new-access');
    expect(second.access_token).toBe('new-access');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.org/admin/refresh-token');
    expect(AuthService.getAccessToken()).toBe('new-access');
    expect(refreshedSpy).toHaveBeenCalledTimes(1);
    expect(refreshedSpy).toHaveBeenCalledWith('new-access');

    unsubscribe();
  });

  it('retries 401 requests once after refreshing and shares the refreshed token across concurrent polls', async () => {
    const refreshedSpy = vi.fn();
    const expiredSpy = vi.fn();
    const unsubscribe = AuthService.subscribeSessionEvents({
      onTokenRefreshed: refreshedSpy,
      onSessionExpired: expiredSpy,
    });

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://api.example.org/admin/refresh-token') {
        return jsonResponse({ access_token: 'fresh-token', token_type: 'Bearer', expires_in: 3600 });
      }
      const headers = new Headers(init?.headers);
      if (headers.get('Authorization') === 'Bearer fresh-token') {
        return jsonResponse({ ok: true }, 200);
      }
      return jsonResponse({ detail: 'Token expired' }, 401);
    });

    const [resA, resB] = await Promise.all([
      AuthService.fetchWithAuth('https://api.example.org/support-requests?status=waiting', { method: 'GET' }, 'old-access'),
      AuthService.fetchWithAuth('https://api.example.org/admin/conversations', { method: 'GET' }, 'old-access'),
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    const refreshCalls = fetchMock.mock.calls.filter(
      ([url]) => String(url) === 'https://api.example.org/admin/refresh-token',
    );
    expect(refreshCalls).toHaveLength(1);
    expect(refreshedSpy).toHaveBeenCalledTimes(1);
    expect(expiredSpy).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('clears tokens and emits onSessionExpired once when refresh returns 401', async () => {
    const expiredSpy = vi.fn();
    const unsubscribe = AuthService.subscribeSessionEvents({ onSessionExpired: expiredSpy });

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://api.example.org/admin/refresh-token') {
        return jsonResponse({ detail: 'Invalid token' }, 401);
      }
      return jsonResponse({ detail: 'Unauthorized' }, 401);
    });

    const [resA, resB] = await Promise.all([
      AuthService.fetchWithAuth('https://api.example.org/support-requests?status=waiting', { method: 'GET' }, 'old-access'),
      AuthService.fetchWithAuth('https://api.example.org/admin/conversations', { method: 'GET' }, 'old-access'),
    ]);

    expect(resA.status).toBe(401);
    expect(resB.status).toBe(401);
    expect(AuthService.getAccessToken()).toBeNull();
    expect(AuthService.getRefreshToken()).toBeNull();
    expect(expiredSpy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('keeps tokens and does not emit onSessionExpired on transient network errors', async () => {
    const expiredSpy = vi.fn();
    const unsubscribe = AuthService.subscribeSessionEvents({ onSessionExpired: expiredSpy });

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://api.example.org/admin/refresh-token') {
        throw new TypeError('Failed to fetch');
      }
      return jsonResponse({ detail: 'Unauthorized' }, 401);
    });

    const res = await AuthService.fetchWithAuth(
      'https://api.example.org/support-requests?status=waiting',
      { method: 'GET' },
      'old-access',
    );

    expect(res.status).toBe(401);
    expect(AuthService.getAccessToken()).toBe('old-access');
    expect(AuthService.getRefreshToken()).toBe('valid-refresh');
    expect(expiredSpy).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('does not log out if retried request returns 401 after a successful refresh (e.g. bad MFA password)', async () => {
    const expiredSpy = vi.fn();
    const unsubscribe = AuthService.subscribeSessionEvents({ onSessionExpired: expiredSpy });

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://api.example.org/admin/refresh-token') {
        return jsonResponse({ access_token: 'fresh-token', token_type: 'Bearer', expires_in: 3600 });
      }
      return jsonResponse({ detail: 'Invalid password' }, 401);
    });

    const res = await AuthService.fetchWithAuth(
      'https://api.example.org/admin/mfa/disable',
      { method: 'POST', body: JSON.stringify({ password: 'wrong', code: '000000' }) },
      'old-access',
    );

    expect(res.status).toBe(401);
    expect(AuthService.getAccessToken()).toBe('fresh-token');
    expect(AuthService.getRefreshToken()).toBe('valid-refresh');
    expect(expiredSpy).not.toHaveBeenCalled();

    unsubscribe();
  });
});
