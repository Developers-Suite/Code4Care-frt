import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  Card,
} from './ui/card';
import {
  Badge,
} from './ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import {
  Button,
} from './ui/button';
import {
  Users,
  AlertTriangle,
  Heart,
  BarChart3,
  Download,
} from 'lucide-react';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { getNumber } from '@/utils/analyticsUtils';
import { buildAdminExportFilename, downloadJsonFile } from '@/utils/adminExport';
import { StaffAccessService, StaffSession } from '@/services/staffAccessService';
import { HealthService } from '@/services';
import { logger } from '@/utils/logger';

interface AdminDashboardProps {
  selectedLanguage: string;
  session: StaffSession;
}

const AGE_COLORS = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];
const GENDER_COLORS = ['#7c3aed', '#f97316', '#e11d48', '#2563eb', '#16a34a', '#ca8a04'];
const LANGUAGE_COLORS = ['#1d4ed8', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];
const INVALID_REGION_KEYS = new Set([
  '',
  'string',
  'unknown',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  'other',
]);

function normalizeRegionKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function prettifyRegionLabel(regionKey: string): string {
  return regionKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function prettifyLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AdminDashboard({ selectedLanguage, session }: AdminDashboardProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('week');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const summary = await RealAnalyticsService.getAnalyticsSummary({ period }, session.accessToken).catch((error) => {
          logger.error('Failed to load analytics summary', error);
          return null;
        });

        if (mounted) {
          setAnalyticsData(summary ? RealAnalyticsService.normalizeAnalyticsSummary(summary) : null);
        }
      } catch (error) {
        logger.error('Failed to load analytics', error);
        setAnalyticsData(null);
      } finally {
        if (mounted) {
          setIsLoadingAnalytics(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [period, session.accessToken]);

  useEffect(() => {
    const loadRemoteStats = async () => {
      try {
        await StaffAccessService.getDashboardStats(session.accessToken);
      } catch (error) {
        logger.error('Failed to load dashboard stats', error);
      }
    };

    void loadRemoteStats();

    return () => {
      // cleanup if needed
    };
  }, [session.accessToken]);

  // Load system health status
  useEffect(() => {
    let mounted = true;

    const loadHealthStatus = async () => {
      try {
        const [health, ready, version] = await Promise.all([
          HealthService.checkHealth(),
          HealthService.checkReady(),
          HealthService.getVersion(),
        ]);

        if (mounted) {
          setHealthStatus({ health, ready, version });
        }
      } catch (error) {
        logger.error('Failed to load health status', error);
        setHealthStatus(null);
      }
    };

    void loadHealthStatus();

    // Refresh health status every 30 seconds
    const interval = setInterval(loadHealthStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const content = {
    en: {
      title: 'Analytics Dashboard',
      subtitle: 'Real-time insights and metrics',
      exportBtn: 'Export',
      overview: 'Overview',
      engagement: 'Engagement',
      safety: 'Safety',
      performance: 'Performance',
      metrics: 'Key Metrics',
      activeUsers: 'Active Users',
      engagements: 'Engagements',
      avgTime: 'Avg Engagement Time',
      satisfaction: 'Satisfaction',
      growth: 'User Growth',
      retention: 'Day-7 Retention',
      demographicsTitle: 'Demographics by Age',
      demographicsRegionTitle: 'Demographics by Region',
      demographicsGenderTitle: 'Demographics by Gender',
      topicsTitle: 'Topic Engagement',
      contentTitle: 'Story Module Performance',
      moduleName: 'Module',
      timesStarted: 'Started',
      completed: 'Completed',
      completionRate: 'Completion %',
      panicExitsLabel: 'Panic Exits',
      crisisInterventions: 'Crisis Interventions',
      selfHarmMentions: 'Self-Harm Mentions',
      suicidalMentions: 'Suicidal Ideation',
      userFollowUp: 'Users Followed Up',
    },
  };

  const lang = content[selectedLanguage as keyof typeof content] || content.en;

  const performanceTrendData = useMemo(() => analyticsData?.trends ?? [], [analyticsData?.trends]);

  const ageDemographicsData = useMemo(() => {
    const ageRange = analyticsData?.demographics?.ageRange as Record<string, any> | undefined;
    if (!ageRange || typeof ageRange !== 'object') {
      return [];
    }

    return Object.entries(ageRange)
      .map(([age, value]) => ({
        age,
        value: Number(value),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0);
  }, [analyticsData]);

  const genderDemographicsData = useMemo(() => {
    const gender = analyticsData?.demographics?.gender as Record<string, any> | undefined;
    if (!gender || typeof gender !== 'object') {
      return [];
    }

    return Object.entries(gender)
      .map(([key, value]) => ({
        gender: prettifyLabel(key),
        value: Number(value),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0);
  }, [analyticsData]);

  const languageDemographicsData = useMemo(() => {
    const languagePreference = analyticsData?.demographics?.languagePreference as Record<string, any> | undefined;
    if (!languagePreference || typeof languagePreference !== 'object') {
      return [];
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      twi: 'Twi',
      ewe: 'Ewe',
      ga: 'Ga',
    };

    return Object.entries(languagePreference)
      .map(([code, value]) => ({
        language: languageNames[code] ?? prettifyLabel(code),
        value: Number(value),
      }))
      .filter((item) => Number.isFinite(item.value) && item.value > 0);
  }, [analyticsData]);

  const regionDemographicsData = useMemo(() => {
    const regions = analyticsData?.demographics?.regions as Record<string, any> | undefined;
    if (!regions || typeof regions !== 'object') {
      return [];
    }

    return Object.entries(regions)
      .map(([region, value]) => {
        const normalizedRegion = normalizeRegionKey(region);
        const rawValue =
          typeof value === 'object' && value !== null
            ? value?.count ?? value?.value ?? value?.total ?? value?.users ?? 0
            : value;
        const numericValue = Number(rawValue);

        return {
          normalizedRegion,
          region: prettifyRegionLabel(normalizedRegion),
          value: Number.isFinite(numericValue) ? numericValue : 0,
        };
      })
      .filter((item) => !INVALID_REGION_KEYS.has(item.normalizedRegion) && item.region && item.value > 0)
      .map(({ region, value }) => ({ region, value }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData]);

  function CustomTooltip(props: any) {
    const { active, payload, label } = props;
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) return null;

    return (
      <div style={{ background: '#fff', padding: 8, border: '1px solid #E8ECFF' }}>
        {label !== undefined && <div style={{ fontSize: 12, color: '#334155', marginBottom: 6 }}>{String(label)}</div>}
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {payload.map((p: any, i: number) => {
            const raw = p.value;
            let display = '';
            if (raw === null || raw === undefined) display = String(raw);
            else if (typeof raw === 'object') {
              // Prefer selected language when available
              display = (raw[selectedLanguage] || raw.en || JSON.stringify(raw));
            } else {
              display = String(raw);
            }

            return (
              <li key={i} style={{ fontSize: 13, color: '#0f172a' }}>
                <strong style={{ marginRight: 6 }}>{p.name ?? p.dataKey ?? ''}:</strong>
                <span>{display}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const averageSatisfaction = useMemo(() => {
    // Prefer real feedback average from backend summary
    const fromSummary = getNumber(analyticsData?.summary, 'average_satisfaction', 'averageSatisfaction');
    if (fromSummary > 0) return fromSummary;

    // Fall back to topic-derived average if backend didn't return one
    const topics = analyticsData?.engagement?.topics ?? analyticsData?.engagement?.topicEngagement ?? [];
    if (topics.length === 0) return 0;
    const total = topics.reduce((sum: number, topic: any) => sum + Number(topic.satisfaction_score ?? topic.satisfactionScore ?? 0), 0);
    return Number((total / topics.length).toFixed(1));
  }, [analyticsData?.summary, analyticsData?.engagement?.topics, analyticsData?.engagement?.topicEngagement]);

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month';

  // KPI stats while loading
  const kpis = [
    { label: 'Total Users', value: getNumber(analyticsData?.summary, 'total_active_users', 'totalActiveUsers', 'active_users'), icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: `Active ${periodLabel}`, value: getNumber(analyticsData?.summary, 'users_in_period', 'usersInPeriod'), icon: Users, color: 'from-teal-500 to-teal-600' },
    { label: lang.engagements, value: getNumber(analyticsData?.summary, 'conversations_in_period', 'conversationsInPeriod', 'conversations'), icon: BarChart3, color: 'from-purple-500 to-purple-600' },
    { label: lang.satisfaction, value: averageSatisfaction || 0, icon: Heart, color: 'from-red-500 to-red-600' },
  ];

  // Safety metrics
  const safetyMetrics = [
    { label: 'Panic Exits', value: getNumber(analyticsData?.safety, 'panic_exits_total', 'panicExitsTotal', 'panic_exits'), icon: AlertTriangle, color: 'text-yellow-600' },
    { label: 'Crisis Interventions', value: getNumber(analyticsData?.safety, 'crisis_interventions', 'crisisInterventions', 'crisis_interventions_count'), icon: Heart, color: 'text-red-600' },
    { label: 'Self-Harm Mentions', value: getNumber(analyticsData?.safety, 'self_harm_mentions', 'selfHarmMentions', 'self_harm_mentions_count'), icon: AlertTriangle, color: 'text-orange-600' },
    { label: 'Suicidal Ideation', value: getNumber(analyticsData?.safety, 'suicidal_ideation_mentions', 'suicidalIdeationMentions', 'suicidal_ideation_count'), icon: AlertTriangle, color: 'text-red-700' },
  ];

  const handleExport = () => {
    downloadJsonFile(buildAdminExportFilename('analytics-dashboard'), {
      section: 'analytics-dashboard',
      generatedAt: new Date().toISOString(),
      period,
      summary: analyticsData?.summary ?? {},
      demographics: {
        ageRange: ageDemographicsData,
        gender: genderDemographicsData,
        languagePreference: languageDemographicsData,
        regions: regionDemographicsData,
      },
      safety: safetyMetrics,
      performance: performanceTrendData,
      raw: analyticsData,
    });
  };

  if (isLoadingAnalytics) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 w-96 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-5 w-64 bg-gray-100 rounded animate-pulse mb-6" />
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* KPI Skeleton */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E8ECFF] rounded-lg p-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="bg-white border border-[#E8ECFF] rounded-lg p-6">
            <div className="flex gap-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Skeleton component helper
  const KPISkeleton = () => (
    <div className="bg-white border border-[#E8ECFF] rounded-lg p-4">
      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  const ChartSkeleton = () => (
    <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
  );

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{lang.title}</h1>
              <p className="text-gray-500">{lang.subtitle}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              {lang.exportBtn}
            </Button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {([
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ] as const).map(({ id, label }) => (
              <Button
                key={id}
                variant={period === id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(id)}
                className={period === id ? 'bg-blue-600 text-white' : ''}
              >
                {label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                {isLoadingAnalytics && !analyticsData ? (
                  <KPISkeleton />
                ) : (
                  <Card className="p-4 bg-white border-[#E8ECFF]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{kpi.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      </div>
                      <div className={`bg-gradient-to-br ${kpi.color} p-2 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-[#E8ECFF]">
            <TabsTrigger value="overview">{lang.overview}</TabsTrigger>
            <TabsTrigger value="safety">{lang.safety}</TabsTrigger>
            <TabsTrigger value="performance">{lang.performance}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Demographics - Age & Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="p-6 bg-white border-[#E8ECFF]">
                  <h3 className="font-semibold text-gray-900 mb-4">{lang.demographicsTitle}</h3>
                  {isLoadingAnalytics ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={ageDemographicsData}
                          dataKey="value"
                          nameKey="age"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ age, percent }) => `${age} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {ageDemographicsData.map((_, idx) => (
                            <Cell key={idx} fill={AGE_COLORS[idx % AGE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-6 bg-white border-[#E8ECFF]">
                  <h3 className="font-semibold text-gray-900 mb-4">{lang.demographicsRegionTitle}</h3>
                  {isLoadingAnalytics ? (
                    <ChartSkeleton />
                  ) : regionDemographicsData.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-sm text-gray-500">
                      No region data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={regionDemographicsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                        <XAxis dataKey="region" stroke="#9CA3AF" style={{ fontSize: 11 }} angle={-45} textAnchor="end" height={70} />
                        <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#06B6D4" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-6 bg-white border-[#E8ECFF]">
                  <h3 className="font-semibold text-gray-900 mb-4">{lang.demographicsGenderTitle}</h3>
                  {isLoadingAnalytics ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={genderDemographicsData}
                          dataKey="value"
                          nameKey="gender"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ gender, percent }) => `${gender} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {genderDemographicsData.map((_, idx) => (
                            <Cell key={idx} fill={GENDER_COLORS[idx % GENDER_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-6 bg-white border-[#E8ECFF]">
                  <h3 className="font-semibold text-gray-900 mb-4">Language Preference</h3>
                  {isLoadingAnalytics ? (
                    <ChartSkeleton />
                  ) : languageDemographicsData.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-sm text-gray-500">
                      No language data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={languageDemographicsData}
                          dataKey="value"
                          nameKey="language"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ language, percent }) => `${language} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {languageDemographicsData.map((_, idx) => (
                            <Cell key={idx} fill={LANGUAGE_COLORS[idx % LANGUAGE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip />}
                          formatter={(value: number, name: string) => [value, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* Engagement removed to simplify dashboard. */}

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {safetyMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-4 bg-white border-[#E8ECFF]">
                      <Icon className={`w-6 h-6 ${metric.color} mb-2`} />
                      <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6 bg-white border-[#E8ECFF]">
              <h3 className="font-semibold text-gray-900 mb-4">System Metrics</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">{getNumber(analyticsData?.performance, 'avgResponseTime', 'avg_response_time_ms', 'response_time_ms')}ms</p>
                  <Badge className="mt-2 bg-green-50 text-green-600 border-green-200">Healthy</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">System Uptime</p>
                  <p className="text-3xl font-bold text-gray-900">{getNumber(analyticsData?.performance, 'systemUptime', 'system_uptime_percent', 'uptime_percent')}%</p>
                  <Badge className="mt-2 bg-green-50 text-green-600 border-green-200">Online</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{getNumber(analyticsData?.performance, 'messageProcessingSuccess', 'message_processing_success_percent', 'success_rate')}%</p>
                  <Badge className="mt-2 bg-blue-50 text-blue-600 border-blue-200">Excellent</Badge>
                </div>
              </div>
            </Card>

            {/* Performance Chart */}
            <Card className="p-6 bg-white border-[#E8ECFF]">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="timestamp" stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#0048ff" strokeWidth={2} name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
