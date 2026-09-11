import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { notificationSound } from '@/utils/notificationSound';
import { BrowserNotificationManager } from '@/utils/browserNotification';
import { SupportRequestListItem } from '@/services/supportRequestService';

interface UseQueueNotificationsOptions {
  waitingRequests: SupportRequestListItem[];
  onSelectRequest?: (requestId: string) => void;
}

export function useQueueNotifications({
  waitingRequests,
  onSelectRequest,
}: UseQueueNotificationsOptions) {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const [soundMuted, setSoundMuted] = useState(() => notificationSound.isSoundMuted());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    BrowserNotificationManager.getPermission()
  );

  const toggleSound = useCallback(() => {
    const nextState = !soundMuted;
    notificationSound.setMuted(nextState);
    setSoundMuted(nextState);
    if (!nextState) {
      notificationSound.playChime();
      toast.info('Sound alerts enabled');
    } else {
      toast.info('Sound alerts muted');
    }
  }, [soundMuted]);

  const requestPermission = useCallback(async () => {
    const granted = await BrowserNotificationManager.requestPermission();
    setPermission(BrowserNotificationManager.getPermission());
    if (granted) {
      toast.success('Desktop notifications enabled');
      // Send a test confirmation notification
      BrowserNotificationManager.sendNotification('Lydia Contact Center', {
        body: 'Alerts are now active. You will be notified when someone requests a live counselor.',
      });
    } else {
      toast.error('Notification permission was not granted');
    }
    return granted;
  }, []);

  const testAlert = useCallback(() => {
    notificationSound.playChime();
    BrowserNotificationManager.sendNotification('New Support Request (Test)', {
      body: 'Ama (Accra) is waiting for a counselor — Youth Sexual Health',
    });
    toast.warning('Test Alert: New Live Counselor Request in Queue', {
      description: 'Ama (Accra) is waiting for assistance',
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    if (!waitingRequests) return;

    // Filter current waiting tickets
    const currentWaiting = waitingRequests.filter((r) => r.status === 'waiting');

    // On initial load, register existing tickets without sounding the alarm
    if (!isInitializedRef.current) {
      currentWaiting.forEach((r) => seenIdsRef.current.add(r.id));
      isInitializedRef.current = true;
      return;
    }

    // Identify newly arrived tickets
    const newlyArrived = currentWaiting.filter((r) => !seenIdsRef.current.has(r.id));

    if (newlyArrived.length > 0) {
      newlyArrived.forEach((ticket) => {
        seenIdsRef.current.add(ticket.id);

        // 1. Play two-tone audio chime
        notificationSound.playChime();

        // 2. Dispatch desktop notification (even if browser is minimized)
        const nickname = ticket.user_nickname || 'Someone';
        const urgencyText = ticket.urgency === 'high' || ticket.urgency === 'critical' ? ' [URGENT]' : '';
        BrowserNotificationManager.sendNotification(`Live Chat Request${urgencyText}`, {
          body: `${nickname} is waiting in queue to speak with a counselor.`,
          tag: ticket.id,
          onClick: () => {
            if (onSelectRequest) {
              onSelectRequest(ticket.id);
            }
          },
        });

        // 3. Display interactive Sonner toast
        toast.warning(`New Live Chat Request: ${nickname}${urgencyText}`, {
          description: 'A WhatsApp user is waiting for counselor takeover.',
          duration: 10000,
          action: onSelectRequest
            ? {
                label: 'View Case',
                onClick: () => onSelectRequest(ticket.id),
              }
            : undefined,
        });
      });
    }
  }, [waitingRequests, onSelectRequest]);

  return {
    soundMuted,
    toggleSound,
    permission,
    requestPermission,
    testAlert,
  };
}
