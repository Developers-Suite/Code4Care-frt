import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Activity, UserCheck, CheckCircle2, Headphones, MessageSquare, Calendar, User, X } from 'lucide-react';

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
        onOpenConversation({ sessionId: match?.session_id, convId: match?.conversation_id });
      }
    },
  });

  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  const isMyRequest = (request: SupportRequestListItem) =>
    request.assigned_staff?.id === session.staffId ||
    request.assigned_staff_id === session.staffId;

  const myAssignedRequests = useMemo(
    () => supportRequests.filter((request) => isMyRequest(request) && request.status === 'assigned'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supportRequests, session.staffId]
  );

  const myActiveRequests = useMemo(
    () => supportRequests.filter((request) => isMyRequest(request) && request.status === 'active'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supportRequests, session.staffId]
  );

  const resolvedRequests = useMemo(() => {
    return supportRequests.filter((request) => {
      if (request.status !== 'resolved' && request.status !== 'closed') return false;

      // If consultant, strictly only show their own
      if (session.role === 'consultant') {
        if (!isMyRequest(request)) return false;
      } else {
        // Admin / Supervisor can filter by person
        if (selectedPersonFilter !== 'all') {
          const matchStaff =
            request.assigned_staff_id === selectedPersonFilter ||
            request.assigned_staff?.id === selectedPersonFilter ||
            request.assigned_staff_name === selectedPersonFilter ||
            request.assigned_staff?.name === selectedPersonFilter;
          if (!matchStaff) return false;
        }
      }

      // Filter by date
      if (selectedDateFilter) {
        const reqDate = (request.resolved_at || request.created_at || '').slice(0, 10);
        if (reqDate !== selectedDateFilter) return false;
      }

      return true;
    });
  }, [supportRequests, session.role, session.staffId, selectedPersonFilter, selectedDateFilter]);

  const counselorOptions = useMemo(() => {
    if (session.role === 'consultant') return [];
    const map = new Map<string, string>();
    supportRequests.forEach((r) => {
      const id = r.assigned_staff_id || r.assigned_staff?.id;
      const name = r.assigned_staff_name || r.assigned_staff?.name;
      if (id && name) {
        map.set(id, name);
      } else if (id) {
        map.set(id, `Staff (${id.slice(0, 8)})`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [supportRequests, session.role]);

  const refreshRequests = useCallback(async () => {
    try {
      const response = await SupportRequestService.listSupportRequests(
        { limit: 150 },
        session.accessToken || session.user?.id
      );
      setSupportRequests(response.requests);
    } catch (error) {
      logger.error('Failed to load support requests', error);
    }
  }, [session.accessToken, session.user?.id]);

  useEffect(() => {
        void refreshRequests();
        const interval = setInterval(() => {
          void refreshRequests();
        }, 2500);

        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            void refreshRequests();
          }
        };
        window.addEventListener('focus', onVisibilityChange);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
          clearInterval(interval);
          window.removeEventListener('focus', onVisibilityChange);
          document.removeEventListener('visibilitychange', onVisibilityChange);
        };
      }, [refreshRequests]);

const claimAndTakeover = async (request: SupportRequestListItem) => {
  try {
    // 1. Assign the support request to this consultant
    await SupportRequestService.assignSupportRequest(
      request.id,
      { staff_id: session.staffId, auto_start: true },
      session.accessToken || session.user?.id
    );

    // 2. Ensure the request is marked active before refreshing state
    await SupportRequestService.updateSupportRequest(
      request.id,
      { status: 'active' },
      session.accessToken || session.user?.id
    ).catch(() => { });

    // 3. Update local state optimistically — include both assigned_staff AND assigned_staff_id
    //    so both filter paths in myAssignedRequests / myActiveRequests keep the card visible.
    setSupportRequests((prev) =>
      prev.map((r) =>
        r.id !== request.id
          ? r
          : {
            ...r,
            status: 'active' as const,
            assigned_staff: { id: session.staffId, name: session.name },
            assigned_staff_id: session.staffId,
          }
      )
    );

    toast.success(`Took over chat for ${request.user_nickname || 'User'}`);
    void refreshRequests();
  } catch (error) {
    logger.error('Failed to claim and takeover request', error);
    const msg = error instanceof Error && error.message ? error.message : 'Failed to claim request. Please try again.';
    toast.error(msg);
    void refreshRequests();
  }
};

const openChatForRequest = async (request: SupportRequestListItem) => {
  if (request.status === 'assigned') {
    await SupportRequestService.updateSupportRequest(
      request.id,
      { status: 'active' },
      session.accessToken || session.user?.id
    ).catch(() => { });
    setSupportRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'active' as const } : r))
    );
  }

  if (!onOpenConversation) return;

  // Prefer direct conversation_id; fall back to searching by session_id only if missing
  let resolvedConvId: string | undefined = request.conversation_id || undefined;
  if (!resolvedConvId && request.session_id) {
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
      return {
        ...r,
        status: 'resolved' as const,
        notes: fullNotes,
        resolved_at: new Date().toISOString(),
        assigned_staff_id: session.staffId,
        assigned_staff_name: session.name,
      };
    });
    setSupportRequests(updated);
    toast.success('Case resolved and handover notes recorded');
    setResolvingRequestId(null);
    void refreshRequests();
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
                  void openChatForRequest(req);
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

      {/* Resolved Cases & Clinical Handover Notes Table */}
      <Card className="border-[#E8ECFF] bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E8ECFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-900 text-base">Resolved Cases & Handover Notes</h2>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 ml-1">
              {resolvedRequests.length}
            </Badge>
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Person filter: only visible to Admin and Supervisor */}
            {session.role !== 'consultant' && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <select
                  value={selectedPersonFilter}
                  onChange={(e) => setSelectedPersonFilter(e.target.value)}
                  className="text-xs h-8 rounded-lg border border-gray-200 px-2.5 bg-white text-gray-800 focus:outline-none focus:border-[#BE322D]"
                >
                  <option value="all">All Counselors</option>
                  {counselorOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="text-xs h-8 rounded-lg border border-gray-200 px-2.5 bg-white text-gray-800 focus:outline-none focus:border-[#BE322D]"
              />
              {selectedDateFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1 cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-[#E8ECFF] text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Resolved At</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Counselor</th>
                <th className="px-4 py-3">Conversation</th>
                <th className="px-4 py-3">Handover & Clinical Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECFF] text-gray-700">
              {resolvedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                    No resolved cases found matching the criteria.
                  </td>
                </tr>
              ) : (
                resolvedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {formatDateTime(req.resolved_at || req.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 block">
                        {req.user_nickname || 'Anonymous'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {req.age_range ? `Age: ${req.age_range}` : ''} {req.gender_identity ? `• ${req.gender_identity}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="text-[11px] font-medium bg-blue-50/60 text-blue-700 border-blue-200">
                        {req.assigned_staff_name || req.assigned_staff?.name || (isMyRequest(req) ? session.name : 'Counselor')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
                        onClick={() => openChatForRequest(req)}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Chat
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      {req.notes ? (
                        <div className="max-w-md text-xs leading-relaxed text-gray-800 whitespace-pre-wrap bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {req.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No notes recorded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
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
