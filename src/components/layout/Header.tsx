import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Menu, UserCheck, Headphones, MessageSquare, X, ChevronRight, Radio } from "lucide-react";
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

  const handleStartChatWithConsultant = () => {
    setShowConsultantModal(false);
    if (takeoverStatus !== "live") {
      window.dispatchEvent(new Event('code4care:request-takeover'));
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#F4D6D5] flex-shrink-0 sticky top-0 z-50 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 sm:gap-4">

          {/* LEFT SIDE */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl lg:hidden h-9 w-9"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <Shield className="w-4 h-4 text-[#BE322D]" />
                <h1 className="min-w-0 truncate font-bold text-sm sm:text-base leading-none text-gray-900">
                  {botName}
                </h1>

                <Badge
                  variant="outline"
                  className="hidden h-5 gap-1 border-green-100 bg-green-50 px-1.5 text-green-600 sm:flex"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {t('common.online')}
                </Badge>
              </div>

              {nickname ? (
                <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5" />
                  {t('chat.welcome', { name: nickname })}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 mt-0.5 italic">
                  {t('chat.anonymous')}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">

            {/* UNIFIED CONSULTANT BUTTON (Top header button) */}
            <button
              type="button"
              onClick={() => setShowConsultantModal(true)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 active:scale-95 ${
                takeoverStatus === "live"
                  ? "border-emerald-300 bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200"
                  : takeoverStatus === "queued"
                    ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
              }`}
              title="Speak or chat with a professional consultant"
            >
              <div className="relative flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-current" />
                <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-white ${
                  takeoverStatus === "live"
                    ? "bg-emerald-500"
                    : takeoverStatus === "queued"
                      ? "animate-pulse bg-amber-500"
                      : "animate-pulse bg-emerald-500"
                }`} />
              </div>

              <span className="whitespace-nowrap">
                {takeoverStatus === "live"
                  ? "Consultant Active"
                  : takeoverStatus === "queued"
                    ? "In Queue"
                    : t('chat.talkToConsultant', 'Consultant')}
              </span>
            </button>

            {/* PANIC BUTTON */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onPanicClick}
              className="h-8 sm:h-9 rounded-full px-3 text-xs sm:px-4 sm:text-sm font-bold bg-[#ff4444] hover:bg-[#ff1111] shadow-md shadow-red-200"
            >
              {t('common.panic', 'PANIC')}
            </Button>
          </div>
        </div>
      </header>

      {/* ================= CONSULTANT CHOICE MODAL ================= */}
      {showConsultantModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-emerald-100 relative">

            {/* Close button */}
            <button
              onClick={() => setShowConsultantModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  Connect with a Consultant
                </h2>
                <p className="text-xs text-gray-500">
                  Free, confidential & youth-friendly support
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mt-2 mb-4">
              Speak directly with a trained counselor right here in this chat window:
            </p>

            {/* Action Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleStartChatWithConsultant}
                className="w-full text-left p-3.5 sm:p-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white hover:border-emerald-400 hover:shadow-md transition-all group flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        Request a Consultant
                      </span>
                      {takeoverStatus === "live" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800">
                          Active Now
                        </span>
                      ) : takeoverStatus === "queued" ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          In Queue
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Chat privately with a counselor right here in this chat window.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>
            </div>

            {/* Footer notice */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>All conversations are 100% confidential</span>
              <button
                type="button"
                onClick={() => setShowConsultantModal(false)}
                className="text-gray-500 hover:text-gray-800 font-medium"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};