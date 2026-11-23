/**
 * Audit Log Service
 * Manages admin audit logging and tracking of system activities
 * Integrates with backend audit logging endpoints
 */

import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';

const AUDIT_BASE_PATH = '/api/admin/audit';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for audit log requests.');
  }
  return new URL(path, API_BASE_URL).toString();
}

function buildHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function readApiError(response: Response): Promise<string> {
  const bodyText = await response.text();
  if (!bodyText) return response.statusText || 'Audit API request failed';
  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;
    if (typeof parsed.detail === 'string') return parsed.detail;
    if (Array.isArray(parsed.detail)) {
      return parsed.detail
        .map((item) => {
          if (!item || typeof item !== 'object') return String(item);
          const detail = item as Record<string, unknown>;
          const location = Array.isArray(detail.loc) ? detail.loc.join('.') : '';
          const message = typeof detail.msg === 'string' ? detail.msg : 'Validation error';
          return location ? `${location}: ${message}` : message;
        })
        .join('; ');
    }
    if (typeof parsed.message === 'string') return parsed.message;
  } catch {
    return bodyText;
  }
  return bodyText;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error('Empty response body');
  return JSON.parse(text) as T;
}

// Type definitions matching backend response structures
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_type: 'admin' | 'system' | 'automated';
  actor_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  status: 'success' | 'failure' | 'warning';
  details?: Record<string, unknown>;
  ip_address?: string;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  actor_type?: 'admin' | 'system' | 'automated';
  action?: string;
  resource_type?: string;
  status?: 'success' | 'failure' | 'warning';
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface AuditLogStatsResponse {
  total_logs: number;
  logs_today: number;
  logs_this_month: number;
  actions_by_type: Record<string, number>;
  status_distribution: {
    success: number;
    failure: number;
    warning: number;
  };
  top_actors: Array<{
    actor_id: string;
    actor_name: string;
    action_count: number;
  }>;
}

export class AuditLogService {
  /**
   * GET /audit/logs - List audit logs with optional filtering
   */
  static async listAuditLogs(
    options?: AuditLogFilters,
    accessToken?: string,
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.actor_type) params.append('actor_type', options.actor_type);
    if (options?.action) params.append('action', options.action);
    if (options?.resource_type) params.append('resource_type', options.resource_type);
    if (options?.status) params.append('status', options.status);
    if (options?.start_date) params.append('start_date', options.start_date);
    if (options?.end_date) params.append('end_date', options.end_date);
    if (options?.search) params.append('search', options.search);

    const url = `${buildUrl(`${AUDIT_BASE_PATH}/logs`)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await AuthService.fetchWithAuth(
        url,
        {
          method: 'GET',
          headers: buildHeaders(accessToken),
        },
        accessToken,
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<AuditLogListResponse>(response);
    } catch (error) {
      logger.error('Failed to list audit logs', error);
      throw error;
    }
  }

  /**
   * GET /audit/logs/{log_id} - Get audit log details
   */
  static async getAuditLog(
    logId: string,
    accessToken?: string,
  ): Promise<AuditLogEntry> {
    const url = buildUrl(`${AUDIT_BASE_PATH}/logs/${logId}`);

    try {
      const response = await AuthService.fetchWithAuth(
        url,
        {
          method: 'GET',
          headers: buildHeaders(accessToken),
        },
        accessToken,
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<AuditLogEntry>(response);
    } catch (error) {
      logger.error('Failed to get audit log', error);
      throw error;
    }
  }

  /**
   * GET /audit/stats - Get audit log statistics
   */
  static async getAuditStats(
    options?: {
      start_date?: string;
      end_date?: string;
    },
    accessToken?: string,
  ): Promise<AuditLogStatsResponse> {
    const params = new URLSearchParams();
    
    if (options?.start_date) params.append('start_date', options.start_date);
    if (options?.end_date) params.append('end_date', options.end_date);

    const url = `${buildUrl(`${AUDIT_BASE_PATH}/stats`)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await AuthService.fetchWithAuth(
        url,
        {
          method: 'GET',
          headers: buildHeaders(accessToken),
        },
        accessToken,
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<AuditLogStatsResponse>(response);
    } catch (error) {
      logger.error('Failed to get audit statistics', error);
      throw error;
    }
  }

  /**
   * GET /audit/logs/export - Export audit logs
   */
  static async exportAuditLogs(
    options?: AuditLogFilters & { format?: 'csv' | 'json' },
    accessToken?: string,
  ): Promise<string> {
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.actor_type) params.append('actor_type', options.actor_type);
    if (options?.action) params.append('action', options.action);
    if (options?.resource_type) params.append('resource_type', options.resource_type);
    if (options?.status) params.append('status', options.status);
    if (options?.start_date) params.append('start_date', options.start_date);
    if (options?.end_date) params.append('end_date', options.end_date);
    if (options?.search) params.append('search', options.search);
    if (options?.format) params.append('format', options.format);

    const url = `${buildUrl(`${AUDIT_BASE_PATH}/export`)}${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await AuthService.fetchWithAuth(
        url,
        {
          method: 'GET',
          headers: buildHeaders(accessToken),
        },
        accessToken,
      );

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await response.text();
    } catch (error) {
      logger.error('Failed to export audit logs', error);
      throw error;
    }
  }
}
