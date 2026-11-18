import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Activity, UserCheck, CheckCircle2, PhoneCall, Headphones, MessageSquare } from 'lucide-react';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { NotificationPopover } from './NotificationPopover';
import { StaffAccessService, StaffSession } from '@/services/staffAccessService';
import { SupportRequestService, SupportRequestListItem } from '@/services/supportRequestService';
import { logger } from '@/utils/logger';
import { useQueueNotifications } from '@/hooks/useQueueNotifications';
import { useLiveWaitingRequests } from '@/hooks/useLiveWaitingRequests';
import { UserAvatarProfile } from './admin/UserAvatarProfile';

interface SupportCounselorDashboardProps {
  session: StaffSession;
  onLogout: () => void;
  embedded?: boolean;
  onOpenConversation?: (target: { sessionId?: string; convId?: string }) => void;
}

function formatDateTime(iso: string) {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SupportCounselorDashboard({
  session,
  onLogout,
  embedded = false,
  onOpenConversation,
}: SupportCounselorDashboardProps) {
  const [supportRequests, setSupportRequests] = useState<SupportRequestListItem[]>([]);
  const [_isLoading, setIsLoading] = useState(false);

  // Raw queue feeds alerts; what is displayed only keeps rows with a live escalated conversation.
  const rawWaitingRequests = useMemo(
    () => supportRequests.filter((request) => request.status === 'waiting'),
    [supportRequests]
  );
  const waitingRequests = useLiveWaitingRequests(rawWaitingRequests, session.accessToken);

  const { permission, requestPermission } = useQueueNotifications({
    waitingRequests: rawWaitingRequests,
    onSelectRequest: (requestId) => {
      const match = rawWaitingRequests.find((r) => r.id === requestId);
      if (onOpenConversation) {
        onOpenConversation({ sessionId: match?.session_id, convId: requestId });
      }
    },
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

  const claimAndTakeover = async (request: SupportRequestListItem) => {
    try {
      // 1. Assign the support request to this consultant
      await SupportRequestService.assignSupportRequest(
        request.id,
        { staff_id: session.staffId, auto_start: true },
        session.accessToken || session.user?.id
      );

      // 2. Mark the request as active (best-effort)
      void SupportRequestService.updateSupportRequest(
        request.id,
        { status: 'active' },
        session.accessToken || session.user?.id
      ).catch(() => { });

      // 3. Resolve the real conversation id from the conversations API using session_id
      let resolvedConvId: string | undefined;
      if (request.session_id && onOpenConversation) {
        try {
          const convResponse = await StaffAccessService.listConversations(
            { is_escalated: true, is_human_takeover: false, page_size: 100 },
            session.accessToken,
          );
          const matched = (convResponse.conversations ?? []).find(
            (c) => c.session_id === request.session_id,
          );
          resolvedConvId = matched?.id;
        } catch {
          // Fallback: use session_id directly — ConversationsPage will retry
        }
      }

      // 4. Update local state optimistically
      setSupportRequests((prev) =>
        prev.map((r) =>
          r.id !== request.id
            ? r
            : { ...r, status: 'active' as const, assigned_staff: { id: session.staffId, name: session.name } }
        )
      );

      toast.success(`Took over chat for ${request.user_nickname || 'User'}`);

      // 5. Navigate to the live conversation chat panel
      if (onOpenConversation) {
        onOpenConversation({
          sessionId: request.session_id,
          convId: resolvedConvId,
        });
      }
    } catch (error) {
      logger.error('Failed to claim and takeover request', error);
      toast.error('Failed to claim request. Please try again.');
    }
  };

  const openChatForRequest = async (request: SupportRequestListItem) => {
    if (!onOpenConversation) return;

    // Resolve the actual conversation id from the conversations API
    let resolvedConvId: string | undefined;
    if (request.session_id) {
      try {
        const convResponse = await StaffAccessService.listConversations(
          { page_size: 100 },
          session.accessToken,
        );
        const matched = (convResponse.conversations ?? []).find(
          (c) => c.session_id === request.session_id,
        );
        resolvedConvId = matched?.id;
      } catch {
        // Fallback gracefully
      }
    }

    onOpenConversation({ sessionId: request.session_id, convId: resolvedConvId });
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

  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [resolutionOutcome, setResolutionOutcome] = useState('Information & Counseling Provided');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  const openResolveModal = (requestId: string) => {
    setResolvingRequestId(requestId);
    setResolutionOutcome('Information & Counseling Provided');
    setResolutionNotes('');
  };

  const handleConfirmResolve = async () => {
    if (!resolvingRequestId) return;
    setIsSubmittingResolution(true);
    try {
      const fullNotes = resolutionNotes.trim()
        ? `[${resolutionOutcome}] ${resolutionNotes.trim()}`
        : `[${resolutionOutcome}] Resolved by counselor`;

      await SupportRequestService.resolveSupportRequest(
        resolvingRequestId,
        {
          resolution_notes: fullNotes,
          follow_up_required: resolutionOutcome === 'Follow-up Required',
        },
        session.accessToken || session.user?.id
      );
      const updated = supportRequests.map((r) => {
        if (r.id !== resolvingRequestId) return r;
        return { ...r, status: 'resolved' as const };
      });
      setSupportRequests(updated);
      toast.success('Case resolved and handover notes recorded');
      setResolvingRequestId(null);
    } catch (error) {
      logger.error('Failed to resolve request', error);
      toast.error('Failed to save resolution notes');
    } finally {
      setIsSubmittingResolution(false);
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
    <div className={embedded ? "p-4 sm:p-6" : "min-h-screen bg-white p-6"}>
      <div className="max-w-7xl mx-auto space-y-6">
        {!embedded ? (
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Consultant Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome, {session.name}. Manage support queue and active conversations.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <NotificationPopover
                notifications={waitingRequests}
                onSelectNotification={(requestId) => {
                  const req = rawWaitingRequests.find((r) => r.id === requestId);
                  if (req) {
                    void claimAndTakeover(req);
                  }
                }}
                onRequestPermission={requestPermission}
                permissionGranted={permission === 'granted'}
              />

              <div className="h-5 w-px bg-gray-200 mx-1" />

              <UserAvatarProfile
                session={session}
                onLogout={onLogout}
              />
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support Consultant Queue</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome, {session.name}. Manage live support queue and active conversations.</p>
          </div>
        )}

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
                      <p className="font-semibold text-gray-900">{request.user_nickname || 'Anonymous'}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <Headphones className="w-3 h-3 text-rose-600" />
                        Takeover Needed
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Age {request.age_range || '—'} • Requested {formatDateTime(request.created_at)}</p>
                  </div>
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 flex-shrink-0 cursor-pointer" onClick={() => claimAndTakeover(request)}>
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
                    <p className="font-semibold text-gray-900">{request.user_nickname || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">Assigned • requested {formatDateTime(request.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
                      onClick={() => openChatForRequest(request)}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50 cursor-pointer" onClick={() => connectRequest(request.id)}>
                      <PhoneCall className="w-4 h-4" />
                      Connect
                    </Button>
                  </div>
                </div>
              ))}

              {myActiveRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{request.user_nickname || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">
                      Active • Duration {request.duration_minutes != null ? `${request.duration_minutes} min` : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
                      onClick={() => openChatForRequest(request)}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openResolveModal(request.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Case Resolution & Handover Modal */}
      {resolvingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8ECFF] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Resolve & Handover Case</h3>
              <button
                type="button"
                onClick={() => setResolvingRequestId(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resolution Outcome
                </label>
                <select
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="w-full text-xs h-9 rounded-lg border border-gray-200 px-2.5 bg-white text-gray-800 focus:outline-none focus:border-[#BE322D]"
                >
                  <option value="Information & Counseling Provided">Information & Counseling Provided</option>
                  <option value="Referred to PPAG Clinic">Referred to PPAG Clinic</option>
                  <option value="Emergency / Crisis Hotline Shared">Emergency / Crisis Hotline Shared</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="User Inactive / Disconnected">User Inactive / Disconnected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Handover / Clinical Notes (Internal)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter summary notes for medical audit and supervisor review..."
                  className="w-full text-xs h-20 rounded-lg border border-gray-200 p-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#BE322D] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResolvingRequestId(null)}
                disabled={isSubmittingResolution}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResolve}
                disabled={isSubmittingResolution}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                {isSubmittingResolution ? 'Saving...' : 'Confirm & Close Case'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
