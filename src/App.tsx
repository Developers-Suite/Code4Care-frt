import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Sheet, SheetContent } from "./components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./components/ui/alert-dialog";
import { motion, AnimatePresence } from "motion/react";

import { useApp } from "@/providers/AppProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatInterface } from "./components/ChatInterface";
import { StoryMode } from "./components/StoryMode";
import { MythBusters } from "./components/MythBusters";
import { SupportAndClinics } from "./components/SupportAndClinics";
import { Pharmacy } from "./components/Pharmacy";
import { SettingsPage } from "./components/SettingsPage";
import { PanicScreen } from "./components/PanicScreen";
import { NicknameModal } from "./components/NicknameModal";
import OnboardingScreen from "./components/OnboardingScreen";
import OnboardingCarousel from "./components/introscreen/app.tsx";
import { DesktopHeroIntro } from "./components/DesktopHeroIntro";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UserEngagementService } from "@/services/userEngagementService";
import { RealAnalyticsService } from "@/services/realAnalyticsService";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PWAInstallModal } from "@/components/PWAInstallModal";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { safeStorage } from "@/utils/safeStorage";

type Section = "chat" | "story" | "myths" | "support" | "pharmacy" | "settings";

function AppContent() {
  const { t, i18n } = useTranslation();
  const { 
    hasSeenOnboarding, setHasSeenOnboarding,
    nickname, setNickname,
    ageRange,
    genderIdentity,
    region,
    sessionDuration,
    analyticsOptIn,
    setBotName,
    setAgeRange,
    setGenderIdentity,
    setRegion,
    sessionId, setSessionId,
    resetAll,
    consultantMode,
  } = useApp();

  // PWA hooks
  const { isInstallable, handleInstall, handleDismiss, resetDismissal } = useInstallPrompt();
  const { showOfflineBanner, wasOffline } = useOfflineStatus();

  const [currentSection, setCurrentSection] = useState<Section>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPanicScreen, setShowPanicScreen] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(!nickname);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [clearChatTrigger, setClearChatTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDesktopHero, setShowDesktopHero] = useState(true);
  const sessionStartedAtRef = useRef(Date.now());
  const sessionEndedRef = useRef(false);
  const sessionAnalyticsRecordedRef = useRef(false);

  // Listen for mobile/desktop viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!hasSeenOnboarding) {
      return;
    }

    const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

    UserEngagementService.logNonBlocking(
      UserEngagementService.captureDemographics({
        session_id: sessionId,
        bot_name: 'Lydia Contact Center',
        age_range: ageRange,
        gender_identity: genderIdentity,
        region,
        language: languageCode,
      }),
      'Failed to sync demographics for current session',
    );

    UserEngagementService.logNonBlocking(
      UserEngagementService.syncUserSettings({
        sessionId,
        nickname: nickname || '',
        language: languageCode,
        chatRetention: sessionDuration,
        analyticsConsent: analyticsOptIn,
        consultantModeEnabled: consultantMode,
      }),
      'Failed to sync user settings for current session',
    );
  }, [
    hasSeenOnboarding,
    sessionId,
    ageRange,
    genderIdentity,
    region,
    nickname,
    sessionDuration,
    analyticsOptIn,
    consultantMode,
    i18n.language,
    i18n.resolvedLanguage,
  ]);

  // Sync nickname modal visibility with global state
  useEffect(() => {
    setShowNicknameModal(!nickname && hasSeenOnboarding);
  }, [nickname, hasSeenOnboarding]);

  useEffect(() => {
    if (!hasSeenOnboarding) {
      return;
    }

    sessionStartedAtRef.current = Date.now();
    try {
      safeStorage.setItem('lydiacontactcenter_session_started_at', String(sessionStartedAtRef.current));
    } catch {}
    sessionEndedRef.current = false;
    sessionAnalyticsRecordedRef.current = false;
    UserEngagementService.logNonBlocking(
      UserEngagementService.trackSession(
        UserEngagementService.buildSessionPayload(sessionId, 'continue', true),
      ),
      'Failed to track session continue event',
    );

    return () => {
      if (sessionEndedRef.current) {
        return;
      }

      sessionEndedRef.current = true;
      recordSessionAnalytics();
      const durationSeconds = Math.max(0, Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
      UserEngagementService.logNonBlocking(
        UserEngagementService.trackSession(
          UserEngagementService.buildSessionPayload(sessionId, 'end', true, durationSeconds),
        ),
        'Failed to track session end event',
      );
    };
  }, [hasSeenOnboarding, sessionId]);

  const recordSessionAnalytics = () => {
    if (sessionAnalyticsRecordedRef.current || !hasSeenOnboarding || !analyticsOptIn) {
      return;
    }

    sessionAnalyticsRecordedRef.current = true;

    const durationSeconds = Math.max(0, Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
    const chatStorageKey = `lydiacontactcenter_chat_${sessionId}`;
    const storedMessagesRaw = safeStorage.getItem(chatStorageKey, '[]');

    let messagesExchanged = 0;
    try {
      const storedMessages = storedMessagesRaw ? JSON.parse(storedMessagesRaw) : [];
      messagesExchanged = Array.isArray(storedMessages) ? storedMessages.length : 0;
    } catch {
      messagesExchanged = 0;
    }

    const panicTriggered = safeStorage.getItem('lydiacontactcenter_panic_triggered') === 'true';

    void RealAnalyticsService.recordSessionAnalytics({
      session_id: sessionId,
      user_id: nickname || undefined,
      age_range: ageRange,
      gender_identity: genderIdentity,
      region,
      language: (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0],
      start_time: new Date(sessionStartedAtRef.current).toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: durationSeconds,
      messages_exchanged: messagesExchanged,
      topics_discussed: [],
      panic_button_used: panicTriggered,
      crisis_support_accessed: false,
      story_modules_started: 0,
      story_modules_completed: 0,
      pharmacy_searches: 0,
      satisfaction_rating: undefined,
      would_return: true,
      safety_flags: panicTriggered ? ['panic-button'] : [],
    });
  };

  const handleClearChat = async () => {
    const base = import.meta.env.VITE_API_BASE_URL?.trim();
    if (base) {
      try {
        await fetch(new URL('/v1/session/clear', base).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch {}
    }
    localStorage.removeItem(`lydiacontactcenter_chat_${sessionId}`);
    setClearChatTrigger(prev => prev + 1);
    setShowClearDialog(false);
    toast.success(t('chat.clearChatMsg', 'Chat history cleared'));
  };

  const handlePanicClick = () => {
    safeStorage.setItem('lydiacontactcenter_panic_triggered', 'true');
    setShowPanicScreen(true);
    // Post an immediate analytics snapshot so panic events are recorded instantly
    try {
      const panicTriggered = true;
      const chatStorageKey = `lydiacontactcenter_chat_${sessionId}`;
      const storedMessagesRaw = safeStorage.getItem(chatStorageKey, '[]');
      let messagesExchanged = 0;
      try {
        const storedMessages = storedMessagesRaw ? JSON.parse(storedMessagesRaw) : [];
        messagesExchanged = Array.isArray(storedMessages) ? storedMessages.length : 0;
      } catch {}

      const startTs = Number(safeStorage.getItem('lydiacontactcenter_session_started_at')) || Date.now();
      const durationSeconds = Math.max(0, Math.round((Date.now() - startTs) / 1000));

      void RealAnalyticsService.recordSessionAnalytics({
        session_id: sessionId,
        user_id: nickname || undefined,
        age_range: ageRange,
        gender_identity: genderIdentity,
        region,
        language: (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0],
        start_time: new Date(startTs).toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: durationSeconds,
        messages_exchanged: messagesExchanged,
        topics_discussed: [],
        panic_button_used: panicTriggered,
        crisis_support_accessed: false,
        story_modules_started: 0,
        story_modules_completed: 0,
        pharmacy_searches: 0,
        satisfaction_rating: undefined,
        would_return: true,
        safety_flags: panicTriggered ? ['panic-button'] : [],
      });
    } catch (e) {
      // swallow analytics errors
    }
  };

  const handleLogout = async () => {
    sessionEndedRef.current = true;
    recordSessionAnalytics();
    const durationSeconds = Math.max(0, Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
    UserEngagementService.logNonBlocking(
      UserEngagementService.trackSession(
        UserEngagementService.buildSessionPayload(sessionId, 'end', hasSeenOnboarding, durationSeconds),
      ),
      'Failed to track session logout event',
    );
    const base = import.meta.env.VITE_API_BASE_URL?.trim();
    if (base) {
      try {
        await fetch(new URL('/v1/session/clear', base).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch {}
    }
    resetAll();
    setShowLogoutDialog(false);
    setCurrentSection("chat");
    toast.success(t('chat.logoutSuccess', 'Logged out successfully'));
  };

  const [showIntro, setShowIntro] = useState(true);

  const handleNicknameSubmit = (name: string) => {
    const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

    setNickname(name);
    setShowNicknameModal(false);

    UserEngagementService.logNonBlocking(
      UserEngagementService.syncUserSettings({
        sessionId,
        nickname: name,
        language: languageCode,
        chatRetention: sessionDuration,
        analyticsConsent: analyticsOptIn,
        consultantModeEnabled: consultantMode,
      }),
      'Failed to persist nickname from nickname modal',
    );
  };

  if (!hasSeenOnboarding) {
    // Desktop: Show hero intro first
    if (showDesktopHero && !isMobile) {
      return (
        <DesktopHeroIntro
          onComplete={() => {
            setShowDesktopHero(false);
          }}
        />
      );
    }

    // Mobile: Show carousel first
    if (showIntro && isMobile) {
      return (
        <OnboardingCarousel
          onComplete={() => {
            // Carousel complete, move to demographics onboarding
            setShowIntro(false);
          }}
          onSkip={() => {
            // Skip carousel and go directly to demographics
            setShowIntro(false);
          }}
        />
      );
    }

    return (
      <OnboardingScreen
        onComplete={({ botName: nextBotName, ageRange: nextAgeRange, genderIdentity: nextGenderIdentity, region: nextRegion }) => {
          const languageCode = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
          setBotName(nextBotName);
          setAgeRange(nextAgeRange);
          setGenderIdentity(nextGenderIdentity);
          setRegion(nextRegion);
          // mark onboarding complete and record session start
          setHasSeenOnboarding(true);
          try {
            sessionStartedAtRef.current = Date.now();
            safeStorage.setItem('lydiacontactcenter_session_started_at', String(sessionStartedAtRef.current));
          } catch {}

          UserEngagementService.logNonBlocking(
            UserEngagementService.captureDemographics({
              session_id: sessionId,
              bot_name: nextBotName,
              age_range: nextAgeRange,
              gender_identity: nextGenderIdentity,
              region: nextRegion,
              language: languageCode,
            }),
            'Failed to capture onboarding demographics',
          );
          UserEngagementService.logNonBlocking(
            UserEngagementService.syncUserSettings({
              sessionId,
              nickname: nickname || '',
              language: languageCode,
              chatRetention: '24h',
              analyticsConsent: true,
              consultantModeEnabled: consultantMode,
            }),
            'Failed to initialize user settings',
          );

          // Post an immediate session analytics snapshot for onboarding completion
          try {
            if (analyticsOptIn) {
              const chatStorageKey = `lydiacontactcenter_chat_${sessionId}`;
              const storedMessagesRaw = safeStorage.getItem(chatStorageKey, '[]');
              let messagesExchanged = 0;
              try {
                const storedMessages = storedMessagesRaw ? JSON.parse(storedMessagesRaw) : [];
                messagesExchanged = Array.isArray(storedMessages) ? storedMessages.length : 0;
              } catch {}

              const startTs = Number(safeStorage.getItem('lydiacontactcenter_session_started_at')) || sessionStartedAtRef.current || Date.now();

              void RealAnalyticsService.recordSessionAnalytics({
                session_id: sessionId,
                user_id: nickname || undefined,
                age_range: nextAgeRange,
                gender_identity: nextGenderIdentity,
                region: nextRegion,
                language: languageCode,
                start_time: new Date(startTs).toISOString(),
                end_time: new Date().toISOString(),
                duration_seconds: 0,
                messages_exchanged: messagesExchanged,
                topics_discussed: [],
                panic_button_used: safeStorage.getItem('lydiacontactcenter_panic_triggered') === 'true',
                crisis_support_accessed: false,
                story_modules_started: 0,
                story_modules_completed: 0,
                pharmacy_searches: 0,
                satisfaction_rating: undefined,
                would_return: true,
                safety_flags: safeStorage.getItem('lydiacontactcenter_panic_triggered') === 'true' ? ['panic-button'] : [],
              });
            }
          } catch (err) {
            // ignore analytics errors
          }
        }}
      />
    );
  }

  if (showPanicScreen) {
    return <PanicScreen onExit={() => setShowPanicScreen(false)} sessionId={sessionId} />;
  }

  return (
    <div className="flex h-dvh min-h-dvh w-full max-w-full overflow-hidden bg-white">
      <Toaster position="top-center" toastOptions={{ className: 'rounded-2xl' }} />
      
      {/* PWA Components */}
      <OfflineBanner isOffline={showOfflineBanner} wasOffline={wasOffline} />
      <PWAInstallModal
        isVisible={isInstallable} 
        onInstall={handleInstall} 
        onDismiss={handleDismiss}
      />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0">
        <Sidebar 
          currentSection={currentSection} 
          setCurrentSection={setCurrentSection}
          onClearChat={() => setShowClearDialog(true)}
          onLogout={() => setShowLogoutDialog(true)}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[86vw] max-w-[300px] sm:w-[300px]">
          <Sidebar 
            currentSection={currentSection} 
            setCurrentSection={setCurrentSection}
            onClose={() => setSidebarOpen(false)}
            onClearChat={() => setShowClearDialog(true)}
            onLogout={() => setShowLogoutDialog(true)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex min-w-0 flex-col flex-1 h-dvh min-h-dvh overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onPanicClick={handlePanicClick}
        />

        <main className="relative flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentSection === "chat" && (
                <ChatInterface 
                  clearTrigger={clearChatTrigger}
                />
              )}
              {currentSection === "story" && <StoryMode />}
              {currentSection === "myths" && <MythBusters />}
              {currentSection === "support" && <SupportAndClinics />}
              {currentSection === "pharmacy" && <Pharmacy />}
              {currentSection === "settings" && (
                <SettingsPage
                  onClearChat={() => setShowClearDialog(true)}
                  onLogout={() => setShowLogoutDialog(true)}
                  onResetPWADismissal={resetDismissal}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals & Dialogs */}
      <NicknameModal 
        isOpen={showNicknameModal} 
        onClose={() => setShowNicknameModal(false)}
        onSubmit={handleNicknameSubmit}
      />

      {/* Clear Chat Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chat.clearChat')}</AlertDialogTitle>
            <AlertDialogDescription>{t('chat.clearChatDesc', 'Are you sure? This will delete all messages in this session.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} className="rounded-xl bg-red-600 focus:ring-red-600">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chat.logoutTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('chat.logoutDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-xl bg-red-600">
              {t('chat.logoutConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}