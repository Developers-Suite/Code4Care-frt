import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { AdminPanel } from "./components/AdminPanel";
import { AdminDashboardLogin } from "./components/AdminDashboardLogin";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StaffAccessService, StaffSession } from "./services/staffAccessService";

function AdminDashboardAppContent() {
  const { i18n } = useTranslation();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (!session) {
    return <AdminDashboardLogin onAdminLogin={handleAdminLogin} />;
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{ className: 'rounded-2xl' }} />
      <AdminPanel
        selectedLanguage={i18n.resolvedLanguage?.split('-')[0] || 'en'}
        onLogout={handleAdminLogout}
        session={session}
      />
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
