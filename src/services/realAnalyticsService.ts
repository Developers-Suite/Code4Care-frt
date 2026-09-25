/**
 * Real Analytics Service
 * Connects to backend analytics endpoints per BACKEND_API_SPECIFICATION
 */

import { logger } from '@/utils/logger';

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year' | string;

export interface AnalyticsSummary {
  generated_at: string;
  period: AnalyticsPeriod;
  summary: {
    total_active_users?: number;
    new_users_total?: number;
    new_users_in_period?: number;
    returning_users?: number;
    total_conversations?: number;
    conversations_in_period?: number;
    total_messages?: number;
    messages_in_period?: number;
    average_session_duration_minutes?: number;
    average_messages_per_session?: number;
    [key: string]: unknown;
  };
  demographics: Record<string, unknown>;
  engagement: Record<string, unknown>;
  safety: Record<string, unknown>;
  performance: Record<string, unknown>;
  funnel: Record<string, unknown>;
  trends: Array<Record<string, unknown>>;
}

export interface AnalyticsOverviewSummary {
  period: AnalyticsPeriod;
  generatedAt?: string;
  generated_at?: string;
  summary?: Record<string, unknown>;
  demographics: Record<string, unknown>;
  engagement?: Record<string, unknown> & {
    topics?: Array<Record<string, unknown>>;
  };
  topicEngagement?: Array<Record<string, unknown>>;
  safety?: Record<string, unknown>;
  safetyMetrics?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  funnel?: Record<string, unknown>;
  trends?: Array<Record<string, unknown>>;
}

export interface TopicEngagementItem {
  topic: string;
  inquiries?: number;
  avg_session_time_seconds?: number;
  satisfaction_score?: number;
  trending?: boolean;
  change_vs_last_period?: number;
  common_questions?: string[];
  age_groups?: Record<string, unknown>;
  gender_breakdown?: Record<string, unknown>;
  count?: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
  avg_satisfaction?: number;
}

export interface TopicEngagementResponse {
  period: string;
  topics: TopicEngagementItem[];
}

export interface UserAnalyticsResponse {
  period: string;
  total_active_users: number;
  new_users: number;
  returning_users: number;
  retention_rate: number;
  sessions: Record<string, unknown>;
  engagement_distribution: Record<string, unknown>;
  demographics: Record<string, unknown>;
}

export interface SafetyIncident {
  id: string;
  incident_type: 'self-harm' | 'suicidal' | 'abuse' | 'panic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-review' | 'resolved' | 'escalated';
  reported_at: string;
  [key: string]: unknown;
}

export interface SafetyAnalyticsResponse {
  period: string;
  incidents: {
    total: number;
    [key: string]: unknown;
  };
  severity_distribution: Record<string, number>;
  escalations: Record<string, unknown>;
  trends: Record<string, unknown>;
  demographics: Record<string, unknown>;
}

export interface PerformanceMetricsResponse {
  period: string;
  response_time: {
    avg_ms: number;
    min_ms: number;
    max_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  message_processing: {
    success_rate: number;
    failed_count: number;
    total_processed: number;
  };
  uptime: {
    percent: number;
    incidents: number;
    [key: string]: unknown;
  };
  errors: Record<string, unknown>;
  service_availability: Record<string, string>;
}

export interface SessionAnalyticsPayload {
  session_id: string;
  user_id?: string;
  age_range: string;
  gender_identity: string;
  region: string;
  language: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  messages_exchanged: number;
  topics_discussed: string[];
  panic_button_used: boolean;
  crisis_support_accessed: boolean;
  story_modules_started: number;
  story_modules_completed: number;
  pharmacy_searches: number;
  satisfaction_rating?: number;
  would_return: boolean;
  safety_flags: string[];
}

export interface SessionAnalyticsResponse {
  session_id: string;
  recorded_at: string;
  status: 'recorded';
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

const ANALYTICS_BASE_PATH = '/analytics';

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for analytics requests.');
  }
  return new URL(path, API_BASE_URL).toString();
}

function buildUrlWithParams(path: string, params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return `${buildUrl(path)}${queryString ? `?${queryString}` : ''}`;
}

function getNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
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

function normalizeTrendItem(item: Record<string, unknown>) {
  return {
    ...item,
    timestamp: item.timestamp ?? item.date ?? item.period ?? item.created_at ?? '',
    value: getNumber(item, 'value', 'engagements', 'count', 'messages', 'sessions'),
  };
}

function normalizeTopicEngagementItem(item: Record<string, unknown>) {
  return {
    ...item,
    topic: typeof item.topic === 'string' ? item.topic : String(item.topic ?? 'Unknown'),
    inquiries: getNumber(item, 'inquiries', 'count', 'value'),
    avg_session_time_seconds: getNumber(item, 'avg_session_time_seconds', 'avgSessionTime', 'avg_session_time'),
    satisfaction_score: getNumber(item, 'satisfaction_score', 'satisfactionScore', 'avg_satisfaction'),
    trending: Boolean(item.trending ?? item.trend === 'up'),
  };
}

function normalizeRecordSection(
  source: Record<string, unknown> | undefined,
  aliases: Record<string, string[]>,
) {
  const normalized: Record<string, unknown> = {
    ...(source ?? {}),
  };

  Object.entries(aliases).forEach(([targetKey, keys]) => {
    if (normalized[targetKey] !== undefined) {
      return;
    }

    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined) {
        normalized[targetKey] = value;
        return;
      }
    }
  });

  return normalized;
}

function normalizeAnalyticsOverviewSummary(data: AnalyticsOverviewSummary): AnalyticsSummary {
  const summary = data.summary ?? {};
  const demographics = data.demographics ?? {};
  const safetyMetrics = data.safetyMetrics ?? data.safety ?? {};
  const performance = data.performance ?? {};
  const funnel = data.funnel ?? {};
  const rawTopicEngagement = data.topicEngagement ?? data.engagement?.topics ?? [];
  const topicEngagement = rawTopicEngagement.map((item) => normalizeTopicEngagementItem(item));
  const totalTopicInquiries = topicEngagement.reduce((total, item) => total + getNumber(item, 'inquiries', 'count', 'value'), 0);
  const engagementRecord = normalizeRecordSection(data.engagement, {
    topics: ['topics'],
    high_engagement_topics: ['high_engagement_topics', 'highEngagementTopics'],
    low_engagement_topics: ['low_engagement_topics', 'lowEngagementTopics'],
  });
  const safetyRecord = normalizeRecordSection(safetyMetrics, {
    panic_exits_total: ['panic_exits_total', 'panicExitsTotal'],
    panic_exits_in_period: ['panic_exits_in_period', 'panicExitsToday', 'panic_exits_today'],
    crisis_interventions: ['crisis_interventions', 'crisisInterventions', 'crisis_interventions_triggered', 'crisisInterventionsTriggered'],
    self_harm_mentions: ['self_harm_mentions', 'selfHarmMentions', 'self_harm_mentions_detected'],
    suicidal_ideation_mentions: ['suicidal_ideation_mentions', 'suicidalIdeationMentions', 'suicidal_ideation'],
    abuse_mentions: ['abuse_mentions', 'abuseMentionsDetected', 'abuse_mentions_detected'],
    severe_distress_mentions: ['severe_distress_mentions', 'severeDistressMentions', 'severe_distress'],
    concerned_users_followed_up: ['concerned_users_followed_up', 'concernedUsersFollowedUp', 'followed_up'],
    risks_escalated_to_human: ['risks_escalated_to_human', 'risksEscalatedToHuman', 'total_escalated'],
  });
  const performanceRecord = normalizeRecordSection(performance, {
    avgResponseTime: ['avgResponseTime', 'avg_response_time_ms', 'response_time_ms'],
    systemUptime: ['systemUptime', 'system_uptime_percent', 'uptime_percent'],
    messageProcessingSuccess: ['messageProcessingSuccess', 'message_processing_success_percent', 'success_rate'],
    crashesOrErrors: ['crashesOrErrors', 'crashes_or_errors'],
    consecutiveHours: ['consecutiveHours', 'consecutive_hours_service'],
  });
  const funnelRecord = normalizeRecordSection(funnel, {
    total_visitors: ['total_visitors', 'totalVisitors', 'visitors'],
    completed_onboarding: ['completed_onboarding', 'completedOnboarding', 'onboarded'],
    had_first_chat: ['had_first_chat', 'hadFirstChat', 'firstChat'],
    completed_story_module: ['completed_story_module', 'completedStoryModule', 'storyModule'],
    used_pharmacy: ['used_pharmacy', 'usedPharmacy'],
    accessed_crisis_support: ['accessed_crisis_support', 'accessedCrisisSupport'],
    return_rate_percent: ['return_rate_percent', 'returnRatePercent'],
  });

  return {
    generated_at: data.generatedAt ?? data.generated_at ?? new Date().toISOString(),
    period: data.period,
    summary: {
      ...summary,
      total_active_users: getNumber(summary, 'total_active_users', 'totalActiveUsers', 'activeUsers', 'active_users') || getNumber(demographics, 'totalActiveUsers', 'total_active_users', 'activeUsers', 'active_users'),
      new_users_total: getNumber(summary, 'new_users_total', 'newUsersTotal', 'new_users'),
      new_users_in_period: getNumber(summary, 'new_users_in_period', 'newUsersInPeriod'),
      returning_users: getNumber(summary, 'returning_users', 'returningUsers'),
      total_conversations: getNumber(summary, 'total_conversations', 'totalConversations', 'conversations') || totalTopicInquiries,
      conversations_in_period: getNumber(summary, 'conversations_in_period', 'conversationsInPeriod') || totalTopicInquiries,
      average_satisfaction: getNumber(summary, 'average_satisfaction', 'averageSatisfaction'),
      total_messages: getNumber(summary, 'total_messages', 'totalMessages', 'messages') || getNumber(performance, 'totalMessages', 'total_messages', 'messages'),
      messages_in_period: getNumber(summary, 'messages_in_period', 'messagesInPeriod'),
      average_session_duration_minutes: getNumber(summary, 'average_session_duration_minutes', 'averageSessionDurationMinutes', 'avg_session_duration_minutes'),
      average_messages_per_session: getNumber(summary, 'average_messages_per_session', 'averageMessagesPerSession'),
    },
    demographics: {
      ...demographics,
      ageRange: demographics.ageRange ?? demographics.age_range ?? demographics.ageGroups ?? demographics.age_groups ?? {},
      age_range: demographics.age_range ?? demographics.ageRange ?? demographics.ageGroups ?? demographics.age_groups ?? {},
      gender: demographics.gender ?? demographics.by_gender ?? {},
      languagePreference: demographics.languagePreference ?? demographics.language_preference ?? {},
      language_preference: demographics.language_preference ?? demographics.languagePreference ?? {},
      regions: demographics.regions ?? demographics.region ?? demographics.regionBreakdown ?? demographics.region_breakdown ?? {},
      region_breakdown: demographics.region_breakdown ?? demographics.regionBreakdown ?? demographics.regions ?? {},
      totalActiveUsers: demographics.totalActiveUsers ?? demographics.total_active_users ?? demographics.activeUsers ?? demographics.active_users ?? 0,
    },
    engagement: {
      ...engagementRecord,
      topics: topicEngagement,
      topicEngagement,
    },
    safety: {
      ...safetyRecord,
      panic_exits_total: getNumber(safetyRecord, 'panic_exits_total', 'panicExitsTotal', 'panic_exits'),
      panic_exits_in_period: getNumber(safetyRecord, 'panic_exits_in_period', 'panicExitsToday', 'panic_exits_today'),
      crisis_interventions: getNumber(safetyRecord, 'crisis_interventions', 'crisisInterventions', 'crisisInterventionsTriggered', 'crisis_interventions_triggered'),
      self_harm_mentions: getNumber(safetyRecord, 'self_harm_mentions', 'selfHarmMentions', 'self_harm_mentions_detected'),
      suicidal_ideation_mentions: getNumber(safetyRecord, 'suicidal_ideation_mentions', 'suicidalIdeationMentions', 'suicidal_ideation'),
      abuse_mentions: getNumber(safetyRecord, 'abuse_mentions', 'abuseMentionsDetected', 'abuse_mentions_detected'),
      severe_distress_mentions: getNumber(safetyRecord, 'severe_distress_mentions', 'severeDistressMentions', 'severe_distress'),
      concerned_users_followed_up: getNumber(safetyRecord, 'concerned_users_followed_up', 'concernedUsersFollowedUp', 'followed_up'),
      risks_escalated_to_human: getNumber(safetyRecord, 'risks_escalated_to_human', 'risksEscalatedToHuman', 'total_escalated'),
    },
    performance: {
      ...performanceRecord,
      avgResponseTime: getNumber(performanceRecord, 'avgResponseTime', 'avg_response_time_ms', 'response_time_ms'),
      systemUptime: getNumber(performanceRecord, 'systemUptime', 'system_uptime_percent', 'uptime_percent'),
      messageProcessingSuccess: getNumber(performanceRecord, 'messageProcessingSuccess', 'message_processing_success_percent', 'success_rate'),
      crashesOrErrors: getNumber(performanceRecord, 'crashesOrErrors', 'crashes_or_errors'),
      consecutiveHours: getNumber(performanceRecord, 'consecutiveHours', 'consecutive_hours_service'),
    },
    funnel: {
      ...funnelRecord,
      total_visitors: getNumber(funnelRecord, 'total_visitors', 'totalVisitors', 'visitors'),
      completed_onboarding: getNumber(funnelRecord, 'completed_onboarding', 'completedOnboarding', 'onboarded'),
      had_first_chat: getNumber(funnelRecord, 'had_first_chat', 'hadFirstChat', 'firstChat'),
      completed_story_module: getNumber(funnelRecord, 'completed_story_module', 'completedStoryModule', 'storyModule'),
      used_pharmacy: getNumber(funnelRecord, 'used_pharmacy', 'usedPharmacy'),
      accessed_crisis_support: getNumber(funnelRecord, 'accessed_crisis_support', 'accessedCrisisSupport'),
      return_rate_percent: getNumber(funnelRecord, 'return_rate_percent', 'returnRatePercent'),
    },
    trends: (data.trends ?? []).map(normalizeTrendItem),
  };
}

export class RealAnalyticsService {
  /**
   * GET /v1/analytics/summary - Aggregated analytics for the admin dashboard.
   */
  static async getAnalyticsSummary(
    options?: {
      period?: AnalyticsPeriod;
    },
    accessToken?: string,
  ): Promise<AnalyticsOverviewSummary> {
    try {
      const response = await fetch(buildUrlWithParams('/v1/analytics/summary', {
        period: options?.period ?? 'week',
      }), {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<AnalyticsOverviewSummary>(response);
    } catch (error) {
      logger.error('Failed to get analytics summary', error);
      throw error;
    }
  }

  static normalizeAnalyticsSummary(data: AnalyticsOverviewSummary): AnalyticsSummary {
    return normalizeAnalyticsOverviewSummary(data);
  }

  /**
   * GET /analytics/dashboard - Get overall system analytics and KPIs
   */
  static async getDashboardSummary(
    options?: {
      period?: 'today' | 'week' | 'month' | 'year';
      by_region?: boolean;
      by_age_group?: boolean;
      by_language?: boolean;
    },
    accessToken?: string,
  ): Promise<AnalyticsSummary> {
    try {
      const summary = await RealAnalyticsService.getAnalyticsSummary({
        period: options?.period ?? 'week',
      }, accessToken);

      return RealAnalyticsService.normalizeAnalyticsSummary(summary);
    } catch (error) {
      logger.error('Failed to get analytics summary', error);
      throw error;
    }
  }

  /**
   * Attempt to fetch a single aggregated dashboard object. Prefer the
   * server-provided `/analytics/dashboard` endpoint, but fall back to
   * composing results from multiple analytics endpoints when unavailable.
   */
  static async getAggregatedReportData(
    options?: { period?: 'today' | 'week' | 'month' | 'year' },
    accessToken?: string,
  ): Promise<any> {
    return RealAnalyticsService.getDashboardSummary(options, accessToken);
  }

  /**
   * GET /analytics/topics - Get analytics for specific topics
   */
  static async getTopicAnalytics(
    options?: {
      period?: 'today' | 'week' | 'month' | 'year';
      limit?: number;
    },
    accessToken?: string,
  ): Promise<TopicEngagementResponse> {
    const url = buildUrlWithParams(`${ANALYTICS_BASE_PATH}/topics`, {
      period: options?.period ?? 'week',
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<TopicEngagementResponse>(response);
    } catch (error) {
      logger.error('Failed to get topic analytics', error);
      throw error;
    }
  }

  /**
   * GET /analytics/users - Get user behavior and retention analytics
   */
  static async getUserAnalytics(
    options?: {
      period?: 'today' | 'week' | 'month' | 'year';
      segment?: 'all' | 'new' | 'returning' | 'at-risk' | 'high_engagement';
    },
    accessToken?: string,
  ): Promise<UserAnalyticsResponse> {
    const url = buildUrlWithParams(`${ANALYTICS_BASE_PATH}/users`, {
      period: options?.period ?? 'week',
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<UserAnalyticsResponse>(response);
    } catch (error) {
      logger.error('Failed to get user analytics', error);
      throw error;
    }
  }

  /**
   * GET /analytics/safety - Get safety & crisis analytics
   */
  static async getSafetyAnalytics(
    options?: {
      period?: 'today' | 'week' | 'month' | 'year';
      severity?: 'low' | 'medium' | 'high' | 'critical';
    },
    accessToken?: string,
  ): Promise<SafetyAnalyticsResponse> {
    const url = buildUrlWithParams(`${ANALYTICS_BASE_PATH}/safety`, {
      period: options?.period ?? 'week',
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<SafetyAnalyticsResponse>(response);
    } catch (error) {
      logger.error('Failed to get safety analytics', error);
      throw error;
    }
  }

  /**
   * GET /analytics/performance - Get system performance metrics
   */
  static async getPerformanceMetrics(
    options?: {
      period?: 'today' | 'week' | 'month' | 'year';
    },
    accessToken?: string,
  ): Promise<PerformanceMetricsResponse> {
    const url = buildUrlWithParams(`${ANALYTICS_BASE_PATH}/performance`, {
      period: options?.period ?? 'week',
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<PerformanceMetricsResponse>(response);
    } catch (error) {
      logger.error('Failed to get performance metrics', error);
      throw error;
    }
  }

  /**
   * POST /analytics/session - Record analytics data for a completed session
   * Called from frontend after session ends
   */
  static async recordSessionAnalytics(
    payload: SessionAnalyticsPayload,
  ): Promise<SessionAnalyticsResponse> {
    try {
      const response = await fetch(buildUrl(`${ANALYTICS_BASE_PATH}/session`), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<SessionAnalyticsResponse>(response);
    } catch (error) {
      logger.error('Failed to record session analytics', error);
      // Don't re-throw for analytics errors - they shouldn't break user experience
      return {
        session_id: payload.session_id,
        recorded_at: new Date().toISOString(),
        status: 'recorded',
      };
    }
  }
}
