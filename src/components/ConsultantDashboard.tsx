import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock3, LogOut, UserCheck, CheckCircle2, PhoneCall, Sparkles, Headphones } from 'lucide-react';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { NotificationPopover } from './NotificationPopover';
import {
  StaffAccessService,
  StaffSession,
} from '@/services/staffAccessService';
import { SupportRequestService, SupportRequestListItem } from '@/services/supportRequestService';
import { logger } from '@/utils/logger';
import { useQueueNotifications } from '@/hooks/useQueueNotifications';
import { UserAvatarProfile } from './admin/UserAvatarProfile';

interface SupportCounselorDashboardProps {
  session: StaffSession;
  onLogout: () => void;
}

export function SupportCounselorDashboard({ session, onLogout }: SupportCounselorDashboardProps) {
  const [supportRequests, setSupportRequests] = useState<SupportRequestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const waitingRequests = useMemo(
    () => supportRequests.filter((request) => request.status === 'waiting'),
    [supportRequests]
  );

  const { permission, requestPermission, testAlert } = useQueueNotifications({
    waitingRequests,
  });

  const myAssignedRequests = useMemo(
    () => supportRequests.filter((request) => request.assigned_staff?.id === session.staffId && request.status === 'assigned'),
    [supportRequests, session.staffId]
  );

  const myActiveRequests = useMemo(
    () => supportRequests.filter((request) => request.assigned_staff?.id === session.staffId && request.status === 'active'),
    [supportRequests, session.staffId]
  );

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        const response = await SupportRequestService.listSupportRequests(
          {},
          session.accessToken || session.user?.id
        );
        setSupportRequests(response.requests);
      } catch (error) {
        logger.error('Failed to load support requests', error);
        setSupportRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRequests();
    const interval = setInterval(() => {
      void loadRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [session]);

  const claimRequest = async (requestId: string) => {
    try {
      await SupportRequestService.assignSupportRequest(
        requestId,
        { staff_id: session.staffId, auto_start: false },
        session.accessToken || session.user?.id
      );
      const updated = supportRequests.map((r) => {
        if (r.id !== requestId) return r;
        return { ...r, status: 'assigned' as const, assigned_staff: { id: session.staffId, name: session.name } };
      });
      setSupportRequests(updated);
    } catch (error) {
      logger.error('Failed to claim request', error);
    }
  };

  const connectRequest = async (requestId: string) => {
    try {
      await SupportRequestService.updateSupportRequest(
        requestId,
        { status: 'active' },
        session.accessToken || session.user?.id
      );
      const updated = supportRequests.map((r) => {
        if (r.id !== requestId) return r;
        return { ...r, status: 'active' as const };
      });
      setSupportRequests(updated);
    } catch (error) {
      logger.error('Failed to connect to request', error);
    }
  };

  const resolveRequest = async (requestId: string) => {
    try {
      await SupportRequestService.resolveSupportRequest(
        requestId,
        {
          resolution_notes: 'Session resolved by consultant',
          follow_up_required: false,
        },
        session.accessToken || session.user?.id
      );
      const updated = supportRequests.map((r) => {
        if (r.id !== requestId) return r;
        return { ...r, status: 'resolved' as const };
      });
      setSupportRequests(updated);
    } catch (error) {
      logger.error('Failed to resolve request', error);
    }
  };

  const consultantStats = [
    {
      label: 'Waiting Queue (Takeover)',
      value: waitingRequests.length,
      icon: Headphones,
      iconClass: waitingRequests.length > 0 ? 'text-rose-600 animate-pulse' : 'text-yellow-600',
      highlight: waitingRequests.length > 0,
    },
    { label: 'My Assigned', value: myAssignedRequests.length, icon: UserCheck, iconClass: 'text-blue-600' },
    { label: 'My Active', value: myActiveRequests.length, icon: Activity, iconClass: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Consultant Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome, {session.name}. Manage support queue and active conversations.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <NotificationPopover
              notifications={waitingRequests}
              onSelectNotification={(requestId) => claimRequest(requestId)}
              onRequestPermission={requestPermission}
              permissionGranted={permission === 'granted'}
            />

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-900 gap-1 h-8"
              onClick={testAlert}
              title="Test chime sound and desktop alert"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Test Alert
            </Button>

            <div className="h-5 w-px bg-gray-200 mx-1" />

            <UserAvatarProfile
              session={session}
              onLogout={onLogout}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {consultantStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                <Card className={`p-4 ${stat.highlight ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' : 'border-[#E8ECFF]'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        {stat.label}
                        {stat.highlight && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${stat.highlight ? 'text-rose-700' : 'text-gray-900'}`}>{stat.value}</p>
                    </div>
                    <Icon className={`w-6 h-6 ${stat.iconClass}`} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-[#E8ECFF] bg-white overflow-hidden">
            <div className="p-4 border-b border-[#E8ECFF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">Waiting Queue</h2>
                {waitingRequests.length > 0 && (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <Headphones className="w-3 h-3 text-rose-600" />
                    Takeover Required
                  </Badge>
                )}
              </div>
              <Badge className={`font-bold ${waitingRequests.length > 0 ? 'bg-rose-600 text-white border-none animate-pulse' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                {waitingRequests.length} {waitingRequests.length === 1 ? 'Takeover' : 'Takeovers'}
              </Badge>
            </div>
            <div className="divide-y divide-[#E8ECFF]">
              {waitingRequests.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No pending requests right now.</div>
              )}
              {waitingRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between gap-3 bg-rose-50/60 border-l-4 border-l-rose-500 hover:bg-rose-100/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{request.userNickname}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <Headphones className="w-3 h-3 text-rose-600" />
                        Takeover Needed
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Age {request.userAge} • Requested {request.requestedAt}</p>
                  </div>
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 flex-shrink-0" onClick={() => claimRequest(request.id)}>
                    <Headphones className="w-3.5 h-3.5" />
                    Take Over
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-[#E8ECFF] bg-white overflow-hidden">
            <div className="p-4 border-b border-[#E8ECFF] flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">My Assigned Cases</h2>
              <Badge className="bg-blue-50 text-blue-600 border-blue-200">{myAssignedRequests.length + myActiveRequests.length}</Badge>
            </div>
            <div className="divide-y divide-[#E8ECFF]">
              {myAssignedRequests.length === 0 && myActiveRequests.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No assigned cases yet.</div>
              )}

              {myAssignedRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{request.userNickname}</p>
                    <p className="text-sm text-gray-500">Assigned • {request.requestedAt}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50" onClick={() => connectRequest(request.id)}>
                    <PhoneCall className="w-4 h-4" />
                    Connect
                  </Button>
                </div>
              ))}

              {myActiveRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{request.userNickname}</p>
                    <p className="text-sm text-gray-500">Active • Duration {request.duration ?? 0} min</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => resolveRequest(request.id)}>
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
