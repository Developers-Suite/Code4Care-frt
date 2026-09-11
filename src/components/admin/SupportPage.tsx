import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon, Headphones, Clock, CheckCircle, AlertTriangle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportButton } from './ExportButton';
import {
  SupportRequestService,
  SupportRequestListItem,
  SupportRequestStatus,
  RequestUrgency,
} from '@/services/supportRequestService';
import { StaffAccessService, StaffSession, StaffAccount } from '@/services/staffAccessService';
import { logger } from '@/utils/logger';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDateFull(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const URGENCY_BADGE: Record<RequestUrgency, string> = {
  normal: 'bg-gray-100 text-gray-600 border-gray-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_BADGE: Record<SupportRequestStatus | string, string> = {
  waiting: 'bg-blue-100 text-blue-700 border-blue-200',
  assigned: 'bg-violet-100 text-violet-700 border-violet-200',
  active: 'bg-green-100 text-green-700 border-green-200',
  resolved: 'bg-gray-100 text-gray-600 border-gray-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-100',
};

interface SupportPageProps {
  session: StaffSession;
}

export function SupportPage({ session }: SupportPageProps) {
  const [requests, setRequests] = useState<SupportRequestListItem[]>([]);
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [waitingTotal, setWaitingTotal] = useState(0);
  const [highPriority, setHighPriority] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<SupportRequestStatus | undefined>(undefined);
  const [urgencyFilter, setUrgencyFilter] = useState<RequestUrgency | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    SupportRequestService.listSupportRequests(
      { page, limit, status: statusFilter, urgency: urgencyFilter, sort_by: 'urgency' },
      session.accessToken,
    )
      .then((r) => {
        if (!mounted) return;
        setRequests(r.requests ?? []);
        setTotal(r.total ?? 0);
        setWaitingTotal(r.waiting_total ?? 0);
        setHighPriority(r.high_priority ?? 0);
        setLoading(false);
      })
      .catch((e) => { logger.error('support requests', e); if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [page, statusFilter, urgencyFilter, session.accessToken]);

  useEffect(() => {
    setStaffLoading(true);
    StaffAccessService.listStaff(session.accessToken)
      .then((s) => setStaff(s))
      .catch((e) => logger.error('staff list', e))
      .finally(() => setStaffLoading(false));
  }, [session.accessToken]);

  const totalPages = Math.ceil(total / limit);
  const resolved = requests.filter((r) => r.status === 'resolved' || r.status === 'closed').length;
  const openCount = requests.filter((r) => r.status === 'waiting' || r.status === 'assigned' || r.status === 'active').length;

  const staffStats = staff.map((s) => ({
    ...s,
    assigned: requests.filter((r) => r.assigned_staff?.id === s.id && (r.status === 'assigned' || r.status === 'active')).length,
    resolved: requests.filter((r) => r.assigned_staff?.id === s.id && (r.status === 'resolved' || r.status === 'closed')).length,
  }));

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900">Support & Consultants</h1>
          <p className="text-sm text-gray-500 mt-0.5">Support queue, SLA tracking and consultant performance</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Open Requests', value: waitingTotal, icon: HeadphonesIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'High Priority', value: highPriority, icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' },
            { label: 'Resolved (page)', value: resolved, icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Total Requests', value: total, icon: Users, bg: 'bg-violet-50', color: 'text-violet-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-4 border-[#E8ECFF] bg-white">
                {loading ? (
                  <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-12" /></div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${item.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Status pipeline */}
        <Card className="p-5 border-[#E8ECFF] bg-white">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Request Pipeline</h3>
          <div className="flex flex-wrap gap-3">
            {(['waiting', 'assigned', 'active', 'resolved', 'closed'] as SupportRequestStatus[]).map((s) => {
              const count = requests.filter((r) => r.status === s).length;
              const colors: Record<string, string> = {
                waiting: 'bg-blue-50 border-blue-200 text-blue-700',
                assigned: 'bg-violet-50 border-violet-200 text-violet-700',
                active: 'bg-green-50 border-green-200 text-green-700',
                resolved: 'bg-gray-50 border-gray-200 text-gray-600',
                closed: 'bg-gray-50 border-gray-100 text-gray-400',
              };
              return (
                <div key={s} className={`rounded-xl border px-5 py-3 ${colors[s]}`}>
                  <p className="text-xs font-medium capitalize">{s}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Consultant performance */}
        {staff.length > 0 && (
          <Card className="border-[#E8ECFF] bg-white overflow-hidden">
            <div className="p-5 border-b border-[#E8ECFF]">
              <h3 className="font-semibold text-gray-900 text-sm">Consultant Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#E8ECFF]">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Consultant</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Availability</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Active</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Resolved</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Load</th>
                  </tr>
                </thead>
                <tbody>
                  {staffLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#E8ECFF]">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : staffStats.map((s) => (
                    <tr key={s.id} className="border-b border-[#E8ECFF] hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs capitalize">{s.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${s.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium capitalize ${s.availability === 'available' ? 'text-green-600' : s.availability === 'busy' ? 'text-amber-600' : 'text-gray-400'}`}>
                          {s.availability}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{s.assigned}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{s.resolved}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${s.currentLoad > 3 ? 'text-red-600' : s.currentLoad > 1 ? 'text-amber-600' : 'text-green-600'}`}>
                          {s.currentLoad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Request queue table */}
        <Card className="border-[#E8ECFF] bg-white overflow-hidden">
          <div className="p-5 border-b border-[#E8ECFF] flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Request Queue</h3>
            <div className="flex flex-wrap items-center gap-2">
              <ExportButton
                data={{
                  title: 'Support Request Queue',
                  filename: 'support-requests',
                  headers: ['ID', 'Session', 'Nickname', 'Status', 'Urgency', 'Created', 'Assigned To'],
                  rows: requests.map((r) => [
                    r.id.slice(-8),
                    r.session_id ? `…${r.session_id.slice(-8)}` : '',
                    r.user_nickname ?? 'Anonymous',
                    r.status,
                    r.urgency,
                    new Date(r.created_at).toLocaleString('en-GB'),
                    r.assigned_staff?.name ?? r.assigned_staff?.id?.slice(-8) ?? 'Unassigned',
                  ]),
                }}
              />
              <select
                value={statusFilter ?? ''}
                onChange={(e) => { setStatusFilter((e.target.value || undefined) as SupportRequestStatus | undefined); setPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none"
              >
                <option value="">All statuses</option>
                {['waiting', 'assigned', 'active', 'resolved', 'closed'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select
                value={urgencyFilter ?? ''}
                onChange={(e) => { setUrgencyFilter((e.target.value || undefined) as RequestUrgency | undefined); setPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none"
              >
                <option value="">All urgencies</option>
                {['normal', 'high', 'critical'].map((u) => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E8ECFF]">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Type / Reason</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Urgency</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Assigned To</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E8ECFF]">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No support requests found</td></tr>
                ) : requests.map((req) => {
                  const isWaitingTakeover = req.status === 'waiting';
                  return (
                    <tr
                      key={req.id}
                      className={`border-b transition-colors ${
                        isWaitingTakeover
                          ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500 border-b-rose-100'
                          : 'border-[#E8ECFF] hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{req.user_nickname ?? 'Anonymous'}</span>
                          {isWaitingTakeover && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <Headphones className="w-3 h-3 text-rose-600" />
                              Takeover Needed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{req.age_range} · {req.gender_identity}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-700 capitalize">{req.reason?.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-gray-400 capitalize">{req.status}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${URGENCY_BADGE[req.urgency] ?? ''}`}>{req.urgency}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {isWaitingTakeover ? (
                          <Badge className="text-xs bg-rose-600 text-white font-bold border-none hover:bg-rose-700 flex items-center gap-1 shadow-sm animate-pulse">
                            <Headphones className="w-3 h-3" />
                            Waiting Takeover
                          </Badge>
                        ) : (
                          <Badge className={`text-xs ${STATUS_BADGE[req.status] ?? ''}`}>{req.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{req.assigned_staff?.name ?? 'Unassigned'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{formatDate(req.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E8ECFF] flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 py-1 text-xs text-gray-600 font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
