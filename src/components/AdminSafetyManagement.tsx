import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Heart, Shield, PhoneCall, BarChart3, AlertTriangle, Siren, BadgeCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RealAnalyticsService } from '@/services/realAnalyticsService';
import { getNumber } from '@/utils/analyticsUtils';
import { buildAdminExportFilename, downloadJsonFile } from '@/utils/adminExport';
import { logger } from '@/utils/logger';

interface AdminSafetyManagementProps {
  selectedLanguage: string;
  accessToken?: string;
}

export function AdminSafetyManagement({ selectedLanguage, accessToken }: AdminSafetyManagementProps) {
  void selectedLanguage;
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in-review' | 'escalated' | 'resolved'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [safetyAnalytics, setSafetyAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load directly from the safety analytics endpoint which queries panic_events + crisis_events.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const safetyResponse = await RealAnalyticsService.getSafetyAnalytics(
          { period: 'week' },
          accessToken,
        );
        setSafetyAnalytics(safetyResponse);
      } catch (err) {
        logger.error('Failed to load safety analytics', err);
        setError(err instanceof Error ? err.message : 'Failed to load safety analytics');
        setSafetyAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [accessToken]);

  // The safety endpoint returns { incidents: {...}, escalations: {...}, severity_distribution: {...} }
  const incidents = (safetyAnalytics as any)?.incidents ?? {};
  const escalationsData = (safetyAnalytics as any)?.escalations ?? {};

  const indicatorChartData = [
    { indicator: 'Panic Exits', count: getNumber(incidents, 'panic_exits_total') },
    { indicator: 'Crisis Interventions', count: getNumber(incidents, 'crisis_interventions') },
    { indicator: 'Self-Harm', count: getNumber(incidents, 'self_harm_mentions') },
    { indicator: 'Suicidal Ideation', count: getNumber(incidents, 'suicidal_ideation_mentions') },
    { indicator: 'Severe Distress', count: getNumber(incidents, 'severe_distress_mentions') },
    { indicator: 'Abuse', count: getNumber(incidents, 'abuse_mentions') },
  ];

  const totalSafetyEvents = indicatorChartData.reduce((sum, item) => sum + item.count, 0);

  const stats = {
    total: totalSafetyEvents,
    crisisInterventions: getNumber(incidents, 'crisis_interventions'),
    selfHarmMentions: getNumber(incidents, 'self_harm_mentions'),
    suicidalIdeation: getNumber(incidents, 'suicidal_ideation_mentions'),
    escalations: getNumber(escalationsData, 'total_escalated', 'to_human_consultant'),
    followUpPending: getNumber(escalationsData, 'follow_up_pending') || getNumber(incidents, 'concerned_users_followed_up'),
  };

  const severityStats = (safetyAnalytics as any)?.severity_distribution ?? {
    low: getNumber(incidents, 'severe_distress_mentions'),
    medium: getNumber(incidents, 'abuse_mentions'),
    high: getNumber(incidents, 'self_harm_mentions'),
    critical: getNumber(incidents, 'suicidal_ideation_mentions'),
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'critical': return 'bg-red-50 text-red-600 border-red-200';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-50 text-red-600 border-red-200';
      case 'in-review': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'escalated': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'resolved': return 'bg-green-50 text-green-600 border-green-200';
      default: return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'self_harm':
      case 'self-harm': return 'Self-Harm';
      case 'suicidal_ideation':
      case 'suicidal': return 'Suicidal Ideation';
      case 'severe_distress': return 'Severe Distress';
      case 'abuse': return 'Abuse';
      case 'panic': return 'Panic';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'self_harm':
      case 'self-harm':
        return <Heart className="w-4 h-4 text-red-600" />;
      case 'suicidal_ideation':
      case 'suicidal':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'severe_distress':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'abuse':
        return <Siren className="w-4 h-4 text-orange-600" />;
      case 'panic':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleExport = () => {
    downloadJsonFile(buildAdminExportFilename('safety-management'), {
      section: 'safety-management',
      generatedAt: new Date().toISOString(),
      stats,
      totalSafetyEvents,
      severityDistribution: severityStats,
      analytics: safetyAnalytics,
    });
  };

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Safety & Crisis Management</h1>
          <p className="text-gray-500">Monitor and respond to user safety concerns and mental health crises</p>
        </div>
        <Button variant="outline" className="gap-2 border-[#E8ECFF] hover:bg-gray-50" onClick={handleExport}>
          <BarChart3 className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Alert */}
      {stats.crisisInterventions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">{stats.crisisInterventions} crisis intervention(s) this period</span>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: stats.total, icon: BarChart3, iconClass: 'text-slate-600' },
          { label: 'Crisis Interventions', value: stats.crisisInterventions, icon: Heart, iconClass: 'text-red-600' },
          { label: 'Escalations', value: stats.escalations, icon: Siren, iconClass: 'text-purple-600' },
          { label: 'Follow-ups Pending', value: stats.followUpPending, icon: BadgeCheck, iconClass: 'text-blue-600' },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="p-4 bg-white border-[#E8ECFF]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-600">{stat.label}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</div>
                </div>
                <stat.icon className={`w-6 h-6 ${stat.iconClass}`} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Severity Distribution Chart */}
      <Card className="p-6 bg-white border-[#E8ECFF]">
        <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Safety Indicators
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={indicatorChartData}>
            <XAxis dataKey="indicator" stroke="#9CA3AF" style={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E8ECFF' }} />
            <Bar dataKey="count" fill="#EF4444" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Safety Summary Card */}
      <Card className="p-6 bg-white border-[#E8ECFF]">
        <h3 className="text-gray-900 font-semibold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Safety Summary
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Self-Harm Mentions</div>
            <div className="text-3xl font-bold text-red-600">{stats.selfHarmMentions}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Suicidal Ideation</div>
            <div className="text-3xl font-bold text-orange-600">{stats.suicidalIdeation}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">To Consultant</div>
            <div className="text-3xl font-bold text-purple-600">{getNumber(escalationsData, 'to_human_consultant')}</div>
          </div>
        </div>
      </Card>

      {/* Data Status */}
      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <p className="text-sm">Loading safety analytics...</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="text-sm">Error loading data: {error}</p>
        </div>
      )}
    </div>
  );
}
