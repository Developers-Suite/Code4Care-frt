import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { BookOpen, Brain, MapPin, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { getNumber } from '@/utils/analyticsUtils';
import { StaffSession } from '@/services/staffAccessService';
import { logger } from '@/utils/logger';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

const FEATURE_COLORS = ['#006d77', '#BE322D', '#F59E0B', '#8b5cf6', '#22c55e', '#ec4899'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#E8ECFF] last:border-0">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

interface FeatureEngagementPageProps {
  session: StaffSession;
}

export function FeatureEngagementPage({ session }: FeatureEngagementPageProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    RealAnalyticsService.getAnalyticsSummary({ period }, session.accessToken)
      .then((d) => RealAnalyticsService.normalizeAnalyticsSummary(d))
      .catch((e) => { logger.error('analytics', e); return null; })
      .then((a) => { if (mounted) { setAnalytics(a); setLoading(false); } });

    return () => { mounted = false; };
  }, [period, session.accessToken]);

  const funnel = analytics?.funnel ?? {};
  const totalSessions = getNumber(analytics?.summary ?? {}, 'total_active_users');

  const storyStarted = getNumber(funnel, 'completed_story_module') || 0;
  const storyCompleted = storyStarted; // backend only tracks completed
  const storyCompletionRate = storyStarted > 0 ? ((storyCompleted / storyStarted) * 100).toFixed(0) : '—';

  const pharmacySearches = getNumber(funnel, 'used_pharmacy');
  const crisisAccessed = getNumber(funnel, 'accessed_crisis_support');
  const onboarded = getNumber(funnel, 'completed_onboarding');
  const hadFirstChat = getNumber(funnel, 'had_first_chat');

  const funnelData = [
    { name: 'Onboarded', value: onboarded },
    { name: 'First Chat', value: hadFirstChat },
    { name: 'Story Module', value: storyStarted },
    { name: 'Pharmacy', value: pharmacySearches },
    { name: 'Crisis Support', value: crisisAccessed },
  ].filter((x) => x.value > 0);

  const featureAdoptionData = [
    { name: 'Chat', value: hadFirstChat || totalSessions, color: '#006d77' },
    { name: 'Story Module', value: storyStarted, color: '#BE322D' },
    { name: 'Resource Finder', value: pharmacySearches, color: '#F59E0B' },
    { name: 'Crisis Support', value: crisisAccessed, color: '#ef4444' },
  ].filter((x) => x.value > 0);

  const topicData = useMemo(() => {
    const topics = analytics?.engagement?.topics ?? analytics?.engagement?.topicEngagement ?? [];
    return (topics as any[])
      .map((t: any) => ({
        name: String(t.topic ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: Number(t.inquiries ?? t.count ?? 0),
        satisfaction: Number(t.satisfaction_score ?? t.avg_satisfaction ?? 0),
      }))
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [analytics]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feature Engagement</h1>
              <p className="text-sm text-gray-500 mt-0.5">Stories, myth-buster, resources and feature adoption</p>
            </div>
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
        </motion.div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Story Completions', value: storyCompleted.toLocaleString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completion Rate', value: storyCompletionRate !== '—' ? `${storyCompletionRate}%` : '—', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Resource Lookups', value: pharmacySearches.toLocaleString(), icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Crisis Support Accessed', value: crisisAccessed.toLocaleString(), icon: Brain, color: 'text-red-600', bg: 'bg-red-50' },
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

        {/* Feature adoption + funnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Feature Adoption</h3>
            {loading ? <Skeleton className="h-52 w-full" /> : featureAdoptionData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={featureAdoptionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {featureAdoptionData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5 border-[#E8ECFF] bg-white">
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">User Journey Funnel</h3>
            {loading ? <Skeleton className="h-52 w-full" /> : funnelData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-gray-400">No funnel data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Users">
                    {funnelData.map((_, i) => <Cell key={i} fill={FEATURE_COLORS[i % FEATURE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Topic satisfaction table */}
        {topicData.length > 0 && (
          <Card className="border-[#E8ECFF] bg-white overflow-hidden">
            <div className="p-5 border-b border-[#E8ECFF]">
              <h3 className="font-semibold text-gray-900 text-sm">Topic Engagement & Satisfaction</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#E8ECFF]">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Topic</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Inquiries</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Satisfaction</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-40">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {topicData.map((topic, i) => {
                    const maxVal = topicData[0]?.value || 1;
                    const pct = (topic.value / maxVal) * 100;
                    return (
                      <tr key={topic.name} className="border-b border-[#E8ECFF] hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{topic.name}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{topic.value.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          {topic.satisfaction > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {topic.satisfaction.toFixed(1)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#006d77]" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Journey stats */}
        <Card className="p-5 border-[#E8ECFF] bg-white">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Platform Journey Summary</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <StatRow label="Total sessions onboarded" value={onboarded.toLocaleString()} />
                <StatRow label="Had first chat" value={hadFirstChat.toLocaleString()} sub={onboarded > 0 ? `${((hadFirstChat / onboarded) * 100).toFixed(0)}% of onboarded` : undefined} />
                <StatRow label="Story modules completed" value={storyCompleted.toLocaleString()} />
              </div>
              <div>
                <StatRow label="Pharmacy / clinic searches" value={pharmacySearches.toLocaleString()} />
                <StatRow label="Crisis support accessed" value={crisisAccessed.toLocaleString()} />
                <StatRow label="Return rate" value={getNumber(funnel, 'return_rate_percent') > 0 ? `${getNumber(funnel, 'return_rate_percent').toFixed(1)}%` : '—'} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
