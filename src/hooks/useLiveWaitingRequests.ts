import { useEffect, useMemo, useState } from 'react';
import { StaffAccessService } from '@/services/staffAccessService';
import { SupportRequestListItem } from '@/services/supportRequestService';
import { logger } from '@/utils/logger';

const POLL_INTERVAL_MS = 6000;

interface LiveTakeoverTargets {
  convIds: Set<string>;
  sessions: Set<string>;
}

/**
 * Conversation and session ids of conversations that are escalated and still waiting for a human.
 * Fails closed: if the poll fails, nothing is considered live.
 */
function useLiveTakeoverTargets(accessToken?: string): LiveTakeoverTargets {
  const [targets, setTargets] = useState<LiveTakeoverTargets>({
    convIds: new Set(),
    sessions: new Set(),
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const response = await StaffAccessService.listConversations(
          { page: 1, page_size: 100, is_escalated: true, is_human_takeover: false },
          accessToken,
        );
        if (!isMounted) return;

        const waitingConvs = (response.conversations ?? []).filter(
          (conversation) => conversation.is_escalated && !conversation.is_human_takeover,
        );
        setTargets({
          convIds: new Set(waitingConvs.map((conversation) => conversation.id).filter(Boolean)),
          sessions: new Set(waitingConvs.map((conversation) => conversation.session_id).filter(Boolean)),
        });
      } catch (error) {
        if (!isMounted) return;
        setTargets({ convIds: new Set(), sessions: new Set() });
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

  return targets;
}

/**
 * Waiting support requests that still have a live escalated conversation, once per session/conversation.
 *
 * Support-request rows can stay in `waiting` after their conversation ended, so the raw queue
 * drifts away from the conversation log. Callers should keep feeding the raw queue to
 * useQueueNotifications: alerts fire on arrival, while this list only drives what is displayed.
 */
export function useLiveWaitingRequests(
  requests: SupportRequestListItem[],
  accessToken?: string,
): SupportRequestListItem[] {
  const liveTargets = useLiveTakeoverTargets(accessToken);

  return useMemo(() => {
    const seenKeys = new Set<string>();

    return requests.filter((request) => {
      if (request.status !== 'waiting') return false;
      const hasLiveConversation =
        (Boolean(request.conversation_id) && liveTargets.convIds.has(request.conversation_id!)) ||
        (Boolean(request.session_id) && liveTargets.sessions.has(request.session_id!));
      if (!hasLiveConversation) return false;
      const dedupeKey = request.conversation_id || request.session_id;
      if (!dedupeKey || seenKeys.has(dedupeKey)) return false;
      seenKeys.add(dedupeKey);
      return true;
    });
  }, [requests, liveTargets]);
}
