/**
 * Feature Analytics Service
 * Handles feature usage tracking - story modules, myth busters, resource access
 * Endpoints: POST /v1/story/event, POST /v1/mythbuster/event, POST /v1/resource/access
 */

import { logger } from '@/utils/logger';

// ========== Story Event ==========

export interface StoryEventRequest {
  session_id: string;
  story_id: string;
  story_title: string;
  action: 'started' | 'completed' | 'abandoned';
  progress_percentage?: number;
  time_spent_seconds?: number;
}

export interface StoryEventResponse {
  id: string;
  session_id: string;
  story_id: string;
  story_title: string;
  action: string;
  progress_percentage?: number;
  time_spent_seconds?: number;
  created_at: string;
}

// ========== MythBuster Event ==========

export interface MythBusterEventRequest {
  session_id: string;
  conversation_id?: string;
  myth_id?: string;
  myth_title?: string;
  action: string;
  rating?: number;
  helpful_flag?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MythBusterEventResponse {
  id: string;
  session_id: string;
  myth_id: string;
  myth_title: string;
  action: string;
  created_at: string;
}

// ========== Resource Access ==========

export interface ResourceAccessEventRequest {
  session_id: string;
  resource_type: 'clinic' | 'pharmacy' | 'support_center';
  resource_id?: string;
  resource_name?: string;
  action: 'viewed' | 'downloaded' | 'clicked' | 'shared';
}

export interface ResourceAccessEventResponse {
  id: string;
  session_id: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  action: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

const STORY_EVENT_PATH = '/v1/story/event';
const MYTHBUSTER_EVENT_PATH = '/v1/mythbuster/event';
const RESOURCE_ACCESS_PATH = '/v1/resource/access';

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for feature analytics requests.');
  }
  return new URL(path, API_BASE_URL).toString();
}

function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
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

export class FeatureAnalyticsService {
  /**
   * POST /v1/story/event - Log story module interaction
   */
  static async logStoryEvent(
    payload: StoryEventRequest,
  ): Promise<StoryEventResponse> {
    try {
      const response = await fetch(buildUrl(STORY_EVENT_PATH), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<StoryEventResponse>(response);
    } catch (error) {
      logger.error('Failed to log story event', error);
      throw error;
    }
  }

  /**
   * POST /v1/mythbuster/event - Log myth buster interaction
   */
  static async logMythBusterEvent(
    payload: MythBusterEventRequest,
  ): Promise<MythBusterEventResponse> {
    try {
      const response = await fetch(buildUrl(MYTHBUSTER_EVENT_PATH), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<MythBusterEventResponse>(response);
    } catch (error) {
      logger.error('Failed to log myth buster event', error);
      throw error;
    }
  }

  /**
   * POST /v1/resource/access - Log resource access event
   */
  static async logResourceAccess(
    payload: ResourceAccessEventRequest,
  ): Promise<ResourceAccessEventResponse> {
    try {
      const response = await fetch(buildUrl(RESOURCE_ACCESS_PATH), {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<ResourceAccessEventResponse>(response);
    } catch (error) {
      logger.error('Failed to log resource access', error);
      throw error;
    }
  }
}
