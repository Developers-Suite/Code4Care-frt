// Clean, Natural Conversational AI Chatbot for SRH - Ghana
import { logger } from "@/utils/logger";

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface UserDemographics {
  ageRange?: string;
  genderIdentity?: string;
  region?: string;
}

export interface ChatApiRequest {
  message: string;
  language: string;
  session_id: string;
}

export type ChatCitation = string | {
  title?: string;
  source?: string;
  excerpt?: string;
  text?: string;
  url?: string;
  page?: string | number;
  [key: string]: unknown;
};

export type SafetyFlag = string | {
  label?: string;
  reason?: string;
  severity?: string;
  message?: string;
  [key: string]: unknown;
};

export interface ChatApiResponse {
  session_id?: string;
  answer: string;
  citations: ChatCitation[];
  safety_flags: SafetyFlag[];
  language_detected: string;
  response_time_ms: number;
}

const CHAT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const CHAT_ENDPOINT = '/v1/chat';
const BACKEND_TIMEOUT_MS = Number(import.meta.env.VITE_CHAT_TIMEOUT_MS) || 60000;

function buildChatUrl(path: string) {
  if (!CHAT_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for chat requests.');
  }

  return new URL(path, CHAT_API_BASE_URL).toString();
}

function safeParseJson(value: string) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return value;
  }
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeChatResponse(payload: unknown, defaultLanguage: string): ChatApiResponse {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const answer = typeof record.answer === 'string'
    ? record.answer
    : typeof record.response === 'string'
      ? record.response
      : '';

  return {
    session_id: typeof record.session_id === 'string' ? record.session_id : undefined,
    answer,
    citations: normalizeArray<ChatCitation>(record.citations),
    safety_flags: normalizeArray<SafetyFlag>(record.safety_flags),
    language_detected: typeof record.language_detected === 'string' ? record.language_detected : defaultLanguage,
    response_time_ms: typeof record.response_time_ms === 'number' ? record.response_time_ms : 0,
  };
}

function isBackendBusyResponse(answer: string): boolean {
  const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, ' ').trim();

  return normalizedAnswer.includes('currently busy') &&
    (normalizedAnswer.includes('try again shortly') || normalizedAnswer.includes('wait a moment'));
}

async function postChatCompletion(payload: ChatApiRequest, endpoint: string, timeoutMs: number = BACKEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildChatUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const bodyText = await response.text();
  const parsedBody = safeParseJson(bodyText);

  if (parsedBody && typeof parsedBody === 'object') {
    const record = parsedBody as Record<string, unknown>;

    if (typeof record.detail === 'string') {
      return record.detail;
    }

    if (Array.isArray(record.detail)) {
      return record.detail
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return String(item);
          }

          const detail = item as Record<string, unknown>;
          const location = Array.isArray(detail.loc) ? detail.loc.join('.') : '';
          const message = typeof detail.msg === 'string' ? detail.msg : 'Validation error';
          return location ? `${location}: ${message}` : message;
        })
        .join('; ');
    }

    if (typeof record.message === 'string') {
      return record.message;
    }
  }

  return bodyText || response.statusText || 'Chat API request failed';
}

export async function requestChatCompletion(
  payload: ChatApiRequest,
  _demographics?: UserDemographics
): Promise<ChatApiResponse> {
  try {
    logger.info('Sending chat request to backend...');
    const response = await postChatCompletion(payload, CHAT_ENDPOINT);

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      throw new Error(`Backend Chat API failed (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    const normalized = normalizeChatResponse(data, payload.language);

    // If the backend suppressed the AI reply due to a live human takeover,
    // return the response as-is so the caller can detect the flag and stay silent.
    const isTakeoverActive = normalized.safety_flags.some(
      (f) => (typeof f === 'string' ? f : (f as Record<string, unknown>).label) === 'human_takeover_active'
    );

    if (!isTakeoverActive && (!normalized.answer || !normalized.answer.trim())) {
      throw new Error('Backend returned empty answer completion');
    }

    if (!isTakeoverActive && isBackendBusyResponse(normalized.answer)) {
      throw new Error('Backend returned a busy placeholder instead of an answer');
    }

    return normalized;
  } catch (error) {
    logger.error('Backend Chat API failed or timed out:', error);
    throw error;
  }
}

