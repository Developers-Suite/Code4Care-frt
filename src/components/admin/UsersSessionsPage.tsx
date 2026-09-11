import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, UserCheck, Activity, Monitor, Smartphone, Tablet } from 'lucide-react';
import { ExportButton } from './ExportButton';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { getNumber } from '@/utils/analyticsUtils';
import { StaffSession } from '@/services/staffAccessService';
import { logger } from '@/utils/logger';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

const AGE_COLORS = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4'];
const GENDER_COLORS = ['#7c3aed', '#f97316', '#e11d48', '#2563eb'];
const REGION_COLORS = ['#006d77', '#BE322D', '#F59E0B', '#22c55e', '#8b5cf6', '#ec4899', '#0ea5e9', '#84cc16'];
const DEVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function prettify(s: string) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface UsersSessionsPageProps {
  session: StaffSession;
}

export function UsersSessionsPage({ session }: UsersSessionsPageProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      RealAnalyticsService.getAnalyticsSummary({ period }, session.accessToken)
        .then((d) => RealAnalyticsService.normalizeAnalyticsSummary(d))
        .catch((e) => { logger.error('analytics summary', e); return null; }),
      RealAnalyticsService.getUserAnalytics({ period }, session.accessToken)
        .catch((e) => { logger.error('user analytics', e); return null; }),
    ]).then(([a, u]) => {
      if (!mounted) return;
      setAnalytics(a);
      setUserAnalytics(u);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [period, session.accessToken]);

  const totalUsers = getNumber(analytics?.summary ?? {}, 'total_active_users');
  const newUsers = userAnalytics?.new_users ?? getNumber(analytics?.summary ?? {}, 'new_users_in_period');
  const returning = userAnalytics?.returning_users ?? getNumber(analytics?.summary ?? {}, 'returning_users');
  const retentionRate = userAnalytics?.retention_rate ?? 0;
  const avgSessionMin = getNumber(analytics?.summary ?? {}, 'average_session_duration_minutes');
  const analyticsConsent = getNumber(analytics?.summary ?? {}, 'analytics_consent_rate');

  const ageData = useMemo(() => {
    const d = analytics?.demographics?.ageRange ?? analytics?.demographics?.age_range ?? {};
    return Object.entries(d).map(([k, v]) => ({ name: k, value: Number(v) })).filter((x) => x.value > 0);
  }, [analytics]);

  const genderData = useMemo(() => {
    const d = analytics?.demographics?.gender ?? {};
    return Object.entries(d).map(([k, v]) => ({ name: prettify(k), value: Number(v) })).filter((x) => x.value > 0);
  }, [analytics]);

  const regionData = useMemo(() => {
    const d = analytics?.demographics?.regions ?? {};
    return Object.entries(d)
      .map(([k, v]) => ({ name: prettify(k), value: typeof v === 'object' ? Number((v as any)?.count ?? 0) : Number(v) }))
      .filter((x) => x.value > 0 && x.name.toLowerCase() !== 'unknown')
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [analytics]);

  const langData = useMemo(() => {
    const d = analytics?.demographics?.languagePreference ?? {};
    const names: Record<string, string> = { en: 'English', twi: 'Twi', ewe: 'Ewe', ga: 'Ga', ha: 'Hausa' };
    return Object.entries(d).map(([k, v]) => ({ name: names[k] ?? prettify(k), value: Number(v) })).filter((x) => x.value > 0);
  }, [analytics]);

  const deviceData = useMemo(() => {
    const d = userAnalytics?.sessions?.device_breakdown ?? userAnalytics?.engagement_distribution ?? {};
    return Object.entries(d).map(([k, v]) => ({ name: prettify(k), value: Number(v) })).filter((x) => x.value > 0);
  }, [userAnalytics]);

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
              <h1 className="text-2xl font-bold text-gray-900">Users & Sessions</h1>
              <p className="text-sm text-gray-500 mt-0.5">Demographics, retention and session analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                data={{
                  title: `Users & Sessions — ${periodLabel}`,
                  filename: 'users-sessions',
                  headers: ['Metric', 'Value'],
                  rows: [
                    ['Total Sessions', String(totalUsers)],
                    [`New (${periodLabel})`, String(newUsers)],
                    ...ageData.map((d) => [`Age: ${d.name}`, String(d.value)]),
                    ...genderData.map((d) => [`Gender: ${d.name}`, String(d.value)]),
                    ...regionData.map((d) => [`Region: ${d.name}`, String(d.value)]),
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
          {[
            { label: 'Total Sessions', value: totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: `New ${periodLabel}`, value: newUsers.toLocaleString(), icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="p-4 border-[#E8ECFF] bg-white">
                {loading ? (
                  <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-14" /></div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${item.bg} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                      <p className="text-xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Age + Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Age Distribution</h3>
            {loading ? <Skeleton className="h-52 w-full" /> : ageData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No age data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Sessions">
                    {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Gender Identity</h3>
            {loading ? <Skeleton className="h-52 w-full" /> : genderData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No gender data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Region + Language */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Geographic Distribution (Top Regions)</h3>
            {loading ? <Skeleton className="h-56 w-full" /> : regionData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-400">No region data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" horizontal={false} />
                  <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Sessions">
                    {regionData.map((_, i) => <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Language Preference</h3>
            {loading ? <Skeleton className="h-56 w-full" /> : langData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-400">No language data</div>
            ) : (
              <div className="space-y-3 pt-1">
                {langData.map((item, i) => {
                  const total = langData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{item.name}</span>
                        <span className="text-gray-500">{item.value.toLocaleString()} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: REGION_COLORS[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Device breakdown */}
        {deviceData.length > 0 && (
          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Device & Session Breakdown</h3>
            <div className="flex flex-wrap gap-4">
              {deviceData.map((item, i) => {
                const Icon = item.name.toLowerCase().includes('mobile') ? Smartphone : item.name.toLowerCase().includes('tablet') ? Tablet : Monitor;
                const total = deviceData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? (item.value / total * 100).toFixed(0) : '0';
                return (
                  <div key={item.name} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.value.toLocaleString()} ({pct}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
