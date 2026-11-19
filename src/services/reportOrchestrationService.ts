/**
 * Report Orchestration Service
 * Centralized service for generating, managing, and exporting admin reports
 * Integrates with all analytics services and export utilities
 */

import { RealAnalyticsService } from './realAnalyticsService';
import { UserManagementService } from './userManagementService';
import { SupportRequestService } from './supportRequestService';
import { SafetyService } from './safetyService';
import { HealthService } from './healthService';
import { generateReportFromAnalytics } from '@/utils/pdfReportGenerator';
import { generateAnalyticsExcelReport, exportTableToExcel } from '@/utils/excelExporter';
import { logger } from '@/utils/logger';

export type ReportType = 'overview' | 'activity' | 'demographics' | 'safety' | 'performance' | 'full' | 'users' | 'support' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ReportConfig {
  type: ReportType;
  period: ReportPeriod;
  customDateRange?: {
    startDate: string;
    endDate: string;
  };
  format: ExportFormat;
  filters?: {
    age_range?: string;
    gender?: string;
    region?: string;
    status?: string;
  };
}

export interface GeneratedReport {
  id: string;
  type: ReportType;
  format: ExportFormat;
  generatedAt: string;
  dataSnapshot: any;
  filename: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  defaultPeriod: ReportPeriod;
  defaultFormat: ExportFormat;
  includedMetrics: string[];
}

// Predefined report templates
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for leadership with key metrics and trends',
    type: 'overview',
    defaultPeriod: 'month',
    defaultFormat: 'pdf',
    includedMetrics: ['total_users', 'engagements', 'safety_incidents', 'system_uptime'],
  },
  {
    id: 'safety-compliance',
    name: 'Safety & Compliance Report',
    description: 'Detailed safety incidents, crisis interventions, and compliance metrics',
    type: 'safety',
    defaultPeriod: 'month',
    defaultFormat: 'excel',
    includedMetrics: ['panic_exits', 'crisis_interventions', 'escalations', 'follow_ups'],
  },
  {
    id: 'user-engagement',
    name: 'User Engagement Analysis',
    description: 'User behavior, retention, demographics, and engagement patterns',
    type: 'users',
    defaultPeriod: 'month',
    defaultFormat: 'excel',
    includedMetrics: ['active_users', 'retention_rate', 'demographics', 'session_duration'],
  },
  {
    id: 'performance-monitoring',
    name: 'System Performance Report',
    description: 'Technical performance metrics, uptime, response times, and errors',
    type: 'performance',
    defaultPeriod: 'week',
    defaultFormat: 'pdf',
    includedMetrics: ['response_time', 'uptime', 'error_rate', 'throughput'],
  },
  {
    id: 'support-summary',
    name: 'Support Requests Summary',
    description: 'Support ticket analysis, resolution times, and consultant performance',
    type: 'support',
    defaultPeriod: 'month',
    defaultFormat: 'excel',
    includedMetrics: ['total_requests', 'resolution_time', 'satisfaction', 'backlog'],
  },
  {
    id: 'monthly-full',
    name: 'Monthly Comprehensive Report',
    description: 'Complete monthly report with all metrics across all categories',
    type: 'full',
    defaultPeriod: 'month',
    defaultFormat: 'excel',
    includedMetrics: ['all'],
  },
];

export class ReportOrchestrationService {
  private static reportHistory: GeneratedReport[] = [];

  /**
   * Get all available report templates
   */
  static getReportTemplates(): ReportTemplate[] {
    return REPORT_TEMPLATES;
  }

  /**
   * Get report template by ID
   */
  static getReportTemplate(templateId: string): ReportTemplate | undefined {
    return REPORT_TEMPLATES.find((t) => t.id === templateId);
  }

  /**
   * Generate comprehensive analytics report
   */
  static async generateAnalyticsReport(
    config: ReportConfig,
    accessToken?: string
  ): Promise<any> {
    try {
      logger.info('Generating analytics report', config);

      // Fetch analytics data based on period
      const analyticsData = await RealAnalyticsService.getDashboardSummary(
        {
          period: config.period === 'custom' ? 'month' : config.period,
          by_region: true,
          by_age_group: true,
          by_language: true,
        },
        accessToken
      );

      // Fetch additional data based on report type
      let additionalData: any = {};

      if (config.type === 'users' || config.type === 'full') {
        try {
          const userAnalytics = await RealAnalyticsService.getUserAnalytics(
            { period: config.period === 'custom' ? 'month' : config.period },
            accessToken
          );
          additionalData.userAnalytics = userAnalytics;
        } catch (error) {
          logger.error('Failed to fetch user analytics', error);
        }
      }

      if (config.type === 'safety' || config.type === 'full') {
        try {
          const safetyAnalytics = await RealAnalyticsService.getSafetyAnalytics(
            { period: config.period === 'custom' ? 'month' : config.period },
            accessToken
          );
          additionalData.safetyAnalytics = safetyAnalytics;
        } catch (error) {
          logger.error('Failed to fetch safety analytics', error);
        }
      }

      if (config.type === 'performance' || config.type === 'full') {
        try {
          const performanceMetrics = await RealAnalyticsService.getPerformanceMetrics(
            { period: config.period === 'custom' ? 'month' : config.period },
            accessToken
          );
          additionalData.performanceMetrics = performanceMetrics;
        } catch (error) {
          logger.error('Failed to fetch performance metrics', error);
        }
      }

      return {
        ...analyticsData,
        ...additionalData,
      };
    } catch (error) {
      logger.error('Failed to generate analytics report', error);
      throw error;
    }
  }

  /**
   * Generate user management report
   */
  static async generateUserReport(
    config: ReportConfig,
    accessToken?: string
  ): Promise<any> {
    try {
      logger.info('Generating user report', config);

      const users = await UserManagementService.listUsers(
        {
          page: 1,
          limit: 1000,
          status: config.filters?.status as any,
          age_range: config.filters?.age_range as any,
          gender: config.filters?.gender as any,
          region: config.filters?.region,
        },
        accessToken
      );

      return users;
    } catch (error) {
      logger.error('Failed to generate user report', error);
      throw error;
    }
  }

  /**
   * Generate support requests report
   */
  static async generateSupportReport(
    config: ReportConfig,
    accessToken?: string
  ): Promise<any> {
    try {
      logger.info('Generating support report', config);

      const supportRequests = await SupportRequestService.listSupportRequests(
        {
          page: 1,
          limit: 1000,
        },
        accessToken
      );

      return supportRequests;
    } catch (error) {
      logger.error('Failed to generate support report', error);
      throw error;
    }
  }

  /**
   * Generate and export report in specified format
   */
  static async generateAndExport(
    config: ReportConfig,
    accessToken?: string
  ): Promise<GeneratedReport> {
    const reportId = `report-${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

    // Fetch data based on report type
    let data: any;

    switch (config.type) {
      case 'users':
        data = await this.generateUserReport(config, accessToken);
        break;
      case 'support':
        data = await this.generateSupportReport(config, accessToken);
        break;
      default:
        data = await this.generateAnalyticsReport(config, accessToken);
    }

    // Generate filename
    const filename = `code4care-${config.type}-report-${timestamp}.${config.format === 'excel' ? 'xlsx' : config.format}`;

    // Export based on format
    switch (config.format) {
      case 'pdf':
        this.exportAsPDF(data, config.type, filename);
        break;
      case 'excel':
        this.exportAsExcel(data, config.type, filename);
        break;
      case 'csv':
        this.exportAsCSV(data, config.type, filename);
        break;
      case 'json':
        this.exportAsJSON(data, filename);
        break;
    }

    // Create report record
    const report: GeneratedReport = {
      id: reportId,
      type: config.type,
      format: config.format,
      generatedAt: new Date().toISOString(),
      dataSnapshot: data,
      filename,
    };

    // Add to history
    this.reportHistory.unshift(report);

    // Keep only last 50 reports in history
    if (this.reportHistory.length > 50) {
      this.reportHistory = this.reportHistory.slice(0, 50);
    }

    return report;
  }

  /**
   * Export report as PDF
   */
  private static exportAsPDF(data: any, reportType: string, filename: string): void {
    const reportRange = {
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
      label: 'Current Period',
    };

    generateReportFromAnalytics(data, reportType, reportRange, filename);
  }

  /**
   * Export report as Excel
   */
  private static exportAsExcel(data: any, reportType: string, filename: string): void {
    const reportRange = {
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
      label: 'Current Period',
    };

    generateAnalyticsExcelReport(data, reportType, reportRange, filename);
  }

  /**
   * Export report as CSV
   */
  private static exportAsCSV(data: any, reportType: string, filename: string): void {
    // Convert data to CSV format
    let rows: Array<Record<string, string | number>> = [];

    if (reportType === 'users') {
      rows = data.users?.map((user: any) => ({
        ID: user.id,
        Nickname: user.nickname,
        'Age Range': user.age_range,
        Gender: user.gender_identity,
        Region: user.region,
        Language: user.language,
        Status: user.status,
        'Total Sessions': user.total_sessions,
        'Total Messages': user.total_messages,
        'Engagement Score': user.engagement_score,
        'Last Active': user.last_active,
      })) || [];
    } else if (reportType === 'support') {
      rows = data.requests?.map((req: any) => ({
        ID: req.id,
        'User Nickname': req.user_nickname,
        'Age Range': req.age_range,
        Status: req.status,
        Urgency: req.urgency,
        Reason: req.reason,
        'Created At': req.created_at,
        'Assigned Staff': req.assigned_staff?.name || 'Unassigned',
      })) || [];
    } else {
      // Analytics data
      rows = data.trends?.map((trend: any) => ({
        Date: trend.date,
        Engagements: trend.engagements,
        'Unique Users': trend.uniqueUsers,
        'Total Messages': trend.totalMessages,
        Satisfaction: trend.satisfactionAverage?.toFixed(2) || '0.00',
      })) || [];
    }

    // Create CSV content
    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((header) => {
          const value = String(row[header] || '');
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      ),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Export report as JSON
   */
  private static exportAsJSON(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Get report generation history
   */
  static getReportHistory(): GeneratedReport[] {
    return this.reportHistory;
  }

  /**
   * Clear report history
   */
  static clearReportHistory(): void {
    this.reportHistory = [];
  }

  /**
   * Get system health status for reports
   */
  static async getSystemHealthStatus(): Promise<any> {
    try {
      const [health, ready, version] = await Promise.all([
        HealthService.checkHealth(),
        HealthService.checkReady(),
        HealthService.getVersion(),
      ]);

      return {
        health,
        ready,
        version,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get system health status', error);
      return null;
    }
  }

  /**
   * Generate custom report with specific metrics
   */
  static async generateCustomReport(
    metrics: string[],
    period: ReportPeriod,
    format: ExportFormat,
    accessToken?: string
  ): Promise<GeneratedReport> {
    const config: ReportConfig = {
      type: 'custom',
      period,
      format,
    };

    // Fetch only requested metrics
    const data: any = {};

    if (metrics.includes('analytics')) {
      const analyticsPeriod = period === 'custom' ? 'month' : period;
      data.analytics = await RealAnalyticsService.getDashboardSummary({ period: analyticsPeriod }, accessToken);
    }

    if (metrics.includes('users')) {
      data.users = await UserManagementService.listUsers({ limit: 1000 }, accessToken);
    }

    if (metrics.includes('support')) {
      data.support = await SupportRequestService.listSupportRequests({ limit: 1000 }, accessToken);
    }

    if (metrics.includes('health')) {
      data.health = await this.getSystemHealthStatus();
    }

    return this.generateAndExport(config, accessToken);
  }
}
