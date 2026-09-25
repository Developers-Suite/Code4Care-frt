import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { ExportButton } from './ExportButton';
import { RealAnalyticsService, SafetyAnalyticsResponse } from '@/services/realAnalyticsService';
import { getNumber } from '@/utils/analyticsUtils';
import { StaffSession } from '@/services/staffAccessService';
import { logger } from '@/utils/logger';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

const CRISIS_COLORS: Record<string, string> = {
  self_harm: '#ef4444',
  suicidal_ideation: '#dc2626',
  abuse: '#f97316',
  severe_distress: '#f59e0b',
};
const CRISIS_LABELS: Record<string, string> = {
  self_harm: 'Self-Harm',
  suicidal_ideation: 'Suicidal Ideation',
  abuse: 'Abuse',
  severe_distress: 'Severe Distress',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

function FunnelStep({ label, value, sub, icon: Icon, color, arrow = true }: {
  label: string; value: number; sub?: string; icon: React.ElementType; color: string; arrow?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 rounded-xl p-4 ${color} flex items-center gap-3`}>
        <Icon className="w-5 h-5 text-white flex-shrink-0" />
        <div>
          <p className="text-white text-xs font-medium">{label}</p>
          <p className="text-white text-xl font-bold">{value.toLocaleString()}</p>
          {sub && <p className="text-white/70 text-xs">{sub}</p>}
        </div>
      </div>
      {arrow && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
    </div>
  );
}

interface SafetyCrisisPageProps {
  session: StaffSession;
}

export function SafetyCrisisPage({ session }: SafetyCrisisPageProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [safety, setSafety] = useState<SafetyAnalyticsResponse | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      RealAnalyticsService.getSafetyAnalytics({ period }, session.accessToken)
        .catch((e) => { logger.error('safety analytics', e); return null; }),
      RealAnalyticsService.getAnalyticsSummary({ period }, session.accessToken)
        .then((d) => RealAnalyticsService.normalizeAnalyticsSummary(d))
        .catch((e) => { logger.error('analytics', e); return null; }),
    ]).then(([s, a]) => {
      if (!mounted) return;
      setSafety(s);
      setAnalytics(a);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [period, session.accessToken]);

  const inc = safety?.incidents ?? {};
  const crisisTotal = getNumber(inc, 'total', 'crisis_total') || getNumber(analytics?.safety ?? {}, 'crisis_interventions');
  const panicTotal = getNumber(inc, 'panic_exits_total') || getNumber(analytics?.safety ?? {}, 'panic_exits_total');
  const interventions = getNumber(inc, 'crisis_total', 'crisis_interventions') || getNumber(analytics?.safety ?? {}, 'crisis_interventions');
  const escalatedHuman = getNumber(inc, 'risks_escalated_to_human') || getNumber(analytics?.safety ?? {}, 'risks_escalated_to_human');
  const followedUp = getNumber(inc, 'concerned_users_followed_up') || getNumber(analytics?.safety ?? {}, 'concerned_users_followed_up');
  const selfHarm = getNumber(inc, 'self_harm_mentions') || getNumber(safety?.severity_distribution ?? {}, 'self_harm') || getNumber(analytics?.safety ?? {}, 'self_harm_mentions');
  const suicidal = getNumber(inc, 'suicidal_ideation_mentions') || getNumber(safety?.severity_distribution ?? {}, 'suicidal_ideation') || getNumber(analytics?.safety ?? {}, 'suicidal_ideation_mentions');
  const abuse = getNumber(inc, 'abuse_mentions') || getNumber(safety?.severity_distribution ?? {}, 'abuse') || getNumber(analytics?.safety ?? {}, 'abuse_mentions');
  let severeDistress = getNumber(inc, 'severe_distress_mentions') || getNumber(safety?.severity_distribution ?? {}, 'severe_distress') || getNumber(analytics?.safety ?? {}, 'severe_distress_mentions', 'severeDistressMentions');

  // If crisisTotal exceeds the individual breakdown sums (e.g., uncategorized events),
  // attribute the remaining count so the chart never omits recorded crisis events
  const breakdownSum = selfHarm + suicidal + abuse + severeDistress;
  if (crisisTotal > breakdownSum) {
    severeDistress += (crisisTotal - breakdownSum);
  }

  const crisisTypeData = useMemo(() => {
    const data = [
      { name: 'Self-Harm', value: selfHarm, key: 'self_harm' },
      { name: 'Suicidal Ideation', value: suicidal, key: 'suicidal_ideation' },
      { name: 'Abuse', value: abuse, key: 'abuse' },
      { name: 'Severe Distress', value: severeDistress, key: 'severe_distress' },
    ].filter((x) => x.value > 0);
    return data;
  }, [selfHarm, suicidal, abuse, severeDistress]);

  const eventChartData = useMemo(() => {
    const bars = [
      { name: 'Self-Harm', value: selfHarm, fill: '#ef4444' },
      { name: 'Suicidal Ideation', value: suicidal, fill: '#dc2626' },
      { name: 'Abuse', value: abuse, fill: '#f97316' },
      { name: 'Severe Distress', value: severeDistress, fill: '#f59e0b' },
      { name: 'Panic Button', value: panicTotal, fill: '#8b5cf6' },
    ];
    return bars;
  }, [selfHarm, suicidal, abuse, severeDistress, panicTotal]);

  const periodLabel =
    period === 'today' ? 'Today' :
    period === 'week' ? 'This Week' :
    period === 'month' ? 'This Month' :
    period === 'year' ? 'This Year' : 'All Time';
  const hasCrisis = crisisTotal > 0 || panicTotal > 0;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety & Crisis</h1>
              <p className="text-sm text-gray-500 mt-0.5">Crisis detection, panic events and escalation tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton
                data={{
                  title: `Safety & Crisis — ${periodLabel}`,
                  filename: 'safety-crisis',
                  headers: ['Metric', 'Value'],
                  rows: [
                    ['Crisis Events', String(crisisTotal)],
                    ['Panic Button Uses', String(panicTotal)],
                    ['Self-Harm', String(selfHarm)],
                    ['Suicidal Ideation', String(suicidal)],
                    ['Abuse', String(abuse)],
                    ['Severe Distress', String(severeDistress)],
                    ...crisisTypeData.map((d) => [`Crisis Type: ${d.name}`, String(d.value)]),
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

        {/* Alert banner */}
        {!loading && hasCrisis && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {crisisTotal} crisis event{crisisTotal !== 1 ? 's' : ''} and {panicTotal} panic activation{panicTotal !== 1 ? 's' : ''} recorded {periodLabel.toLowerCase()}. Review below for details.
            </p>
          </motion.div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Crisis Events', value: crisisTotal, icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-600', border: 'border-red-200' },
            { label: 'Panic Button Uses', value: panicTotal, icon: Zap, bg: 'bg-yellow-100', color: 'text-yellow-700', border: 'border-yellow-200' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className={`p-4 border ${item.border} bg-white`}>
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

        {/* Crisis & Panic Bar Chart */}
        <Card className="p-5 border-[#E8ECFF] bg-white">
          <h3 className="font-semibold text-gray-900 mb-1 text-sm">Crisis Events & Panic Button — {periodLabel}</h3>
          <p className="text-xs text-gray-400 mb-4">Count of each crisis type detected and panic button presses in the selected period</p>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : eventChartData.every((d) => d.value === 0) ? (
            <div className="h-56 flex items-center justify-center text-sm text-gray-400">No events recorded {periodLabel.toLowerCase()}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8ECFF' }}
                  formatter={(value: number) => [value, 'Events']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Events">
                  {eventChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          {!loading && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#E8ECFF]">
              {eventChartData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-gray-600">{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
