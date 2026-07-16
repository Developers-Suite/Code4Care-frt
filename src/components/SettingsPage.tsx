import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, Clock3, Download, Languages, LogOut, Shield, Trash2, UserRound } from "lucide-react";

import { useApp } from "@/providers/AppProvider";
import { UserEngagementService } from "@/services/userEngagementService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface SettingsPageProps {
  onClearChat: () => void;
  onLogout: () => void;
  onResetPWADismissal?: () => void;
}

const SESSION_OPTIONS = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "twi", label: "Twi" },
  { code: "ewe", label: "Ewe" },
  { code: "ha", label: "Hausa" },
];

export function SettingsPage({ onClearChat, onLogout, onResetPWADismissal }: SettingsPageProps) {
  const { t, i18n } = useTranslation();
  const {
    nickname,
    setNickname,
    botName,
    setBotName,
    sessionDuration,
    setSessionDuration,
    analyticsOptIn,
    setAnalyticsOptIn,
    sessionId,
    consultantMode,
  } = useApp();

  const [draftNickname, setDraftNickname] = useState(nickname ?? "");
  const [draftBotName, setDraftBotName] = useState(botName);

  useEffect(() => {
    setDraftNickname(nickname ?? "");
  }, [nickname]);

  useEffect(() => {
    setDraftBotName(botName);
  }, [botName]);

  const syncUserSettings = (overrides: Partial<{ nickname: string; language: string; chatRetention: string; analyticsConsent: boolean; consultantModeEnabled: boolean }> = {}) => {
    const languageCode = overrides.language ?? (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

    UserEngagementService.logNonBlocking(
      UserEngagementService.syncUserSettings({
        sessionId,
        nickname: overrides.nickname ?? nickname ?? "",
        language: languageCode,
        chatRetention: overrides.chatRetention ?? sessionDuration,
        analyticsConsent: overrides.analyticsConsent ?? analyticsOptIn,
        consultantModeEnabled: overrides.consultantModeEnabled ?? consultantMode,
      }),
      "Failed to update user settings",
    );
  };

  const handleSaveNames = () => {
    const safeBotName = draftBotName.trim() || "Lydia Contact Center";
    const safeNickname = draftNickname.trim();

    setBotName(safeBotName);
    setNickname(safeNickname ? safeNickname : undefined);
    syncUserSettings({ nickname: safeNickname });
  };

  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#FFF8F8] via-white to-[#FFF1F1] p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-3xl border border-[#F4D6D5] bg-[#BE322D] p-6 text-white shadow-xl shadow-[#F5D5D5]">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-2xl border border-white/30 bg-white/20 p-3">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t("settings.title", "Settings")}</h2>
              <p className="mt-1 text-sm text-white/85">
                {t("settings.subtitle", "Control your privacy, language, and chat preferences.")}
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border-[#CFE0FF] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#BE322D]">
              <Bot className="h-4 w-4" />
              {t("settings.profileTitle", "Identity & Profile")}
            </CardTitle>
            <CardDescription>
              {t("settings.profileDesc", "Customize display names without sharing personal data.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#241515]">{t("settings.botName", "Chatbot Name")}</label>
                <Input
                  value={draftBotName}
                  onChange={(e) => setDraftBotName(e.target.value)}
                  placeholder={t("settings.botNamePlaceholder", "Enter chatbot name")}
                  className="h-11 rounded-xl border-[#F4D6D5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#241515]">{t("settings.nickname", "Your Nickname")}</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A6B6B]" />
                  <Input
                    value={draftNickname}
                    onChange={(e) => setDraftNickname(e.target.value)}
                    placeholder={t("settings.nicknamePlaceholder", "Optional nickname")}
                    className="h-11 rounded-xl border-[#F4D6D5] pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSaveNames}
                className="rounded-xl bg-[#BE322D] text-white hover:bg-[#9F2622]"
              >
                {t("common.save", "Save")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#CFE0FF] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#BE322D]">
              <Languages className="h-4 w-4" />
              {t("settings.language", "Language")}
            </CardTitle>
            <CardDescription>{t("settings.chooseLanguage", "Choose Language")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      void i18n.changeLanguage(lang.code);
                      syncUserSettings({ language: lang.code });
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? "border-[#BE322D] bg-[#BE322D] text-white shadow-md shadow-[#F5D5D5]/80"
                        : "border-[#F4D6D5] bg-white text-[#6D4A49] hover:border-[#BE322D] hover:bg-[#FFF1F1] hover:text-[#BE322D]"
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#CFE0FF] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#BE322D]">
              <Clock3 className="h-4 w-4" />
              {t("settings.retention", "Message Retention")}
            </CardTitle>
            <CardDescription>
              {t("settings.chooseRetention", "Choose how long to keep your chats")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {SESSION_OPTIONS.map((option) => {
                const active = sessionDuration === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSessionDuration(option.value);
                      syncUserSettings({ chatRetention: option.value });
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? "border-[#BE322D] bg-[#BE322D] text-white shadow-sm"
                        : "border-[#F4D6D5] bg-white text-[#6D4A49] hover:border-[#BE322D] hover:bg-[#FFF1F1] hover:text-[#BE322D]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#CFE0FF] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#BE322D]">
              <Shield className="h-4 w-4" />
              {t("settings.dataForGood", "Data for Good")}
            </CardTitle>
            <CardDescription>
              {t("settings.analyticsDesc", "Share anonymous usage data to help us improve.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-2xl border border-[#DDE9FF] bg-[#F7FAFF] p-4">
              <div>
                <p className="font-semibold text-[#0F2A6B]">{t("settings.analyticsTitle", "Anonymous analytics")}</p>
                <p className="text-sm text-[#5B77B8]">
                  {t("settings.analyticsHint", "No personal identifiers are collected.")}
                </p>
              </div>
              <Switch
                checked={analyticsOptIn}
                onCheckedChange={(checked) => {
                  setAnalyticsOptIn(checked);
                  syncUserSettings({ analyticsConsent: checked });
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#CFE0FF] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#BE322D]">
              <Download className="h-4 w-4" />
              {t("settings.pwaTitle", "Install App")}
            </CardTitle>
            <CardDescription>
              {t("settings.pwaDesc", "Re-enable the installation prompt to add Lydia Contact Center to your home screen.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                onResetPWADismissal?.();
                toast.success(t("settings.pwaReset", "Install prompt has been re-enabled"));
              }}
              className="w-full rounded-xl bg-[#BE322D] text-white hover:bg-[#9F2622]"
            >
              <Download className="h-4 w-4" />
              {t("settings.enableInstall", "Re-enable Install Prompt")}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">{t("settings.dangerZone", "Danger Zone")}</CardTitle>
            <CardDescription>
              {t("settings.dangerDesc", "Clear current conversation or end your session on this device.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onClearChat}
            >
              <Trash2 className="h-4 w-4" />
              {t("chat.clearChat", "Clear Conversation")}
            </Button>
            <Separator className="bg-red-100" />
            <Button
              variant="destructive"
              className="w-full justify-start rounded-xl"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {t("common.logout", "Logout")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
