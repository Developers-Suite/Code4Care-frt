/**
 * User Management Service
 * Handles all user-related API calls per BACKEND_API_SPECIFICATION
 */

import { logger } from '@/utils/logger';

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserStatusFilter = UserStatus | 'active_suspended';
export type AgeRange = '10-14' | '15-19' | '20-24' | '25+';
export type GenderIdentity = 'male' | 'female' | 'non-binary' | 'prefer-not-say';

export interface UserStatistics {
  total_sessions: number;
  total_messages: number;
  total_session_duration_minutes: number;
  average_session_duration_minutes: number;
  topics_discussed: string[];
  consultant_escalations: number;
  panic_button_used: number;
  story_modules_started: number;
  story_modules_completed: number;
}

export interface SafetyProfile {
  self_harm_mentions: number;
  suicidal_ideation_mentions: number;
  abuse_mentions: number;
  crisis_interventions: number;
  flags_total: number;
  escalations: number;
  requires_follow_up: boolean;
  follow_up_notes?: string;
}

export interface EngagementMetrics {
  score: number;
  category: 'high' | 'medium' | 'low';
  last_engagement_date: string;
}

export interface ChatHistorySummary {
  oldest_message_date: string;
  newest_message_date: string;
  message_count: number;
  topics: string[];
}

export interface UserDetails {
  id: string;
  nickname: string;
  age_range: AgeRange;
  gender_identity: GenderIdentity;
  region: string;
  language: string;
  created_at: string;
  last_active: string;
  status: UserStatus;
  statistics: UserStatistics;
  safety_profile: SafetyProfile;
  engagement: EngagementMetrics;
  chat_history_summary: ChatHistorySummary;
}

export interface UserListItem {
  id: string;
  nickname: string;
  age_range: AgeRange;
  gender_identity: GenderIdentity;
  region: string;
  language: string;
  created_at: string;
  last_active: string;
  status: UserStatus;
  total_sessions: number;
  total_messages: number;
  engagement_score: number;
  last_message_date: string;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  status_counts?: { active: number; inactive: number; suspended: number };
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'consultant';
  message: string;
  timestamp: string;
  language?: string;
  response_time_ms?: number;
}

export interface UserChatHistoryResponse {
  user_id: string;
  total_messages: number;
  messages: ChatMessage[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

export interface UpdateUserRequest {
  status?: UserStatus;
  reason_for_change?: string;
  follow_up_notes?: string;
  follow_up_required?: boolean;
  assigned_consultant?: string;
}

export interface UserDeleteRequest {
  reason: 'user_request' | 'gdpr' | 'safety';
  confirmation_code: string;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
)?.trim();

const USERS_BASE_PATH = '/users';

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for user management requests.');
  }
  return new URL(path, API_BASE_URL).toString();
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

function toStringValue(value: unknown, defaultValue = ''): string {
  return typeof value === 'string' ? value : defaultValue;
}

function normalizeUserListItem(rawUser: unknown): UserListItem {
  const user = isRecord(rawUser) ? rawUser : {};

  return {
    id: toStringValue(user.id),
    nickname: toStringValue(user.nickname, 'Anonymous'),
    age_range: toStringValue(user.age_range, 'unknown') as AgeRange,
    gender_identity: toStringValue(user.gender_identity, 'prefer-not-say') as GenderIdentity,
    region: toStringValue(user.region, 'Unknown'),
    language: toStringValue(user.language, 'en'),
    created_at: toStringValue(user.created_at),
    last_active: toStringValue(user.last_active),
    status: toStringValue(user.status, 'active') as UserStatus,
    total_sessions: toNumber(user.total_sessions),
    total_messages: toNumber(user.total_messages),
    engagement_score: Math.max(0, Math.min(100, toNumber(user.engagement_score))),
    last_message_date: toStringValue(user.last_message_date, toStringValue(user.last_active)),
  };
}

function normalizeUserListResponse(payload: unknown): UserListResponse {
  const root = isRecord(payload) ? payload : {};
  const nestedData = isRecord(root.data) ? root.data : undefined;
  const source = nestedData ?? root;

  const usersRaw = Array.isArray(source.users)
    ? source.users
    : Array.isArray(source.items)
      ? source.items
      : [];

  const users = usersRaw.map(normalizeUserListItem).filter((user) => Boolean(user.id));

  const rawCounts = isRecord(source.status_counts) ? source.status_counts : undefined;

  return {
    users,
    total: toNumber(source.total, users.length),
    page: toNumber(source.page, 1),
    limit: toNumber(source.limit, users.length || 50),
    pages: toNumber(source.pages, 1),
    status_counts: rawCounts
      ? {
          active: toNumber(rawCounts.active),
          inactive: toNumber(rawCounts.inactive),
          suspended: toNumber(rawCounts.suspended),
        }
      : undefined,
  };
}

export class UserManagementService {
  /**
   * GET /users - List all users with pagination and filtering
   */
  static async listUsers(
    options?: {
      page?: number;
      limit?: number;
      status?: UserStatusFilter;
      age_range?: AgeRange;
      gender?: GenderIdentity;
      region?: string;
      search?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    },
    accessToken?: string,
  ): Promise<UserListResponse> {
    const params = new URLSearchParams();

    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.status) params.append('status', options.status);
    if (options?.age_range) params.append('age_range', options.age_range);
    if (options?.gender) params.append('gender', options.gender);
    if (options?.region) params.append('region', options.region);
    if (options?.search) params.append('search', options.search);
    if (options?.sort_by) params.append('sort_by', options.sort_by);
    if (options?.sort_order) params.append('sort_order', options.sort_order);

    const url = `${buildUrl(USERS_BASE_PATH)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        const apiError = await readApiError(response);
        throw new Error(`GET /users failed (${response.status}): ${apiError}`);
      }

      const payload = await readJsonResponse<unknown>(response);
      return normalizeUserListResponse(payload);
    } catch (error) {
      logger.error('Failed to list users', error);
      throw error;
    }
  }

  /**
   * GET /users/{user_id} - Get detailed information for a specific user
   */
  static async getUserDetails(
    userId: string,
    accessToken?: string,
  ): Promise<UserDetails> {
    try {
      const response = await fetch(buildUrl(`${USERS_BASE_PATH}/${encodePathSegment(userId)}`), {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<UserDetails>(response);
    } catch (error) {
      logger.error(`Failed to get user details for ${userId}`, error);
      throw error;
    }
  }

  /**
   * GET /users/{user_id}/chat-history - Retrieve full chat history for a user
   */
  static async getUserChatHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      start_date?: string;
      end_date?: string;
      search?: string;
    },
    accessToken?: string,
  ): Promise<UserChatHistoryResponse> {
    const params = new URLSearchParams();

    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.offset) params.append('offset', String(options.offset));
    if (options?.start_date) params.append('start_date', options.start_date);
    if (options?.end_date) params.append('end_date', options.end_date);
    if (options?.search) params.append('search', options.search);

    const safeUserPath = `${USERS_BASE_PATH}/${encodePathSegment(userId)}/chat-history`;
    const url = `${buildUrl(safeUserPath)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<UserChatHistoryResponse>(response);
    } catch (error) {
      logger.error(`Failed to get chat history for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * PUT /users/{user_id} - Update user account status or notes
   */
  static async updateUser(
    userId: string,
    payload: UpdateUserRequest,
    accessToken?: string,
  ): Promise<{ id: string; status: UserStatus; updated_at: string; reason?: string }> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildUrl(`${USERS_BASE_PATH}/${encodePathSegment(userId)}`), {
        method: 'PUT',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const apiError = await readApiError(response);
        throw new Error(`PUT /users/${userId} failed (${response.status}): ${apiError}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await readJsonResponse(response);
      }

      return {
        id: userId,
        status: (payload.status || 'active') as UserStatus,
        updated_at: new Date().toISOString(),
        reason: payload.reason_for_change,
      };
    } catch (error) {
      logger.error(`Failed to update user ${userId}`, error);
      throw error;
    }
  }

  /**
   * DELETE /users/{user_id} - Completely remove user data (GDPR compliance)
   */
  static async deleteUser(
    userId: string,
    payload: UserDeleteRequest,
    accessToken?: string,
  ): Promise<{ id: string; deleted: boolean; deleted_at: string; data_retention: string }> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildUrl(`${USERS_BASE_PATH}/${encodePathSegment(userId)}`), {
        method: 'DELETE',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse(response);
    } catch (error) {
      logger.error(`Failed to delete user ${userId}`, error);
      throw error;
    }
  }
}
