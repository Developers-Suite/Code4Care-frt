/**
 * Authentication Utilities Service
 * Handles token management, refresh, and session lifecycle
 */

import { logger } from '@/utils/logger';
import { safeStorage } from '@/utils/safeStorage';

export interface AdminCurrentUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string;
  permissions?: string[];
  settings?: Record<string, unknown>;
}

export interface TokenPayload {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: AdminCurrentUser;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthSessionEventHandlers {
  onTokenRefreshed?: (accessToken: string) => void;
  onSessionExpired?: () => void;
}

const sessionListeners = new Set<AuthSessionEventHandlers>();
let inflightRefresh: Promise<RefreshTokenResponse> | null = null;
let sessionExpiredEmitted = false;

function emitTokenRefreshed(accessToken: string): void {
  sessionExpiredEmitted = false;
  sessionListeners.forEach((listener) => {
    listener.onTokenRefreshed?.(accessToken);
  });
}

function emitSessionExpired(): void {
  if (sessionExpiredEmitted) {
    return;
  }
  sessionExpiredEmitted = true;
  sessionListeners.forEach((listener) => {
    listener.onSessionExpired?.();
  });
}

const DEFAULT_TOKEN_EXPIRY_SECONDS = 30 * 60;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

const TOKEN_KEY = 'code4care_access_token';
const REFRESH_TOKEN_KEY = 'code4care_refresh_token';
const TOKEN_EXPIRY_KEY = 'code4care_token_expiry';
const ADMIN_REFRESH_TOKEN_PATH = '/admin/refresh-token';
const ADMIN_LOGOUT_PATH = '/admin/logout';
const ADMIN_ME_PATH = '/admin/me';

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for auth requests.');
  }
  return new URL(path, API_BASE_URL).toString();
}

function buildHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function readApiError(response: Response): Promise<string> {
  const bodyText = await response.text();

  if (!bodyText) {
    return response.statusText || 'API request failed';
  }

  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;

    if (typeof parsed.detail === 'string') {
      return parsed.detail;
    }

    if (Array.isArray(parsed.detail)) {
      return parsed.detail
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

    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    return bodyText;
  }

  return bodyText;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function readRefreshTokenResponse(response: Response): Promise<RefreshTokenResponse> {
  const bodyText = await response.text();
  let parsed: unknown = null;

  try {
    parsed = bodyText ? JSON.parse(bodyText) as unknown : null;
  } catch {
    parsed = bodyText;
  }

  if (typeof parsed === 'string') {
    return {
      access_token: parsed,
      token_type: 'bearer',
      expires_in: DEFAULT_TOKEN_EXPIRY_SECONDS,
    };
  }

  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;

    if (typeof record.access_token === 'string') {
      return {
        access_token: record.access_token,
        token_type: typeof record.token_type === 'string' ? record.token_type : 'bearer',
        expires_in: typeof record.expires_in === 'number' ? record.expires_in : DEFAULT_TOKEN_EXPIRY_SECONDS,
      };
    }
  }

  throw new Error('Refresh token response did not include an access token.');
}

function calculateTokenExpiry(expiresIn: number): string {
  // expiresIn is in seconds, calculate when token will expire
  const normalizedExpiresIn = expiresIn > 0 ? expiresIn : DEFAULT_TOKEN_EXPIRY_SECONDS;
  const expiryTime = new Date().getTime() + normalizedExpiresIn * 1000;
  return expiryTime.toString();
}

function isTokenExpired(accessToken?: string): boolean {
  if (!accessToken) {
    return true;
  }

  const expiryTime = safeStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) {
    return true;
  }

  const expiryTimestamp = parseInt(expiryTime, 10);
  const currentTime = new Date().getTime();
  // Consider token expired if 5 minutes or less remaining
  const bufferTime = 5 * 60 * 1000;

  return currentTime > expiryTimestamp - bufferTime;
}

export class AuthService {
  /**
   * Store token after login
   */
  static storeToken(payload: TokenPayload): void {
    try {
      sessionExpiredEmitted = false;
      safeStorage.setItem(TOKEN_KEY, payload.access_token);
      safeStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
      safeStorage.setItem(TOKEN_EXPIRY_KEY, calculateTokenExpiry(payload.expires_in));
      logger.debug('Token stored successfully');
    } catch (error) {
      logger.error('Failed to store token', error);
    }
  }

  /**
   * Subscribe to token refresh and session expiry lifecycle events.
   */
  static subscribeSessionEvents(handlers: AuthSessionEventHandlers): () => void {
    sessionListeners.add(handlers);
    return () => {
      sessionListeners.delete(handlers);
    };
  }

  /**
   * Get current access token
   */
  static getAccessToken(): string | null {
    return safeStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get current refresh token
   */
  static getRefreshToken(): string | null {
    return safeStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if current token is expired
   */
  static isTokenExpired(): boolean {
    const accessToken = this.getAccessToken();
    return isTokenExpired(accessToken ?? undefined);
  }

  /**
   * POST /admin/refresh-token - Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<RefreshTokenResponse> {
    if (inflightRefresh) {
      return inflightRefresh;
    }

    inflightRefresh = (async () => {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        this.clearTokens();
        emitSessionExpired();
        throw new Error('No refresh token available. Please log in again.');
      }

      try {
        const response = await fetch(buildUrl(ADMIN_REFRESH_TOKEN_PATH), {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            refresh_token: refreshToken,
          } satisfies RefreshTokenPayload),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            this.clearTokens();
            emitSessionExpired();
          }
          throw new Error(await readApiError(response));
        }

        const data = await readRefreshTokenResponse(response);

        // Update stored access token and expiry
        safeStorage.setItem(TOKEN_KEY, data.access_token);
        safeStorage.setItem(TOKEN_EXPIRY_KEY, calculateTokenExpiry(data.expires_in));
        emitTokenRefreshed(data.access_token);

        logger.debug('Token refreshed successfully');
        return data;
      } catch (error) {
        logger.error('Failed to refresh token', error);
        throw error;
      }
    })();

    try {
      return await inflightRefresh;
    } finally {
      inflightRefresh = null;
    }
  }

  /**
   * Authenticated fetch helper: prefers newest stored token and transparently
   * refreshes + retries once on HTTP 401 before letting callers handle failure.
   */
  static async fetchWithAuth(
    url: string,
    init: RequestInit = {},
    explicitToken?: string,
  ): Promise<Response> {
    const initialToken = this.getAccessToken() || explicitToken;
    const headers = new Headers(init.headers);
    if (initialToken) {
      headers.set('Authorization', `Bearer ${initialToken}`);
    }

    const response = await fetch(url, { ...init, headers });
    if (response.status !== 401 || !initialToken) {
      return response;
    }

    const latestStored = this.getAccessToken();
    let nextToken: string;

    if (latestStored && latestStored !== initialToken) {
      nextToken = latestStored;
    } else {
      try {
        const refreshed = await this.refreshAccessToken();
        nextToken = refreshed.access_token;
      } catch {
        return response;
      }
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set('Authorization', `Bearer ${nextToken}`);
    return fetch(url, { ...init, headers: retryHeaders });
  }

  /**
   * Get access token, refreshing if expired
   */
  static async getValidAccessToken(): Promise<string> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated. Please log in.');
    }

    if (this.isTokenExpired()) {
      try {
        const refreshed = await this.refreshAccessToken();
        return refreshed.access_token;
      } catch (error) {
        logger.error('Token refresh failed', error);
        throw new Error('Session expired. Please log in again.');
      }
    }

    return accessToken;
  }

  /**
   * GET /admin/me - Fetch the current admin user profile
   */
  static async getCurrentUser(accessToken?: string): Promise<AdminCurrentUser> {
    const token = accessToken || await this.getValidAccessToken();

    const response = await this.fetchWithAuth(
      buildUrl(ADMIN_ME_PATH),
      {
        method: 'GET',
        headers: buildHeaders(token),
      },
      token,
    );

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminCurrentUser>(response);
  }

  /**
   * POST /admin/logout - Invalidate session tokens
   */
  static async logout(accessToken?: string): Promise<void> {
    const token = accessToken || this.getAccessToken();

    if (token) {
      const refreshToken = this.getRefreshToken();
      try {
        await fetch(buildUrl(ADMIN_LOGOUT_PATH), {
          method: 'POST',
          headers: buildHeaders(token),
          body: JSON.stringify({
            access_token: token,
            ...(refreshToken ? { refresh_token: refreshToken } : {}),
          }),
        });
      } catch (error) {
        logger.error('Logout API call failed (continuing with local cleanup)', error);
        // Continue with local cleanup even if API call fails
      }
    }

    // Always clear local tokens
    this.clearTokens();
  }

  /**
   * Clear all stored tokens
   */
  static clearTokens(): void {
    try {
      safeStorage.removeItem(TOKEN_KEY);
      safeStorage.removeItem(REFRESH_TOKEN_KEY);
      safeStorage.removeItem(TOKEN_EXPIRY_KEY);
      logger.debug('Tokens cleared');
    } catch (error) {
      logger.error('Failed to clear tokens', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired();
  }

  /**
   * Get time remaining on token (in seconds)
   */
  static getTokenTimeRemaining(): number {
    const expiryTime = safeStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!expiryTime) {
      return 0;
    }

    const expiryTimestamp = parseInt(expiryTime, 10);
    const currentTime = new Date().getTime();
    const timeRemaining = Math.max(0, expiryTimestamp - currentTime);

    return Math.floor(timeRemaining / 1000); // Convert to seconds
  }
}
