import { useEffect, useMemo, useState } from 'react';
import { StaffAccessService } from '@/services/staffAccessService';
import { SupportRequestListItem } from '@/services/supportRequestService';
import { logger } from '@/utils/logger';

const POLL_INTERVAL_MS = 6000;

/**
 * Session ids of conversations that are escalated and still waiting for a human.
 * Fails closed: if the poll fails, nothing is considered live.
 */
function useLiveTakeoverSessions(accessToken?: string): Set<string> {
  const [sessions, setSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await StaffAccessService.listConversations(
          { page: 1, page_size: 100, is_escalated: true, is_human_takeover: false },
          accessToken,
        );
        if (!isMounted) return;

        setSessions(
          new Set(
            (response.conversations ?? [])
              .filter((conversation) => conversation.is_escalated && !conversation.is_human_takeover)
              .map((conversation) => conversation.session_id),
          ),
        );
      } catch (error) {
        if (!isMounted) return;
        setSessions(new Set());
        logger.error('Failed to poll conversations awaiting takeover', error);
      }
    };

    void load();
    const interval = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [accessToken]);

  return sessions;
}

/**
 * Waiting support requests that still have a live escalated conversation, once per session.
 *
 * Support-request rows can stay in `waiting` after their conversation ended, so the raw queue
 * drifts away from the conversation log. Callers should keep feeding the raw queue to
 * useQueueNotifications: alerts fire on arrival, while this list only drives what is displayed.
 */
export function useLiveWaitingRequests(
  requests: SupportRequestListItem[],
  accessToken?: string,
): SupportRequestListItem[] {
  const liveTakeoverSessions = useLiveTakeoverSessions(accessToken);

  return useMemo(() => {
    const seenSessions = new Set<string>();

    return requests.filter((request) => {
      const sessionId = request.session_id;
      if (request.status !== 'waiting' || !sessionId) return false;
      if (!liveTakeoverSessions.has(sessionId) || seenSessions.has(sessionId)) return false;
      seenSessions.add(sessionId);
      return true;
    });
  }, [requests, liveTakeoverSessions]);
}
