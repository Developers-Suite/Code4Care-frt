import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Menu } from 'lucide-react';
import { Button } from './ui/button';
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
import { useLiveWaitingRequests } from '@/hooks/useLiveWaitingRequests';
import { logger } from '@/utils/logger';
import { UserAvatarProfile } from './admin/UserAvatarProfile';

interface AdminPanelProps {
  selectedLanguage: string;
  onLogout: () => void;
  session: StaffSession;
}

export function AdminPanel({ selectedLanguage, onLogout, session }: AdminPanelProps) {
  const [currentSection, setCurrentSection] = useState<AdminSection>('overview');
  const [waitingRequests, setWaitingRequests] = useState<SupportRequestListItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const { permission, requestPermission } = useQueueNotifications({
    waitingRequests,
    onSelectRequest: () => setCurrentSection('conversations'),
  });

  // Align the header badge and bell with the conversation log. New-request alerts keep using the
  // unfiltered queue above so they still fire.
  const liveWaitingRequests = useLiveWaitingRequests(waitingRequests, session.accessToken);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

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
    <div className="flex h-[100dvh] lg:h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar: docked from lg up */}
      <aside className="hidden lg:block w-[260px] flex-shrink-0 border-r border-[#E8ECFF] bg-white overflow-y-auto">
        <AdminSidebar
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          onLogout={onLogout}
          isMobile={false}
          role={session.role}
        />
      </aside>

      {/* Sidebar: drawer on tablet and mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-gray-900/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
              className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white border-r border-[#E8ECFF] shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            >
              <AdminSidebar
                currentSection={currentSection}
                setCurrentSection={setCurrentSection}
                onLogout={onLogout}
                isMobile
                onClose={() => setIsSidebarOpen(false)}
                role={session.role}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top Notification & Status Bar */}
        <header className="h-14 border-b border-[#E8ECFF] bg-white px-3 sm:px-6 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden -ml-1 flex-shrink-0 text-gray-600 hover:text-gray-900"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
              title="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="text-sm font-semibold text-gray-800 capitalize truncate">
              {currentSection.replace('-', ' ')}
            </span>
            {liveWaitingRequests.length > 0 && (
              <button
                type="button"
                onClick={() => setCurrentSection('conversations')}
                className="cursor-pointer inline-flex flex-shrink-0 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors animate-pulse whitespace-nowrap"
                title={`${liveWaitingRequests.length} waiting in queue - click to view`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                {liveWaitingRequests.length}
                <span className="hidden sm:inline">waiting in queue</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationPopover
              notifications={liveWaitingRequests}
              onSelectNotification={() => setCurrentSection('conversations')}
              onRequestPermission={requestPermission}
              permissionGranted={permission === 'granted'}
            />

            <div className="h-5 w-px bg-gray-200 mx-1" />

            <UserAvatarProfile
              session={session}
              onLogout={onLogout}
              onNavigate={setCurrentSection}
            />
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
