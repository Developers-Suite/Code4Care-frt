import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, ShieldAlert, Search } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationPopover } from './NotificationPopover';
import { AdminSidebar, AdminSection } from './AdminSidebar';
import { OverviewPage } from './admin/OverviewPage';
import { UsersSessionsPage } from './admin/UsersSessionsPage';
import { ConversationsPage } from './admin/ConversationsPage';
import { SafetyCrisisPage } from './admin/SafetyCrisisPage';
import { AdminAuditPage } from './admin/AdminAuditPage';
import { AdminManagementPage } from './admin/AdminManagementPage';
import { SupportCounselorDashboard } from './ConsultantDashboard';
import { CommandPalette } from './admin/CommandPalette';
import { canAccessSection, getDefaultSectionForRole } from '@/utils/rbac';
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

  export function AdminPanel({ selectedLanguage: _selectedLanguage, onLogout, session }: AdminPanelProps) {
    const defaultSection: AdminSection = getDefaultSectionForRole(session.role);
    const [currentSection, setCurrentSection] = useState<AdminSection>(defaultSection);
    const [waitingRequests, setWaitingRequests] = useState<SupportRequestListItem[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const [conversationTarget, setConversationTarget] = useState<{ sessionId?: string; convId?: string } | null>(null);

    const handleOpenConversation = (target: { sessionId?: string; convId?: string }) => {
      setConversationTarget(target);
      setCurrentSection('conversations');
    };

    const { permission, requestPermission } = useQueueNotifications({
      waitingRequests,
      onSelectRequest: (requestId) => {
        const match = waitingRequests.find((r) => r.id === requestId);
        handleOpenConversation({ sessionId: match?.session_id, convId: requestId });
      },
    });

    // Align the header badge and bell with the conversation log. New-request alerts keep using the
    // unfiltered queue above so they still fire.
    const liveWaitingRequests = useLiveWaitingRequests(waitingRequests, session.accessToken);

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsSidebarOpen(false);
          setIsCommandPaletteOpen(false);
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          setIsCommandPaletteOpen((prev) => !prev);
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const renderContent = () => {
      if (!canAccessSection(session.role, currentSection)) {
        return (
          <div className="p-8 max-w-md mx-auto my-16 text-center bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your account role (<strong className="capitalize">{session.role}</strong>) does not have permission to view this section.
              </p>
            </div>
            <Button
              onClick={() => setCurrentSection(defaultSection)}
              className="bg-[#BE322D] hover:bg-[#9F2622] text-white"
            >
              Return to Authorized Dashboard
            </Button>
          </div>
        );
      }

      switch (currentSection) {
        case 'overview': return <OverviewPage session={session} />;
        case 'counselor-queue': return <SupportCounselorDashboard session={session} onLogout={onLogout} embedded onOpenConversation={handleOpenConversation} />;
        case 'users': return <UsersSessionsPage session={session} />;
        case 'conversations': return <ConversationsPage session={session} targetConversationTarget={conversationTarget} onClearTarget={() => setConversationTarget(null)} />;
        case 'safety': return <SafetyCrisisPage session={session} />;
        case 'audit': return <AdminAuditPage session={session} />;
        case 'admin-accounts': return <AdminManagementPage session={session} />;
        default: return session.role === 'consultant'
            ? <SupportCounselorDashboard session={session} onLogout={onLogout} embedded onOpenConversation={handleOpenConversation} />
            : <OverviewPage session={session} />;
      }
    };

    return (
      <div className="flex h-[100dvh] lg:h-screen bg-gray-50 overflow-hidden">
        {/* Docked Sidebar (Desktop & Tablet >= 768px) */}
        {!isMobile && (
          <aside className="w-[260px] flex flex-col h-full flex-shrink-0 border-r border-[#E8ECFF] bg-white">
            <AdminSidebar
              currentSection={currentSection}
              setCurrentSection={setCurrentSection}
              onLogout={onLogout}
              isMobile={false}
              role={session.role}
              waitingCount={liveWaitingRequests.length}
            />
          </aside>
        )}

        {/* Slide-over Drawer (Mobile < 768px) */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <div className="fixed inset-0 z-50">
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
                className="absolute inset-y-0 left-0 flex h-full w-[280px] max-w-[85vw] flex-col bg-white border-r border-[#E8ECFF] shadow-2xl"
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
                  waitingCount={liveWaitingRequests.length}
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
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 flex-shrink-0 gap-1.5 px-2.5 text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:text-gray-900 shadow-xs cursor-pointer"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open navigation"
                  title="Open navigation"
                >
                  <Menu className="w-4 h-4 text-gray-700" />
                  <span className="text-xs font-semibold">Menu</span>
                </Button>
              )}
              <span className="text-sm font-semibold text-gray-800 capitalize truncate">
                {currentSection.replace('-', ' ')}
              </span>
              {liveWaitingRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentSection(session.role === 'consultant' ? 'counselor-queue' : 'conversations')}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 h-9 px-3 text-xs text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                title="Search sections and actions (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <span>Search...</span>
                <kbd className="text-[10px] font-semibold bg-white border border-gray-200 px-1 py-0.5 rounded text-gray-400">
                  ⌘K
                </kbd>
              </Button>

              <NotificationPopover
                notifications={liveWaitingRequests}
                onSelectNotification={(requestId) => {
                  const match = liveWaitingRequests.find((r) => r.id === requestId);
                  handleOpenConversation({ sessionId: match?.session_id, convId: requestId });
                }}
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

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={setCurrentSection}
          onLogout={onLogout}
          role={session.role}
        />
      </div>
    );
  }
