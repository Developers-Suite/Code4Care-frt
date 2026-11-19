// Global kill switch for the AI bot. While engaged, no request is allowed to reach
// the bot API (/v1/chat); the rest of the app (counselor chat, support queue) keeps working.
import { safeStorage } from '@/utils/safeStorage';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'lydiacontactcenter_bot_kill_switch';
const CHANGE_EVENT = 'code4care:bot-kill-switch';

export interface BotKillSwitchState {
  enabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

const DISABLED_STATE: BotKillSwitchState = { enabled: false };

/** Thrown before any network call so the bot API is never reached while shut down. */
export class BotKilledError extends Error {
  constructor() {
    super('The AI assistant is currently paused by the care team.');
    this.name = 'BotKilledError';
  }
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
    };
  } catch (error) {
    logger.warn('Ignoring malformed bot kill switch state', error);
    return DISABLED_STATE;
  }
}

export function isBotKilled(): boolean {
  return getBotKillSwitchState().enabled;
}

export function setBotKilled(enabled: boolean, updatedBy?: string): BotKillSwitchState {
  const state: BotKillSwitchState = {
    enabled,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy?.trim() || undefined,
  };

  safeStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<BotKillSwitchState>(CHANGE_EVENT, { detail: state }));
  }

  return state;
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
