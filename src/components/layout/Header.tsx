import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Menu, UserCheck, AlertCircle, User, ListOrdered } from "lucide-react";
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onMenuClick: () => void;
  onPanicClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onPanicClick
}) => {
  const { t } = useTranslation();
  const { nickname, botName, consultantMode } = useApp();

  const [showConsultantModal, setShowConsultantModal] = React.useState(false);
  const [takeoverStatus, setTakeoverStatus] = React.useState<"idle" | "queued" | "live">(
    consultantMode ? "live" : "idle"
  );

  React.useEffect(() => {
    const handleTakeoverStatus = (event: Event) => {
      const status = (event as CustomEvent<"idle" | "queued" | "live">).detail;
      setTakeoverStatus(status);
    };

    window.addEventListener('code4care:takeover-status', handleTakeoverStatus);
    return () => window.removeEventListener('code4care:takeover-status', handleTakeoverStatus);
  }, []);

  const requestTakeover = () => {
    if (takeoverStatus !== "live") {
      window.dispatchEvent(new Event('code4care:request-takeover'));
    }
  };

  const consultantPhone = '1221';

  const handleCallConsultant = () => {
    setShowConsultantModal(false);
    if (consultantPhone) {
      window.location.href = `tel:${consultantPhone.replace(/\D/g, '')}`;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#F4D6D5] flex-shrink-0 sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 sm:gap-4">

          {/* LEFT SIDE */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <Shield className="w-4 h-4 text-[#BE322D]" />
                <h1 className="min-w-0 truncate font-bold leading-none text-gray-900">
                  {botName}
                </h1>

                <Badge
                  variant="outline"
                  className="hidden h-5 gap-1 border-green-100 bg-green-50 px-1.5 text-green-600 sm:flex"
                >
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  {t('common.online')}
                </Badge>
              </div>

              {nickname ? (
                <span className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                  <UserCheck className="w-2 h-2" />
                  {t('chat.welcome', { name: nickname })}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 mt-1 italic">
                  {t('chat.anonymous')}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Consultant queue status */}
            <div className="relative group inline-flex items-center">
              <button
                type="button"
                onClick={requestTakeover}
                disabled={takeoverStatus === "live"}
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors disabled:cursor-default ${
                  takeoverStatus === "live"
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                    : takeoverStatus === "queued"
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
                }`}
                aria-label={
                  takeoverStatus === "live"
                    ? "Live consultant chat active"
                    : takeoverStatus === "queued"
                      ? "Consultant request in queue"
                      : "Request live consultant"
                }
              >
                <ListOrdered className="h-4 w-4" />
                <span className={`absolute right-0.5 top-0.5 h-2 w-2 rounded-full ring-2 ring-white ${
                  takeoverStatus === "live"
                    ? "bg-emerald-500"
                    : takeoverStatus === "queued"
                      ? "animate-pulse bg-amber-500"
                      : "animate-pulse bg-emerald-500"
                }`} />
              </button>
              <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-gray-900/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block">
                {takeoverStatus === "live" ? "Live consultant chat" : takeoverStatus === "queued" ? "Consultant in queue" : "Join consultant queue"}
              </span>
            </div>

            {/* Consultant Button (opens modal instead of calling directly) */}
            {consultantPhone && (
              <button
                onClick={() => setShowConsultantModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-100 sm:hidden"
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-medium whitespace-nowrap">
                  {t('chat.talkToConsultant', 'Consultant')}
                </span>
              </button>
            )}

            {/* Consultant mode badge */}
            {consultantMode && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white hidden sm:flex items-center gap-1 px-2 py-1">
                <AlertCircle className="w-3 h-3" />
                {t('chat.consultantModeActive', 'Expert Active')}
              </Badge>
            )}

            {/* Panic Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onPanicClick}
              className="h-9 rounded-full px-3 text-xs sm:px-4 sm:text-sm bg-[#ff4444] hover:bg-[#ff1111] shadow-lg shadow-red-200"
            >
              {t('common.panic', 'PANIC')}
            </Button>
          </div>
        </div>
      </header>

      {/* ================= MODAL ================= */}
      {showConsultantModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">

            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Talk to a professional consultant?
              </h2>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              You are about to be connected to a trained professional consultant for private support.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConsultantModal(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={handleCallConsultant}
                className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Call now
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};