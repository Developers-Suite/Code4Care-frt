import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { AdminPanel } from "./components/AdminPanel";
import { AdminDashboardLogin } from "./components/AdminDashboardLogin";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthService } from "./services/authService";
import { StaffAccessService, StaffSession } from "./services/staffAccessService";

function AdminDashboardAppContent() {
  const { i18n } = useTranslation();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep React session synced with background token refreshes and clean expiry logouts
  useEffect(() => {
    return AuthService.subscribeSessionEvents({
      onTokenRefreshed: (nextAccessToken) => {
        setSession((prev) => {
          if (!prev || prev.accessToken === nextAccessToken) {
            return prev;
          }
          const updated: StaffSession = { ...prev, accessToken: nextAccessToken };
          StaffAccessService.setSession(updated);
          return updated;
        });
      },
      onSessionExpired: () => {
        StaffAccessService.clearSession();
        setSession((prev) => {
          if (prev) {
            toast.error('Your session expired. Please sign in again.');
          }
          return null;
        });
      },
    });
  }, []);

  // Proactively refresh JWT access token before expiry while dashboard stays open
  useEffect(() => {
    if (!session) {
      return;
    }

    const maybeRefreshToken = () => {
      if (AuthService.isTokenExpired() && AuthService.getRefreshToken()) {
        void AuthService.refreshAccessToken().catch(() => {
          // 401/403 from refreshAccessToken emits onSessionExpired automatically
        });
      }
    };

    maybeRefreshToken();
    const interval = setInterval(maybeRefreshToken, 60_000);
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        maybeRefreshToken();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [session?.staffId]);

  // Check if admin session exists on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAdminShell = async () => {
      const existingSession = await StaffAccessService.refreshSession();

      if (isMounted) {
        setSession(existingSession);
        setIsLoading(false);
      }
    };

    void initializeAdminShell();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdminLogin = (nextSession: StaffSession) => {
    StaffAccessService.setSession(nextSession);
    setSession(nextSession);
    toast.success(`${nextSession.role === 'admin' ? 'Admin' : 'Consultant'} access granted`);
  };

  const handleAdminLogout = () => {
    const accessToken = session?.accessToken;
    setSession(null);
    void StaffAccessService.logout(accessToken);
    toast.success('Admin session ended');
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{ className: 'rounded-2xl' }} />
      {!session ? (
        <AdminDashboardLogin onAdminLogin={handleAdminLogin} />
      ) : (
        <AdminPanel
          selectedLanguage={i18n.resolvedLanguage?.split('-')[0] || 'en'}
          onLogout={handleAdminLogout}
          session={session}
        />
      )}
    </>
  );
}

export default function AdminDashboardApp() {
  return (
    <ErrorBoundary>
      <AdminDashboardAppContent />
    </ErrorBoundary>
  );
}
