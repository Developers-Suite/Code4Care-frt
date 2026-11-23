/**
 * Health Metrics Service
 * Retrieves system health metrics, performance data, and uptime statistics
 * Integrates with backend health monitoring endpoints
 */

import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';

const HEALTH_BASE_PATH = '/api/admin/health';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for health requests.');
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
  if (!bodyText) return response.statusText || 'Health API request failed';
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
export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: number;
  timestamp?: string;
}

export interface PerformanceDataPoint {
  timestamp: string;
  time: string; // For chart display (HH:MM format)
  response_time_ms: number;
  error_rate: number;
  uptime_percent: number;
  active_users: number;
  memory_usage_percent: number;
  db_queries_per_minute: number;
}

export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  latency_ms: number;
  error_rate: number;
  uptime_percent: number;
  last_check: string;
}

export interface HealthMetricsResponse {
  timestamp: string;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  uptime_percent: number;
  response_time_avg_ms: number;
  error_rate: number;
  active_sessions: number;
  database_status: 'connected' | 'disconnected' | 'slow';
  services: ServiceHealthStatus[];
  metrics: {
    api_response_time: number;
    system_uptime: number;
    error_rate: number;
    active_engagements: number;
    memory_usage: number;
    database_queries: number;
  };
}

export interface PerformanceHistoryResponse {
  period: '1h' | '6h' | '24h';
  data: PerformanceDataPoint[];
  summary: {
    avg_response_time: number;
    max_response_time: number;
    min_response_time: number;
    avg_error_rate: number;
    avg_uptime: number;
  };
}

export class HealthMetricsService {
  /**
   * GET /health/metrics - Get current system health metrics
   */
  static async getHealthMetrics(
    accessToken?: string,
  ): Promise<HealthMetricsResponse> {
    const url = buildUrl(`${HEALTH_BASE_PATH}/metrics`);

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

      return await readJsonResponse<HealthMetricsResponse>(response);
    } catch (error) {
      logger.error('Failed to get health metrics', error);
      throw error;
    }
  }

  /**
   * GET /health/performance - Get performance history
   */
  static async getPerformanceHistory(
    timeRange: '1h' | '6h' | '24h' = '1h',
    accessToken?: string,
  ): Promise<PerformanceHistoryResponse> {
    const params = new URLSearchParams();
    params.append('period', timeRange);

    const url = `${buildUrl(`${HEALTH_BASE_PATH}/performance`)}?${params.toString()}`;

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

      return await readJsonResponse<PerformanceHistoryResponse>(response);
    } catch (error) {
      logger.error('Failed to get performance history', error);
      throw error;
    }
  }

  /**
   * GET /health/status - Quick health check endpoint
   */
  static async getHealthStatus(
    accessToken?: string,
  ): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; message: string }> {
    const url = buildUrl(`${HEALTH_BASE_PATH}/status`);

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

      return await readJsonResponse<{ status: 'healthy' | 'degraded' | 'unhealthy'; message: string }>(response);
    } catch (error) {
      logger.error('Failed to get health status', error);
      throw error;
    }
  }

  /**
   * GET /health/services - Get each service's status
   */
  static async getServiceStatus(
    accessToken?: string,
  ): Promise<ServiceHealthStatus[]> {
    const url = buildUrl(`${HEALTH_BASE_PATH}/services`);

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

      return await readJsonResponse<ServiceHealthStatus[]>(response);
    } catch (error) {
      logger.error('Failed to get service status', error);
      throw error;
    }
  }
}
