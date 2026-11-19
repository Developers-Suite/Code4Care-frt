/**
 * Support Requests Service
 * Handles all support request operations per BACKEND_API_SPECIFICATION
 */

import { logger } from '@/utils/logger';

export type SupportRequestStatus = 'waiting' | 'assigned' | 'active' | 'resolved' | 'closed';
export type SupportRequestType = 'escalation' | 'scheduled_consultation' | 'follow_up';
export type RequestReason = 'safety' | 'complex_question' | 'follow_up' | 'scheduled';
export type RequestUrgency = 'normal' | 'high' | 'critical';

export interface ChatContext {
  topic: string;
  last_message: string;
  session_id: string;
}

export interface CreateSupportRequestPayload {
  user_id: string;
  user_nickname: string;
  age_range: string;
  gender_identity: string;
  region: string;
  language: string;
  request_type: SupportRequestType;
  reason: RequestReason;
  urgency: RequestUrgency;
  chat_context: ChatContext;
  safety_flags_triggered: string[];
  requested_specialty?: string;
}

export interface SupportRequestCreationResponse {
  id: string;
  session_id?: string; // Backend returns session_id
  user_id?: string;    // Also accept user_id for compatibility
  status: SupportRequestStatus;
  created_at: string;
  assigned_staff_id: string | null;
  assigned_staff_name?: string | null;
  position_in_queue: number;
  estimated_wait_time_minutes?: number;
  urgency: RequestUrgency;
}

export interface AssignedStaff {
  id: string;
  name?: string;
  availability?: 'available' | 'busy' | 'offline';
}

export interface SupportRequestListItem {
  id: string;
  session_id?: string; // Backend returns session_id
  user_id?: string;    // Also accept user_id for compatibility
  user_nickname: string;
  age_range: string;
  gender_identity: string;
  region: string;
  status: SupportRequestStatus;
  urgency: RequestUrgency;
  reason: RequestReason;
  created_at: string;
  assigned_staff?: AssignedStaff;
  /** Flat staff ID returned directly by GET /support-requests (no nested object). */
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  estimated_wait_time_minutes?: number;
  /** Present once a consultant has been connected to the request. */
  duration_minutes?: number;
  notes?: string;
  resolved_at?: string;
  conversation_id?: string;
  safety_flags: string[];
}

export interface SupportRequestListResponse {
  requests: SupportRequestListItem[];
  total: number;
  page: number;
  limit: number;
  waiting_total: number;
  high_priority: number;
}

export interface ConversationMessage {
  role: 'user' | 'consultant';
  message: string;
  timestamp: string;
}

export interface SupportRequestDetails {
  id: string;
  user_id: string;
  user_nickname: string;
  age_range: string;
  gender_identity: string;
  region: string;
  language: string;
  status: SupportRequestStatus;
  urgency: RequestUrgency;
  request_type: SupportRequestType;
  reason: RequestReason;
  created_at: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  assigned_at?: string;
  started_at?: string;
  resolved_at?: string;
  duration_minutes?: number;
  chat_context: ChatContext;
  conversation_transcript: ConversationMessage[];
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
}

export interface UpdateSupportRequestPayload {
  status?: SupportRequestStatus;
  assigned_staff_id?: string;
  notes?: string;
  urgency?: RequestUrgency;
  follow_up_required?: boolean;
  follow_up_date?: string;
  resolution_notes?: string;
}

export interface AssignRequestPayload {
  staff_id: string;
  auto_start?: boolean;
}

export interface ResolveSupportRequestPayload {
  resolution_notes: string;
  satisfaction_rating?: 1 | 2 | 3 | 4 | 5;
  follow_up_required: boolean;
  follow_up_date?: string;
}

export interface CloseSupportRequestPayload {
  reason: 'user_cancelled' | 'no_response' | 'transferred' | 'other';
  notes?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

const SUPPORT_REQUESTS_BASE_PATH = '/support-requests';

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for support request service.');
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

export class SupportRequestService {
  /**
   * POST /support-requests - Create new support request
   */
  static async createSupportRequest(
    payload: CreateSupportRequestPayload,
  ): Promise<SupportRequestCreationResponse> {
    try {
      const response = await fetch(buildUrl(SUPPORT_REQUESTS_BASE_PATH), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<SupportRequestCreationResponse>(response);
    } catch (error) {
      logger.error('Failed to create support request', error);
      throw error;
    }
  }

  /**
   * GET /support-requests - List support requests with filtering
   */
  static async listSupportRequests(
    options?: {
      page?: number;
      limit?: number;
      status?: SupportRequestStatus;
      urgency?: RequestUrgency;
      assigned_to?: string;
      staff_id?: string;
      start_date?: string;
      end_date?: string;
      sort_by?: 'created_at' | 'urgency' | 'status';
    },
    accessToken?: string,
  ): Promise<SupportRequestListResponse> {
    const params = new URLSearchParams();

    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.status) params.append('status', options.status);
    if (options?.urgency) params.append('urgency', options.urgency);
    if (options?.assigned_to) params.append('assigned_to', options.assigned_to);
    if (options?.staff_id) params.append('staff_id', options.staff_id);
    if (options?.start_date) params.append('start_date', options.start_date);
    if (options?.end_date) params.append('end_date', options.end_date);
    if (options?.sort_by) params.append('sort_by', options.sort_by);

    const url = `${buildUrl(SUPPORT_REQUESTS_BASE_PATH)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<SupportRequestListResponse>(response);
    } catch (error) {
      logger.error('Failed to list support requests', error);
      throw error;
    }
  }

  /**
   * GET /support-requests/{request_id} - Get detailed information for a support request
   */
  static async getSupportRequestDetails(
    requestId: string,
    accessToken?: string,
  ): Promise<SupportRequestDetails> {
    try {
      const response = await fetch(buildUrl(`${SUPPORT_REQUESTS_BASE_PATH}/${requestId}`), {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<SupportRequestDetails>(response);
    } catch (error) {
      logger.error(`Failed to get support request details for ${requestId}`, error);
      throw error;
    }
  }

  /**
   * PUT /support-requests/{request_id} - Update support request status, assignment, or notes
   */
  static async updateSupportRequest(
    requestId: string,
    payload: UpdateSupportRequestPayload,
    accessToken?: string,
  ): Promise<{ id: string; status: SupportRequestStatus; assigned_staff_id?: string; assigned_staff_name?: string; updated_at: string }> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildUrl(`${SUPPORT_REQUESTS_BASE_PATH}/${requestId}`), {
        method: 'PUT',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse(response);
    } catch (error) {
      logger.error(`Failed to update support request ${requestId}`, error);
      throw error;
    }
  }

  /**
   * POST /support-requests/{request_id}/assign - Assign or claim a support request
   */
  static async assignSupportRequest(
    requestId: string,
    payload: AssignRequestPayload,
    accessToken?: string,
  ): Promise<{ id: string; status: SupportRequestStatus; assigned_staff_id: string; assigned_at: string }> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildUrl(`${SUPPORT_REQUESTS_BASE_PATH}/${requestId}/assign`), {
        method: 'POST',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse(response);
    } catch (error) {
      logger.error(`Failed to assign support request ${requestId}`, error);
      throw error;
    }
  }

  /**
   * POST /support-requests/{request_id}/resolve - Mark request as resolved
   */
  static async resolveSupportRequest(
    requestId: string,
    payload: ResolveSupportRequestPayload,
    accessToken?: string,
  ): Promise<{ id: string; status: SupportRequestStatus; resolved_at: string; duration_minutes: number; follow_up_scheduled: boolean }> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildUrl(`${SUPPORT_REQUESTS_BASE_PATH}/${requestId}/resolve`), {
        method: 'POST',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse(response);
    } catch (error) {
      logger.error(`Failed to resolve support request ${requestId}`, error);
      throw error;
    }
  }

  /**
   * POST /support-requests/{request_id}/close - Close and archive a support request
   */
  static async closeSupportRequest(
    requestId: string,
    payload: CloseSupportRequestPayload,
    accessToken?: string,
  ): Promise<{ id: string; status: SupportRequestStatus; closed_at: string }> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildUrl(`${SUPPORT_REQUESTS_BASE_PATH}/${requestId}/close`), {
        method: 'POST',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse(response);
    } catch (error) {
      logger.error(`Failed to close support request ${requestId}`, error);
      throw error;
    }
  }
}
