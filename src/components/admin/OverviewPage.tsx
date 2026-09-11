import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, MessageSquare, Clock, Heart, AlertTriangle,
  TrendingUp, TrendingDown, FileText, Zap, ShieldAlert,
} from 'lucide-react';
import { ExportButton } from './ExportButton';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { StaffAccessService, StaffSession, AdminDashboardStats } from '@/services/staffAccessService';
import { getNumber } from '@/utils/analyticsUtils';
import { logger } from '@/utils/logger';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

const PLATFORM_COLORS = ['#006d77', '#BE322D', '#F59E0B'];
const LANG_COLORS = ['#1d4ed8', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}) {
  return (
    <Card className="p-4 border-[#E8ECFF] bg-white">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <div className={`p-1.5 rounded-lg ${color}`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
              {sub}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

interface OverviewPageProps {
  session: StaffSession;
}

export function OverviewPage({ session }: OverviewPageProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [a, s] = await Promise.all([
        RealAnalyticsService.getAnalyticsSummary({ period }, session.accessToken)
          .then((d) => RealAnalyticsService.normalizeAnalyticsSummary(d))
          .catch((e) => { logger.error('analytics summary polling', e); return null; }),
        StaffAccessService.getDashboardStats(session.accessToken)
          .catch((e) => { logger.error('dashboard stats polling', e); return null; }),
      ]);
      if (a) setAnalytics(a);
      if (s) setStats(s);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [period, session.accessToken]);

  // Real-time auto refresh (every 8s)
  useEffect(() => {
    void fetchOverview(true);
    const interval = setInterval(() => {
      void fetchOverview(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchOverview]);

  const trends = useMemo(() => (analytics?.trends ?? []).slice(0, 14), [analytics]);

  const platformData = useMemo(() => {
    const d = analytics?.demographics?.platforms ?? analytics?.demographics?.platform_breakdown ?? {};
    return Object.entries(d).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: Number(v) })).filter((x) => x.value > 0);
  }, [analytics]);

  const langData = useMemo(() => {
    const d = analytics?.demographics?.languagePreference ?? {};
    const names: Record<string, string> = { en: 'English', twi: 'Twi', ewe: 'Ewe', ga: 'Ga', ha: 'Hausa' };
    return Object.entries(d).map(([k, v]) => ({ name: names[k] ?? k, value: Number(v) })).filter((x) => x.value > 0);
  }, [analytics]);

  const totalUsers = getNumber(analytics?.summary ?? {}, 'total_active_users');
  const activeInPeriod = getNumber(analytics?.summary ?? {}, 'users_in_period');
  const totalMessages = stats?.total_messages ?? getNumber(analytics?.summary ?? {}, 'total_messages');
  const messagesInPeriod = getNumber(analytics?.summary ?? {}, 'messages_in_period');
  const avgResponseMs = stats?.avg_response_time_ms ?? getNumber(analytics?.performance ?? {}, 'avgResponseTime');
  const satisfaction = getNumber(analytics?.summary ?? {}, 'average_satisfaction');
  const crisisTotal = getNumber(analytics?.safety ?? {}, 'crisis_interventions');
  const panicTotal = getNumber(analytics?.safety ?? {}, 'panic_exits_total');

  const periodLabel =
    period === 'today' ? 'Today' :
    period === 'week' ? 'This Week' :
    period === 'month' ? 'This Month' :
    period === 'year' ? 'This Year' : 'All Time';

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
              <p className="text-sm text-gray-500 mt-0.5">Executive summary · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                data={{
                  title: `Overview — ${periodLabel}`,
                  filename: 'overview',
                  headers: ['Metric', 'Value'],
                  rows: [
                    ['Total Sessions', String(totalUsers)],
                    [`Active (${periodLabel})`, String(activeInPeriod)],
                    ['Total Messages', String(totalMessages)],
                    [`Messages (${periodLabel})`, String(messagesInPeriod)],
                    ['Avg Response Time (ms)', String(avgResponseMs)],
                    ['Avg Satisfaction', satisfaction > 0 ? satisfaction.toFixed(1) : '—'],
                    ['Crisis Events', String(crisisTotal)],
                    ['Panic Events', String(panicTotal)],
                    ['Pending Reports', String(stats?.pending_reports ?? 0)],
                    ...platformData.map((d) => [`Platform: ${d.name}`, String(d.value)]),
                    ...langData.map((d) => [`Language: ${d.name}`, String(d.value)]),
                  ],
                }}
              />
              <div className="flex gap-1 bg-white border border-[#E8ECFF] rounded-lg p-1">
                {([
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'year', label: 'Year' },
                  { id: 'all', label: 'All Time' },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setPeriod(id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      period === id ? 'bg-[#BE322D] text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <KpiCard label="Total Sessions" value={totalUsers.toLocaleString()} sub={`${activeInPeriod} active ${periodLabel.toLowerCase()}`} icon={Users} color="bg-blue-500" trend="up" loading={loading} />
          <KpiCard label="Total Messages" value={totalMessages.toLocaleString()} sub={`${messagesInPeriod} ${periodLabel.toLowerCase()}`} icon={MessageSquare} color="bg-violet-500" trend="up" loading={loading} />
          <KpiCard label="Avg Response" value={avgResponseMs > 0 ? `${avgResponseMs}ms` : '—'} sub="Bot response time" icon={Clock} color="bg-teal-500" loading={loading} />
          <KpiCard label="Satisfaction" value={satisfaction > 0 ? `${satisfaction.toFixed(1)}/5` : '—'} sub="Average rating" icon={Heart} color="bg-pink-500" loading={loading} />
          <KpiCard label="Crisis Events" value={crisisTotal} sub={`${panicTotal} panic button uses`} icon={ShieldAlert} color="bg-red-500" loading={loading} />
        </motion.div>
      </div>
    </div>
  );
}
