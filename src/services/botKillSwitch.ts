// Global kill switch for the AI bot. Synced with the backend (/v1/bot/status & /admin/bot/status)
// so turning the bot off or on takes effect globally across all web and WhatsApp clients,
// while live counselor chat and the support queue keep working.
import { safeStorage } from '@/utils/safeStorage';
import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'lydiacontactcenter_bot_kill_switch';
const CHANGE_EVENT = 'code4care:bot-kill-switch';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

export interface BotKillSwitchState {
  enabled: boolean; // true = bot is shut down (killed)
  updatedAt?: string;
  updatedBy?: string;
  reason?: string;
}

interface BackendBotStatusResponse {
  enabled: boolean; // true = bot is live
  killed: boolean; // true = bot is shut down
  reason?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

const DISABLED_STATE: BotKillSwitchState = { enabled: false };

/** Thrown before or on a 503 bot_killed response so the chat UI knows the bot is paused. */
export class BotKilledError extends Error {
  constructor(message?: string) {
    super(message || 'The AI assistant is currently paused by the care team.');
    this.name = 'BotKilledError';
  }
}

function buildApiUrl(path: string): string | null {
  if (!API_BASE_URL) {
    return null;
  }
  return new URL(path, API_BASE_URL).toString();
}

function persistAndNotify(state: BotKillSwitchState): BotKillSwitchState {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<BotKillSwitchState>(CHANGE_EVENT, { detail: state }));
  }

  return state;
}

export function getBotKillSwitchState(): BotKillSwitchState {
  const raw = safeStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DISABLED_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BotKillSwitchState>;
    return {
      enabled: parsed?.enabled === true,
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : undefined,
      updatedBy: typeof parsed?.updatedBy === 'string' ? parsed.updatedBy : undefined,
      reason: typeof parsed?.reason === 'string' ? parsed.reason : undefined,
    };
  } catch (error) {
    logger.warn('Ignoring malformed bot kill switch state', error);
    return DISABLED_STATE;
  }
}

export function isBotKilled(): boolean {
  return getBotKillSwitchState().enabled;
}

export function setBotKilled(enabled: boolean, updatedBy?: string, reason?: string): BotKillSwitchState {
  return persistAndNotify({
    enabled,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy?.trim() || undefined,
    reason: reason?.trim() || undefined,
  });
}

/** Fetch the authoritative global bot status from the backend and update local cache. */
export async function syncBotKillSwitchFromBackend(accessToken?: string): Promise<BotKillSwitchState> {
  const path = accessToken ? '/admin/bot/status' : '/v1/bot/status';
  const url = buildApiUrl(path);
  if (!url) {
    return getBotKillSwitchState();
  }

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = accessToken
      ? await AuthService.fetchWithAuth(url, { method: 'GET', headers }, accessToken)
      : await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      return getBotKillSwitchState();
    }

    const data = (await response.json()) as BackendBotStatusResponse;
    return persistAndNotify({
      enabled: Boolean(data.killed),
      updatedAt: data.updated_at || undefined,
      updatedBy: data.updated_by || undefined,
      reason: data.reason || undefined,
    });
  } catch (error) {
    logger.warn('Could not sync bot kill switch state from backend', error);
    return getBotKillSwitchState();
  }
}

/** Admin-only: toggle the global bot kill switch on the backend. */
export async function updateBotKillSwitchOnBackend(
  killed: boolean,
  accessToken?: string,
  reason?: string,
): Promise<BotKillSwitchState> {
  const url = buildApiUrl('/admin/bot/status');
  if (!url) {
    throw new Error('VITE_API_BASE_URL is required to update bot status.');
  }
  if (!accessToken) {
    throw new Error('Admin session expired. Please sign in again.');
  }

  const response = await AuthService.fetchWithAuth(
    url,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        killed,
        reason: reason?.trim() || null,
      }),
    },
    accessToken,
  );

  if (!response.ok) {
    let detail = response.statusText || 'Failed to update bot status';
    try {
      const parsed = (await response.json()) as Record<string, unknown>;
      if (typeof parsed.detail === 'string') {
        detail = parsed.detail;
      }
    } catch {
      // keep default message
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as BackendBotStatusResponse;
  return persistAndNotify({
    enabled: Boolean(data.killed),
    updatedAt: data.updated_at || new Date().toISOString(),
    updatedBy: data.updated_by || undefined,
    reason: data.reason || undefined,
  });
}

/** Subscribe to kill switch changes from this tab and from other tabs of the same browser. */
export function subscribeBotKillSwitch(listener: (state: BotKillSwitchState) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleLocalChange = (event: Event) => {
    const detail = (event as CustomEvent<BotKillSwitchState>).detail;
    listener(detail ?? getBotKillSwitchState());
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) {
      return;
    }
    listener(getBotKillSwitchState());
  };

  window.addEventListener(CHANGE_EVENT, handleLocalChange);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleLocalChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}

/** Call before every bot API request. Throws {@link BotKilledError} when shut down. */
export function assertBotApiEnabled(): void {
  if (isBotKilled()) {
    throw new BotKilledError();
  }
}
