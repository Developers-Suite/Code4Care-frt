import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationPopover } from './NotificationPopover';
import { AdminSidebar, AdminSection } from './AdminSidebar';
import { OverviewPage } from './admin/OverviewPage';
import { UsersSessionsPage } from './admin/UsersSessionsPage';
import { ConversationsPage } from './admin/ConversationsPage';
import { SafetyCrisisPage } from './admin/SafetyCrisisPage';
import { AdminAuditPage } from './admin/AdminAuditPage';
import { AdminManagementPage } from './admin/AdminManagementPage';
import { StaffSession } from '@/services/staffAccessService';
import { SupportRequestService, SupportRequestListItem } from '@/services/supportRequestService';
import { useQueueNotifications } from '@/hooks/useQueueNotifications';
import { logger } from '@/utils/logger';

interface AdminPanelProps {
  selectedLanguage: string;
  onLogout: () => void;
  session: StaffSession;
}

export function AdminPanel({ selectedLanguage, onLogout, session }: AdminPanelProps) {
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview');
  const [waitingRequests, setWaitingRequests] = useState<SupportRequestListItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const checkQueue = async () => {
      try {
        const response = await SupportRequestService.listSupportRequests(
          { status: 'waiting' },
          session.accessToken
        );
        if (isMounted && response?.requests) {
          setWaitingRequests(response.requests);
        }
      } catch (err) {
        logger.error('Error polling waiting support requests', err);
      }
    };

    void checkQueue();
    const interval = setInterval(() => {
      void checkQueue();
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session.accessToken]);

  const { permission, requestPermission, testAlert } = useQueueNotifications({
    waitingRequests,
    onSelectRequest: () => setCurrentSection('conversations'),
  });

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':      return <OverviewPage session={session} />;
      case 'users':         return <UsersSessionsPage session={session} />;
      case 'conversations': return <ConversationsPage session={session} />;
      case 'safety':        return <SafetyCrisisPage session={session} />;
      case 'audit':         return <AdminAuditPage session={session} />;
      case 'admin-accounts':return <AdminManagementPage session={session} />;
      default:              return <OverviewPage session={session} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 border-r border-[#E8ECFF] bg-white overflow-y-auto">
        <AdminSidebar
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          onLogout={onLogout}
          isMobile={false}
          role={session.role}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top Notification & Status Bar */}
        <header className="h-14 border-b border-[#E8ECFF] bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800 capitalize">
              {currentSection.replace('-', ' ')}
            </span>
            {waitingRequests.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentSection('conversations')}
                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors animate-pulse"
                title="Click to view waiting conversations"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                {waitingRequests.length} waiting in queue
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <NotificationPopover
              notifications={waitingRequests}
              onSelectNotification={() => setCurrentSection('conversations')}
              onRequestPermission={requestPermission}
              permissionGranted={permission === 'granted'}
            />

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-900 gap-1 h-8"
              onClick={testAlert}
              title="Test chime sound and desktop alert"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Test Alert
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
