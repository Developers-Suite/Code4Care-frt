/**
 * Admin Report Scheduler Component
 * UI for scheduling automated report generation
 * (Frontend only - backend integration ready)
 */

import { useState } from 'react';
import { Calendar, Clock, Mail, Download, FileText, Settings } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ReportOrchestrationService, ReportTemplate, ExportFormat, ReportPeriod } from '@/services/reportOrchestrationService';

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRunDate: string;
  lastRunDate?: string;
  format: ExportFormat;
  recipients: string[];
  enabled: boolean;
}

interface AdminReportSchedulerProps {
  accessToken?: string;
}

export function AdminReportScheduler({ accessToken }: AdminReportSchedulerProps) {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: 'sched-1',
      templateId: 'executive-summary',
      name: 'Monthly Executive Summary',
      frequency: 'monthly',
      nextRunDate: '2025-02-01T09:00:00Z',
      format: 'pdf',
      recipients: ['admin@lydiacallcenter.org'],
      enabled: true,
    },
    {
      id: 'sched-2',
      templateId: 'safety-compliance',
      name: 'Weekly Safety Report',
      frequency: 'weekly',
      nextRunDate: '2025-01-13T09:00:00Z',
      lastRunDate: '2025-01-06T09:00:00Z',
      format: 'excel',
      recipients: ['safety@lydiacallcenter.org'],
      enabled: true,
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

  const templates = ReportOrchestrationService.getReportTemplates();

  const handleToggleReport = (reportId: string) => {
    setScheduledReports((prev) =>
      prev.map((report) =>
        report.id === reportId ? { ...report, enabled: !report.enabled } : report
      )
    );
  };

  const handleRunNow = async (report: ScheduledReport) => {
    try {
      const template = templates.find((t) => t.id === report.templateId);
      if (!template) return;

      await ReportOrchestrationService.generateAndExport(
        {
          type: template.type,
          period: template.defaultPeriod,
          format: report.format,
        },
        accessToken
      );

      // Update last run date
      setScheduledReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, lastRunDate: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      console.error('Failed to run report', error);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Reports</h1>
          <p className="text-gray-500">
            Automate report generation and delivery on a recurring schedule
          </p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A]"
          onClick={() => setShowCreateModal(true)}
        >
          <Calendar className="w-4 h-4" />
          Schedule New Report
        </Button>
      </div>

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {scheduledReports.map((report) => {
          const template = templates.find((t) => t.id === report.templateId);
          return (
            <Card key={report.id} className="p-5 border-[#E8ECFF]">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                    <Badge className={report.enabled ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                      {report.enabled ? 'Active' : 'Paused'}
                    </Badge>
                    <Badge className="bg-[#FFF1F1] text-[#BE322D] border-[#F4D6D5]">
                      {report.frequency}
                    </Badge>
                    <Badge className="bg-purple-50 text-purple-600 border-purple-200">
                      {report.format.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template?.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Next run: {new Date(report.nextRunDate).toLocaleDateString()}
                    </div>
                    {report.lastRunDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Last run: {new Date(report.lastRunDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {report.recipients.length} recipient(s)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleRunNow(report)}
                  >
                    <Download className="w-4 h-4" />
                    Run Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleReport(report.id)}
                  >
                    {report.enabled ? 'Pause' : 'Resume'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Available Templates */}
      <Card className="p-6 border-[#E8ECFF]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="rounded-xl border border-[#E8ECFF] bg-white hover:border-blue-200 hover:shadow-sm p-4 text-left transition-all"
            >
              <FileText className="w-5 h-5 text-[#BE322D] mb-3" />
              <p className="font-semibold text-gray-900 mb-1">{template.name}</p>
              <p className="text-sm text-gray-500 mb-3">{template.description}</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#FFF1F1] text-[#BE322D] border-[#F4D6D5] text-xs">
                  {template.defaultPeriod}
                </Badge>
                <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs">
                  {template.defaultFormat}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedTemplate.name}</h3>
            <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>

            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm font-medium text-gray-700">Report Type:</span>
                <span className="ml-2 text-gray-900">{selectedTemplate.type}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Default Period:</span>
                <span className="ml-2 text-gray-900">{selectedTemplate.defaultPeriod}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Default Format:</span>
                <span className="ml-2 text-gray-900">{selectedTemplate.defaultFormat.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Included Metrics:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplate.includedMetrics.map((metric) => (
                    <Badge key={metric} className="bg-[#FFF1F1] text-[#BE322D] border-[#F4D6D5]">
                      {metric.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A]"
                onClick={async () => {
                  await handleRunNow({
                    id: 'temp',
                    templateId: selectedTemplate.id,
                    name: selectedTemplate.name,
                    frequency: 'monthly',
                    nextRunDate: '',
                    format: selectedTemplate.defaultFormat,
                    recipients: [],
                    enabled: true,
                  });
                  setSelectedTemplate(null);
                }}
              >
                Generate Now
              </Button>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
