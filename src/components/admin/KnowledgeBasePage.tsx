import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportButton } from './ExportButton';
import { logger } from '@/utils/logger';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

interface Document {
  id: string;
  title: string;
  language: string;
  status: string;
  topics: string[];
  chunk_count: number;
  reviewed_by?: string;
  reviewed_at?: string;
  valid_until?: string;
  created_at: string;
  source_url?: string;
}

interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700 border-green-200',
  pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_CHART_COLORS: Record<string, string> = {
  approved: '#22c55e',
  pending_review: '#f59e0b',
  draft: '#9ca3af',
  rejected: '#ef4444',
  archived: '#64748b',
};

const LANG_NAMES: Record<string, string> = { en: 'English', twi: 'Twi', ewe: 'Ewe', ga: 'Ga', ha: 'Hausa' };

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso?: string) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

async function fetchDocuments(page: number, pageSize: number, statusFilter: string | null, token?: string): Promise<DocumentListResponse | null> {
  if (!API_BASE_URL) return null;
  try {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (statusFilter) {
      params.set('status_filter', statusFilter);
      params.set('status', statusFilter);
    }
    const res = await fetch(`${API_BASE_URL}/admin/documents?${params}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return null;
    return await res.json() as DocumentListResponse;
  } catch (e) {
    logger.error('documents fetch', e);
    return null;
  }
}

interface KnowledgeBasePageProps {
  session: { accessToken?: string };
}

export function KnowledgeBasePage({ session }: KnowledgeBasePageProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchDocuments(page, pageSize, statusFilter, session.accessToken).then((r) => {
      if (!mounted) return;
      setDocs(r?.documents ?? []);
      setTotal(r?.total ?? 0);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [page, statusFilter, session.accessToken]);

  const totalPages = Math.ceil(total / pageSize);

  const statusCounts = docs.reduce((acc, d) => { acc[d.status] = (acc[d.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const statusChartData = Object.entries(statusCounts).map(([k, v]) => ({ name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: v, key: k }));

  const langCounts = docs.reduce((acc, d) => { const l = LANG_NAMES[d.language] ?? d.language; acc[l] = (acc[l] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const langChartData = Object.entries(langCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const expiringSoon = docs.filter((d) => { const days = daysUntil(d.valid_until); return days !== null && days <= 30 && days >= 0; });
  const approved = statusCounts['approved'] ?? 0;
  const pendingReview = statusCounts['pending_review'] ?? 0;
  const totalChunks = docs.reduce((s, d) => s + (d.chunk_count ?? 0), 0);
  const avgChunks = docs.length > 0 ? (totalChunks / docs.length).toFixed(0) : '—';

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-0.5">RAG document pipeline — status, coverage and expiry tracking</p>
        </motion.div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Documents', value: total.toLocaleString(), icon: BookOpen, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Approved', value: approved.toString(), icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Pending Review', value: pendingReview.toString(), icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Expiring ≤ 30d', value: expiringSoon.length.toString(), icon: AlertCircle, bg: 'bg-red-50', color: 'text-red-600' },
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
                      <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Pipeline status chart + language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Document Pipeline Status</h3>
            {loading ? <Skeleton className="h-52 w-full" /> : statusChartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No documents found</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Documents">
                    {statusChartData.map((item) => <Cell key={item.key} fill={STATUS_CHART_COLORS[item.key] ?? '#9ca3af'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Documents by Language</h3>
            {loading ? <Skeleton className="h-52 w-full" /> : langChartData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data</div>
            ) : (
              <div className="space-y-3 pt-2">
                {langChartData.map((item, i) => {
                  const total = langChartData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  const colors = ['#006d77', '#BE322D', '#F59E0B', '#8b5cf6', '#22c55e'];
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <span className="text-gray-400">{item.value} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-[#E8ECFF] text-xs text-gray-500 flex justify-between">
                  <span>Avg chunks / doc</span><span className="font-semibold text-gray-900">{avgChunks}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Expiring soon */}
        {expiringSoon.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 overflow-hidden">
            <div className="p-4 border-b border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-amber-900 text-sm">{expiringSoon.length} Document{expiringSoon.length !== 1 ? 's' : ''} Expiring Within 30 Days</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-200">
                    <th className="text-left text-xs font-medium text-amber-700 px-4 py-2">Title</th>
                    <th className="text-left text-xs font-medium text-amber-700 px-4 py-2">Language</th>
                    <th className="text-left text-xs font-medium text-amber-700 px-4 py-2">Reviewed By</th>
                    <th className="text-left text-xs font-medium text-amber-700 px-4 py-2">Expires</th>
                    <th className="text-left text-xs font-medium text-amber-700 px-4 py-2">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoon.map((doc) => {
                    const days = daysUntil(doc.valid_until);
                    return (
                      <tr key={doc.id} className="border-b border-amber-100">
                        <td className="px-4 py-2 font-medium text-gray-900 max-w-xs truncate">{doc.title}</td>
                        <td className="px-4 py-2 text-xs">{LANG_NAMES[doc.language] ?? doc.language}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{doc.reviewed_by ?? '—'}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{formatDate(doc.valid_until)}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs font-bold ${days !== null && days <= 7 ? 'text-red-600' : 'text-amber-700'}`}>{days} days</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Full document list */}
        <Card className="border-[#E8ECFF] bg-white overflow-hidden">
          <div className="p-5 border-b border-[#E8ECFF] flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">All Documents</h3>
            <div className="flex items-center gap-2">
              <ExportButton
                data={{
                  title: 'Knowledge Base Documents',
                  filename: 'knowledge-base',
                  headers: ['Title', 'Language', 'Status', 'Topics', 'Chunks', 'Valid Until', 'Created'],
                  rows: docs.map((d) => [
                    d.title,
                    LANG_NAMES[d.language] ?? d.language,
                    d.status,
                    (d.topics ?? []).join(', '),
                    String(d.chunk_count ?? 0),
                    d.valid_until ? new Date(d.valid_until).toLocaleDateString('en-GB') : '—',
                    new Date(d.created_at).toLocaleDateString('en-GB'),
                  ]),
                }}
              />
              <select
                value={statusFilter ?? ''}
                onChange={(e) => { setStatusFilter(e.target.value || null); setPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none"
              >
                <option value="">All statuses</option>
                {['approved', 'pending_review', 'draft', 'rejected', 'archived'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E8ECFF]">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Language</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Chunks</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Reviewed By</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Valid Until</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E8ECFF]">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : docs.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No documents found</td></tr>
                ) : docs.map((doc) => {
                  const days = daysUntil(doc.valid_until);
                  const expiring = days !== null && days <= 30;
                  return (
                    <tr key={doc.id} className="border-b border-[#E8ECFF] hover:bg-gray-50/50">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                        {doc.topics?.length > 0 && (
                          <p className="text-xs text-gray-400 truncate">{doc.topics.slice(0, 3).join(', ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{LANG_NAMES[doc.language] ?? doc.language}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${STATUS_COLORS[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {doc.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-700">{doc.chunk_count}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{doc.reviewed_by ?? '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {doc.valid_until ? (
                          <span className={expiring ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                            {formatDate(doc.valid_until)}{expiring ? ` (${days}d)` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(doc.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E8ECFF] flex items-center justify-between">
              <span className="text-gray-500 text-xs">Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}</span>
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
