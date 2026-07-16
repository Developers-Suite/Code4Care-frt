import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Download,
  FileText,
  Users,
  ShieldAlert,
  Activity,
  TrendingUp,
  MessageSquare,
  TriangleAlert,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';

import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { generateAnalyticsExcelReport } from '@/utils/excelExporter';
import { logger } from '@/utils/logger';
import { generateReportFromAnalytics } from '@/utils/pdfReportGenerator';
import { getNumber, getString } from '@/utils/analyticsUtils';
import { formatLocaleLabel } from '@/utils/labelUtils';

interface AdminReportsProps {
  selectedLanguage: string;
}

type ReportType = 'overview' | 'activity' | 'demographics' | 'safety' | 'performance' | 'full';
type TrendRow = {
  date?: string;
  engagements?: number;
  totalMessages?: number;
  satisfactionAverage?: number;
  uniqueUsers?: number;
};

type TableRow = Record<string, string | number>;

const CHART_COLORS = ['#BE322D', '#F16365', '#F39A9B', '#F7C7C8', '#FDECEC'];

function downloadFile(fileName: string, data: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (!rows.length) {
    return 'key,value\n';
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number) => {
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCell(row[header] ?? '')).join(','));
  });

  return lines.join('\n');
}

interface AdminReportsProps {
  selectedLanguage: string;
  accessToken?: string;
}

export function AdminReports({ selectedLanguage, accessToken }: AdminReportsProps) {
  void selectedLanguage;
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear - 2);
  const [endYear, setEndYear] = useState(currentYear);
  const [reportType, setReportType] = useState<ReportType>('overview');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  void isLoading;

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await RealAnalyticsService.getAggregatedReportData({ period: 'month' }, accessToken);
        if (mounted) setAnalyticsData(data);
      } catch (error) {
        logger.error('Failed to load analytics for report', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [accessToken]);
  const reportRangeLabel = `${startYear} - ${endYear}`;
  const includedSections = useMemo(() => {
    if (reportType === 'full') {
      return ['Overview', 'Activity', 'Demographics', 'Safety', 'Performance', 'Insights'];
    }

    if (reportType === 'overview') {
      return ['Overview', 'Activity', 'Demographics', 'Safety', 'Performance'];
    }

    return [reportType.charAt(0).toUpperCase() + reportType.slice(1)];
  }, [reportType]);

  const reportCards = [
    {
      id: 'overview' as const,
      title: 'Overview Report',
      description: 'High-level snapshot of the full admin system.',
      icon: BarChart3,
    },
    {
      id: 'activity' as const,
      title: 'Activity Report',
      description: 'Engagements, messages, growth, and engagement quality.',
      icon: Activity,
    },
    {
      id: 'demographics' as const,
      title: 'Demographics Report',
      description: 'Age, gender, and language distribution snapshots.',
      icon: Users,
    },
    {
      id: 'safety' as const,
      title: 'Safety Report',
      description: 'Risk alerts, panic exits, and interventions overview.',
      icon: ShieldAlert,
    },
    {
      id: 'performance' as const,
      title: 'Performance Report',
      description: 'Response time, uptime, and backend stability.',
      icon: TrendingUp,
    },
    {
      id: 'full' as const,
      title: 'Full Data Report',
      description: 'Complete export package for the selected year range.',
      icon: FileText,
    },
  ];

  const safetyTotal = useMemo(() => {
    if (!analyticsData) return 0;

    return (
      getNumber(analyticsData?.safety, 'panic_exits_total', 'panicExitsTotal', 'panic_exits') +
      getNumber(analyticsData?.safety, 'crisis_interventions', 'crisisInterventions', 'crisisInterventionsTriggered', 'crisis_interventions_triggered') +
      getNumber(analyticsData?.safety, 'self_harm_mentions', 'selfHarmMentions', 'self_harm_mentions_detected') +
      getNumber(analyticsData?.safety, 'suicidal_ideation_mentions', 'suicidalIdeationMentions', 'suicidal_ideation') +
      getNumber(analyticsData?.safety, 'abuse_mentions', 'abuseMentionsDetected', 'abuse_mentions_detected') +
      getNumber(analyticsData?.safety, 'risks_escalated_to_human', 'risksEscalatedToHuman', 'total_escalated') +
      getNumber(analyticsData?.safety, 'concerned_users_followed_up', 'concernedUsersFollowedUp', 'followed_up')
    );
  }, [analyticsData]);

  const kpis = useMemo(() => {
    if (!analyticsData) return [];
    
    let totalEngagements = getNumber(analyticsData?.summary, 'conversations_in_period', 'conversationsInPeriod');
    let totalMessages = getNumber(analyticsData?.summary, 'messages_in_period', 'messagesInPeriod');
    let avgSatisfaction = '0.0';

    const trends = Array.isArray(analyticsData.trends) ? analyticsData.trends : [];
    if (trends.length > 0) {
      const satSum = trends.reduce((sum: number, item: any) => sum + (item.satisfactionAverage ?? item.satisfaction_average ?? 0), 0);
      avgSatisfaction = (satSum / trends.length).toFixed(1);
    } else {
      avgSatisfaction = getNumber(analyticsData?.summary, 'avg_satisfaction', 'averageSatisfaction').toFixed(1);
    }

    if (reportType === 'overview' || reportType === 'full') {
        return [
            { label: 'Active Users', value: getNumber(analyticsData?.demographics, 'totalActiveUsers', 'total_active_users', 'activeUsers', 'active_users'), icon: Users, color: 'text-blue-600' },
            { label: 'Total Engagements', value: totalEngagements, icon: Activity, color: 'text-purple-600' },
            { label: 'System Uptime', value: `${getNumber(analyticsData?.performance, 'systemUptime', 'system_uptime_percent', 'uptime_percent')}%`, icon: TrendingUp, color: 'text-green-600' },
            { label: 'Safety Alerts', value: safetyTotal, icon: ShieldAlert, color: 'text-red-600' },
          ];
    }

    if (reportType === 'activity') {
        return [
        { label: 'Total Engagements', value: totalEngagements, icon: Activity, color: 'text-blue-600' },
        { label: 'Total Messages', value: totalMessages, icon: MessageSquare, color: 'text-purple-600' },
        { label: 'New Users Today', value: getNumber(analyticsData?.demographics, 'newUsersToday', 'new_users_today', 'new_users_total'), icon: TrendingUp, color: 'text-green-600' },
        { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5`, icon: HeartPulse, color: 'text-pink-600' },
      ];
    }

    if (reportType === 'demographics') {
        return [
        { label: 'Active Users', value: getNumber(analyticsData?.demographics, 'totalActiveUsers', 'total_active_users', 'activeUsers', 'active_users'), icon: Users, color: 'text-blue-600' },
        { label: 'Returning Users', value: getNumber(analyticsData?.demographics, 'returningUsers', 'returning_users'), icon: TrendingUp, color: 'text-green-600' },
        { label: 'Top Age Segment', value: getString(analyticsData?.demographics, 'topAgeSegment', 'top_age_segment') || 'N/A', icon: BarChart3, color: 'text-indigo-600' },
        { label: 'Top Language', value: getString(analyticsData?.demographics, 'topLanguage', 'top_language') || 'N/A', icon: FileText, color: 'text-cyan-600' },
      ];
    }

    if (reportType === 'performance') {
      return [
        { label: 'Response Time', value: `${getNumber(analyticsData?.performance, 'avgResponseTime', 'avg_response_time_ms', 'response_time_ms')} ms`, icon: TrendingUp, color: 'text-blue-600' },
        { label: 'System Uptime', value: `${getNumber(analyticsData?.performance, 'systemUptime', 'system_uptime_percent', 'uptime_percent')}%`, icon: Activity, color: 'text-green-600' },
        { label: 'Success Rate', value: `${getNumber(analyticsData?.performance, 'messageProcessingSuccess', 'message_processing_success_percent', 'success_rate')}%`, icon: MessageSquare, color: 'text-purple-600' },
        { label: 'Errors', value: getNumber(analyticsData?.performance, 'crashesOrErrors', 'crashes_or_errors'), icon: TriangleAlert, color: 'text-red-600' },
      ];
    }

    return [
      { label: 'Panic Exits', value: getNumber(analyticsData?.safety, 'panicExitsTotal', 'panic_exits_total', 'panic_exits'), icon: TriangleAlert, color: 'text-yellow-600' },
      { label: 'Crisis Interventions', value: getNumber(analyticsData?.safety, 'crisisInterventionsTriggered', 'crisis_interventions_triggered', 'crisis_interventions'), icon: ShieldAlert, color: 'text-red-600' },
      { label: 'Escalated Risks', value: getNumber(analyticsData?.safety, 'risksEscalatedToHuman', 'risks_escalated_to_human'), icon: TriangleAlert, color: 'text-orange-600' },
      { label: 'Users Followed Up', value: getNumber(analyticsData?.safety, 'concernedUsersFollowedUp', 'concerned_users_followed_up'), icon: HeartPulse, color: 'text-blue-600' },
    ];
  }, [analyticsData, reportType]);

  const tableRows = useMemo(() => {
    if (!analyticsData) return [];

    const trends = (analyticsData.trends ?? []) as TrendRow[];
    const totalEngagements = trends.reduce((sum: number, item: TrendRow) => sum + (item.engagements ?? 0), 0);
    const totalMessages = trends.reduce((sum: number, item: TrendRow) => sum + (item.totalMessages ?? 0), 0);
    const avgSatisfaction = trends.length
      ? (
          trends.reduce((sum: number, item: TrendRow) => sum + (item.satisfactionAverage ?? 0), 0) /
          trends.length
        ).toFixed(1)
      : '0.0';

    if (reportType === 'activity') {
      return trends.map((item: TrendRow) => ({
        Date: item.date ?? '',
        Engagements: item.engagements ?? 0,
        Users: item.uniqueUsers ?? 0,
        Messages: item.totalMessages ?? 0,
        Satisfaction: item.satisfactionAverage ?? 0,
      })) as TableRow[];
    }

    if (reportType === 'demographics') {
      const ageData = Object.entries(analyticsData.demographics?.ageRange ?? {}).map(([ageRange, total]: [string, any]) => ({
        'Type': 'Age',
        'Category': ageRange,
        Users: total,
        Percentage: `${Math.round((total / (analyticsData.demographics?.totalActiveUsers ?? 1)) * 100)}%`,
      }));
      const regionData = Object.entries(analyticsData.demographics?.regions ?? {}).map(([region, total]: [string, any]) => ({
        'Type': 'Region',
        'Category': formatLocaleLabel(region, 'en'),
        Users: typeof total === 'object' ? ((total.count ?? total.value ?? Number(total)) || 0) : total,
        Percentage: `${Math.round(((typeof total === 'object' ? ((total.count ?? total.value ?? Number(total)) || 0) : total) / (analyticsData.demographics?.totalActiveUsers ?? 1)) * 100)}%`,
      }));
      return [...ageData, ...regionData];
    }

    if (reportType === 'performance') {
      return [
        { Metric: 'Response Time', Value: `${analyticsData.performance?.avgResponseTime ?? 0} ms` },
        { Metric: 'System Uptime', Value: `${analyticsData.performance?.systemUptime ?? 0}%` },
        { Metric: 'Message Processing Success', Value: `${analyticsData.performance?.messageProcessingSuccess ?? 0}%` },
        { Metric: 'Consecutive Hours Stable', Value: analyticsData.performance?.consecutiveHours ?? 0 },
        { Metric: 'Errors or Crashes', Value: analyticsData.performance?.crashesOrErrors ?? 0 },
      ];
    }

    if (reportType === 'full' || reportType === 'overview') {
      return [
        { Section: 'Overview', Metric: 'Active Users', Value: analyticsData.demographics?.totalActiveUsers ?? 0, Details: 'Summary user base' },
        { Section: 'Activity', Metric: 'Total Engagements', Value: totalEngagements, Details: `${totalMessages} messages, avg satisfaction ${avgSatisfaction}/5` },
        { Section: 'Demographics', Metric: 'Returning Users', Value: analyticsData.demographics?.returningUsers ?? 0, Details: 'Selected user retention snapshot' },
        { Section: 'Safety', Metric: 'Total Safety Events', Value: safetyTotal, Details: 'Panic exits, crisis interventions, mentions, escalations, and follow-ups included in JSON export' },
        { Section: 'Performance', Metric: 'System Uptime', Value: `${analyticsData.performance?.systemUptime ?? 0}%`, Details: `Response time ${analyticsData.performance?.avgResponseTime ?? 0} ms` },
        { Section: 'Insights', Metric: 'Top Insight', Value: analyticsData.adminInsights?.[0]?.title ?? 'No insight available', Details: analyticsData.adminInsights?.[0]?.description ?? 'No insight available' },
      ];
    }

    return [
      { Metric: 'Panic Exits', Value: analyticsData?.safety?.panicExitsTotal ?? 0 },
      { Metric: 'Crisis Interventions', Value: analyticsData?.safety?.crisisInterventionsTriggered ?? 0 },
      { Metric: 'Self-Harm Mentions', Value: analyticsData?.safety?.selfHarmMentionsDetected ?? 0 },
      { Metric: 'Suicidal Mentions', Value: analyticsData?.safety?.suicidalIdeationMentions ?? 0 },
      { Metric: 'Abuse Mentions', Value: analyticsData?.safety?.abuseMentionsDetected ?? 0 },
      { Metric: 'Risks Escalated', Value: analyticsData?.safety?.risksEscalatedToHuman ?? 0 },
    ];
  }, [analyticsData, reportType]);

  const buildExportPayload = () => ({
    generatedAt: analyticsData?.generatedAt ?? new Date().toISOString(),
    reportType,
    reportWindow: {
      startYear,
      endYear,
      label: reportRangeLabel,
    },
    includedSections,
    summary: analyticsData,
    rows: tableRows,
  });

  const handleExportJson = () => {
    downloadFile(
      `lydiacontactcenter-${reportType}-report-${reportRangeLabel.replace(/\s+/g, '').replace(/-/g, 'to')}.json`,
      JSON.stringify(buildExportPayload(), null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleExportCsv = () => {
    downloadFile(
      `lydiacontactcenter-${reportType}-report-${reportRangeLabel.replace(/\s+/g, '').replace(/-/g, 'to')}.csv`,
      toCsv(tableRows),
      'text/csv;charset=utf-8'
    );
  };

  const handleExportPdf = () => {
    if (!analyticsData) {
      logger.error('Analytics data not loaded');
      return;
    }

    const filename = `lydiacontactcenter-${reportType}-report-${reportRangeLabel.replace(/\s+/g, '').replace(/-/g, 'to')}.pdf`;
    generateReportFromAnalytics(
      analyticsData,
      reportType,
      {
        startYear,
        endYear,
        label: reportRangeLabel,
      },
      filename
    );
  };

  const handleExportExcel = () => {
    if (!analyticsData) {
      logger.error('Analytics data not loaded');
      return;
    }

    const filename = `code4care-${reportType}-report-${reportRangeLabel.replace(/\s+/g, '').replace(/-/g, 'to')}.xlsx`;
    generateAnalyticsExcelReport(
      analyticsData,
      reportType,
      {
        startYear,
        endYear,
        label: reportRangeLabel,
      },
      filename
    );
    logger.info(`Excel report exported: ${filename}`);
  };

  const ageChartData = analyticsData ? Object.entries(analyticsData.demographics?.ageRange ?? {}).map(([name, value]: [string, any]) => ({
    name,
    value,
  })) : [];

  const regionChartData = analyticsData ? Object.entries(analyticsData.demographics?.regions ?? {}).map(([name, value]: [string, any]) => ({
    name,
    value,
  })) : [];

  const overviewChartData = analyticsData ? [
    { name: 'Engagements', value: (analyticsData.trends ?? []).reduce((sum: number, item: TrendRow) => sum + (item.engagements ?? 0), 0) },
    { name: 'Active Users', value: analyticsData.demographics?.totalActiveUsers ?? 0 },
    { name: 'Safety Events', value: (analyticsData.safety?.panicExitsTotal ?? 0) + (analyticsData.safety?.crisisInterventionsTriggered ?? 0) },
    { name: 'Uptime', value: Math.round(analyticsData.performance?.systemUptime ?? 0) },
  ] : [];

  const safetyChartData = analyticsData ? [
    { name: 'Panic Exits', value: analyticsData.safety?.panicExitsTotal ?? 0 },
    { name: 'Crisis Interventions', value: analyticsData.safety?.crisisInterventionsTriggered ?? 0 },
    { name: 'Escalated Risks', value: analyticsData.safety?.risksEscalatedToHuman ?? 0 },
    { name: 'Follow-ups', value: analyticsData.safety?.concernedUsersFollowedUp ?? 0 },
  ] : [];

  const performanceChartData = analyticsData ? [
    { name: 'Response', value: analyticsData.performance?.avgResponseTime ?? 0 },
    { name: 'Uptime', value: Math.round(analyticsData.performance?.systemUptime ?? 0) },
    { name: 'Success', value: analyticsData.performance?.messageProcessingSuccess ?? 0 },
    { name: 'Errors', value: analyticsData.performance?.crashesOrErrors ?? 0 },
  ] : [];

  const previewChartTitle = reportType === 'demographics'
    ? 'Demographic Distribution'
    : reportType === 'safety'
      ? 'Safety Snapshot'
      : reportType === 'performance'
        ? 'Performance Snapshot'
        : reportType === 'full'
          ? 'Full Report Overview'
          : 'Trend Preview';

  const previewBadgeLabel = `${reportType.toUpperCase()} · ${reportRangeLabel}`;

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Build overview reports, choose a data focus, and export a full year-range package.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPdf}>
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A]" onClick={handleExportJson}>
            <FileText className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card className="p-5 bg-white border-[#E8ECFF]">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Report Builder</h2>
                <p className="text-sm text-gray-500">Choose the data focus and the year range to export.</p>
              </div>
              <Badge className="bg-[#FFF1F1] text-[#BE322D] border-[#F4D6D5]">{includedSections.length} sections</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {reportCards.map((card, idx) => {
                const Icon = card.icon;
                const isActive = reportType === card.id;
                return (
                  <motion.button
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => setReportType(card.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isActive
                        ? 'border-[#F16365] bg-[#FFF1F1] shadow-sm'
                        : 'border-[#E8ECFF] bg-white hover:border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-3 ${isActive ? 'text-[#BE322D]' : 'text-gray-500'}`} />
                    <p className="font-semibold text-gray-900">{card.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Report window</div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-500">From year</span>
                  <select
                    value={startYear}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setStartYear(value);
                      if (value > endYear) {
                        setEndYear(value);
                      }
                    }}
                    className="w-full rounded-lg border border-[#E8ECFF] bg-white px-3 py-2 text-gray-900"
                  >
                    {Array.from({ length: currentYear - 2019 }, (_, idx) => 2020 + idx).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-gray-500">To year</span>
                  <select
                    value={endYear}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setEndYear(value);
                      if (value < startYear) {
                        setStartYear(value);
                      }
                    }}
                    className="w-full rounded-lg border border-[#E8ECFF] bg-white px-3 py-2 text-gray-900"
                  >
                    {Array.from({ length: currentYear - 2019 }, (_, idx) => 2020 + idx).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">The export will include the requested year range as metadata for the full report package.</p>
            </div>

            <div className="rounded-xl border border-[#E8ECFF] bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Included sections</div>
              <div className="flex flex-wrap gap-2">
                {includedSections.map((section) => (
                  <Badge key={section} className="bg-white text-gray-700 border-[#E8ECFF]">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
              <Card className="p-4 bg-white border-[#E8ECFF]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  </div>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reportType === 'demographics' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-6 bg-white border-[#E8ECFF]">
              <h3 className="font-semibold text-gray-900 mb-4">Demographics by Age</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={ageChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}>
                    {ageChartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 bg-white border-[#E8ECFF]">
              <h3 className="font-semibold text-gray-900 mb-4">Demographics by Region</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                  <Bar dataKey="value" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-[#E8ECFF]">
            <h3 className="font-semibold text-gray-900 mb-4">{previewChartTitle}</h3>
            <ResponsiveContainer width="100%" height={280}>
              {reportType === 'demographics' ? (
                <LineChart data={analyticsData?.trends ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="engagements" stroke="#BE322D" strokeWidth={2} name="Engagements" />
                </LineChart>
              ) : reportType === 'performance' ? (
                <ComposedChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                  <Bar dataKey="value" fill="#BE322D" radius={[6, 6, 0, 0]} />
                </ComposedChart>
              ) : reportType === 'safety' ? (
                <BarChart data={safetyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                  <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={analyticsData?.trends ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="engagements" stroke="#BE322D" strokeWidth={2} name="Engagements" />
                  <Line type="monotone" dataKey="totalMessages" stroke="#3b82f6" strokeWidth={2} name="Messages" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6 bg-white border-[#E8ECFF]">
          <h3 className="font-semibold text-gray-900 mb-4">Section Preview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reportType === 'full' || reportType === 'overview' ? overviewChartData : tableRows.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECFF" />
              <XAxis dataKey={reportType === 'activity' ? 'Date' : 'name' in (overviewChartData[0] || {}) ? 'name' : 'Metric'} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
              <Bar dataKey={reportType === 'activity' ? 'Engagements' : 'value' in (overviewChartData[0] || {}) ? 'value' : 'Value'} fill="#BE322D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 bg-white border-[#E8ECFF]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Report Data Preview</h3>
          <Badge className="bg-blue-50 text-blue-600 border-blue-200">{previewBadgeLabel}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8ECFF]">
                {tableRows.length > 0 ? Object.keys(tableRows[0]).map((header) => (
                  <th key={header} className="text-left py-2 px-3 text-gray-600 font-semibold">
                    {header}
                  </th>
                )) : null}
              </tr>
            </thead>
            <tbody>
              {(tableRows as TableRow[]).map((row: TableRow, idx: number) => (
                <tr key={idx} className="border-b border-[#E8ECFF] last:border-0 hover:bg-gray-50">
                  {Object.values(row).map((value, valueIdx) => (
                    <td key={valueIdx} className="py-2 px-3 text-gray-700">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 bg-white border-[#E8ECFF]">
        <h3 className="font-semibold text-gray-900 mb-4">Recommended Insights</h3>
        <div className="grid grid-cols-2 gap-4">
          {(analyticsData?.adminInsights ?? []).slice(0, 4).map((insight: any) => (
            <div key={insight.id} className="rounded-xl border border-[#E8ECFF] bg-[#f8fbff] p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                <Badge className="bg-white text-blue-600 border-blue-200">{insight.priority}</Badge>
              </div>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
