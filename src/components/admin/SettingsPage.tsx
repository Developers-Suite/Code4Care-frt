import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  User,
  Shield,
  Download,
  Activity,
  LogOut,
  Settings,
  ShieldAlert,
  Circle,
  KeyRound,
  CheckCircle2,
  Loader2,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BotKillSwitch } from './BotKillSwitch';
import { useDashboardPwaInstall } from '@/hooks/useDashboardPwaInstall';
import { safeStorage } from '@/utils/safeStorage';
import {
  MfaSetupResponse,
  StaffAccessService,
  StaffSession,
} from '@/services/staffAccessService';

interface SettingsPageProps {
  session: StaffSession;
  onLogout: () => void;
}

type WorkStatus = 'available' | 'busy' | 'away' | 'offline';

export type MfaStatus = 'not_configured' | 'enabled' | 'disabled' | 'enrolling';

const STATUS_LABELS: Record<WorkStatus, string> = {
  available: 'Available',
  busy: 'In Consultation',
  away: 'On Break',
  offline: 'Offline',
};

const STATUS_STYLES: Record<
  WorkStatus,
  { dot: string; active: string; idle: string }
> = {
  available: {
    dot: 'bg-emerald-500',
    active: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    idle: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
  busy: {
    dot: 'bg-blue-500',
    active: 'border-blue-300 bg-blue-50 text-blue-800',
    idle: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
  away: {
    dot: 'bg-amber-500',
    active: 'border-amber-300 bg-amber-50 text-amber-800',
    idle: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
  offline: {
    dot: 'bg-gray-400',
    active: 'border-gray-300 bg-gray-100 text-gray-800',
    idle: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
  },
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 break-all sm:text-right">
        {value || '—'}
      </span>
    </div>
  );
}

export function SettingsPage({ session, onLogout }: SettingsPageProps) {
  const isAdmin = session.role === 'admin';
  const { isInstalled, promptInstall } = useDashboardPwaInstall();

  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>(
    session.user?.mfa_enabled ? 'enabled' : 'not_configured',
  );
  const [mfaEnabledAt, setMfaEnabledAt] = useState<string | null>(null);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState<number>(0);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<MfaSetupResponse | null>(null);
  const [mfaQrDataUrl, setMfaQrDataUrl] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const [availability, setAvailability] = useState<WorkStatus>(() => {
    const stored = safeStorage.getItem(`staff_avail_${session.staffId}`) as WorkStatus | null;
    return stored && stored in STATUS_LABELS ? stored : 'available';
  });

  useEffect(() => {
    if (!session.accessToken) return;
    let active = true;
    StaffAccessService.getMfaStatus(session.accessToken)
      .then((res) => {
        if (!active) return;
        setMfaStatus(res.mfa_enabled ? 'enabled' : 'not_configured');
        setMfaEnabledAt(res.enabled_at ?? null);
        setBackupCodesRemaining(res.backup_codes_remaining ?? 0);
      })
      .catch(() => {
        // Keep initial status if endpoint is temporarily unreachable
      });
    return () => {
      active = false;
    };
  }, [session.accessToken]);

  const handleOpenMfaDialog = async () => {
    setMfaCode('');
    setDisablePassword('');
    setBackupCodes(null);
    setMfaQrDataUrl(null);
    setMfaOpen(true);

    if (mfaStatus !== 'enabled') {
      setMfaLoading(true);
      try {
        const setup = await StaffAccessService.setupMfa(session.accessToken);
        setMfaSetup(setup);
        const qrUrl = await QRCode.toDataURL(setup.otpauth_uri, {
          width: 200,
          margin: 1,
        });
        setMfaQrDataUrl(qrUrl);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not start MFA setup.');
        setMfaOpen(false);
      } finally {
        setMfaLoading(false);
      }
    }
  };

  const handleEnableMfa = async () => {
    const raw = mfaCode.trim();
    if (!/^\d{6}$/.test(raw)) {
      toast.error('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setMfaLoading(true);
    try {
      const result = await StaffAccessService.enableMfa(raw, session.accessToken);
      setMfaStatus('enabled');
      setMfaEnabledAt(result.enabled_at);
      setBackupCodesRemaining(result.backup_codes.length);
      setBackupCodes(result.backup_codes);
      setMfaSetup(null);
      setMfaQrDataUrl(null);
      setMfaCode('');
      toast.success('Multi-factor authentication has been enabled.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid authentication code.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!disablePassword || !mfaCode.trim()) {
      toast.error('Enter your password and a valid 6-digit code or backup code.');
      return;
    }

    setMfaLoading(true);
    try {
      await StaffAccessService.disableMfa(disablePassword, mfaCode.trim(), session.accessToken);
      setMfaStatus('not_configured');
      setMfaEnabledAt(null);
      setBackupCodesRemaining(0);
      setDisablePassword('');
      setMfaCode('');
      setMfaOpen(false);
      toast.success('Multi-factor authentication has been disabled.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not disable MFA.');
    } finally {
      setMfaLoading(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const handleStatusChange = async (status: WorkStatus) => {
    setAvailability(status);
    safeStorage.setItem(`staff_avail_${session.staffId}`, status);
    try {
      if (session.accessToken) {
        await StaffAccessService.changeStaffAvailability(
          session.staffId,
          { availability: status === 'away' ? 'busy' : status },
          session.accessToken,
        );
      }
      toast.success(`Work status set to: ${STATUS_LABELS[status]}`);
    } catch {
      toast.success(`Work status set locally to: ${STATUS_LABELS[status]}`);
    }
  };

  const handleInstall = async () => {
    try {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        toast.info('Install the dashboard', {
          description:
            'Open your browser menu and choose "Install app", or "Add to Home Screen" on iOS.',
        });
      }
    } catch {
      toast.error(
        'Could not open the install prompt. Use your browser menu to install the dashboard.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BE322D] to-[#F16365] flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your account, security, and dashboard preferences.
              </p>
            </div>
          </div>
        </motion.div>

        <Card className="border-[#E8ECFF] bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#BE322D]" />
            <h2 className="font-semibold text-gray-900 text-sm">Account</h2>
            <Badge variant="outline" className="ml-1 text-[10px] font-semibold border-gray-200 text-gray-500">
              Read-only
            </Badge>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-1">
            <InfoRow label="Name" value={session.name || '—'} />
            <InfoRow label="Email" value={session.email || '—'} />
            <InfoRow
              label="Role"
              value={
                session.role
                  ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
                  : '—'
              }
            />
            <InfoRow label="Staff ID" value={session.staffId || '—'} />
            <InfoRow label="Signed in" value={formatDateTime(session.loginAt)} />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Account details are managed by your organization. Contact an administrator
            if something needs to change.
          </p>
        </Card>

        <Card className="border-[#E8ECFF] bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#BE322D]" />
            <h2 className="font-semibold text-gray-900 text-sm">
              Security &amp; multi-factor authentication (MFA)
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of protection to your staff account using an authenticator app
            (Google Authenticator, Authy, 1Password, etc.).
          </p>
          <div
            className={`rounded-xl border p-4 ${
              mfaStatus === 'enabled'
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-[#F4D6D5] bg-[#FFF8F8]'
            }`}
          >
            <div className="flex items-start gap-3">
              {mfaStatus === 'enabled' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
              ) : (
                <KeyRound className="w-5 h-5 text-[#BE322D] mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">MFA status</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {mfaStatus === 'enabled'
                    ? 'Multi-factor authentication is enabled on this account.'
                    : 'MFA is not enabled on this account yet.'}
                </p>
                {mfaStatus === 'enabled' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100"
                    onClick={() => void handleOpenMfaDialog()}
                  >
                    Manage / Disable MFA
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs border-[#BE322D] text-[#BE322D] bg-white hover:bg-[#BE322D] hover:text-white"
                    onClick={() => void handleOpenMfaDialog()}
                  >
                    Set up MFA
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {mfaStatus === 'enabled'
                    ? `Enabled ${mfaEnabledAt ? `on ${formatDateTime(mfaEnabledAt)}` : ''} · ${backupCodesRemaining} backup code${backupCodesRemaining === 1 ? '' : 's'} remaining.`
                    : 'Protect your staff login with a 6-digit authenticator code.'}
                </p>
              </div>
            </div>
          </div>

          <Dialog open={mfaOpen} onOpenChange={setMfaOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Multi-factor authentication</DialogTitle>
                <DialogDescription>
                  {backupCodes
                    ? 'Save these one-time backup codes in a secure place. Each code can only be used once.'
                    : mfaStatus === 'enabled'
                      ? 'Confirm your password and a 6-digit authenticator code (or backup code) to disable MFA.'
                      : 'Scan the QR code (or enter the setup key manually) in your authenticator app, then verify with a 6-digit code.'}
                </DialogDescription>
              </DialogHeader>

              {backupCodes ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-mono text-xs text-emerald-950">
                    {backupCodes.map((code) => (
                      <div key={code} className="rounded bg-white px-2 py-1 text-center border border-emerald-100">
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyText(backupCodes.join('\n'), 'Backup codes')}
                    >
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy codes
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setBackupCodes(null);
                        setMfaOpen(false);
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : mfaStatus === 'enabled' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showDisablePassword ? 'text' : 'password'}
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Current password"
                      disabled={mfaLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDisablePassword((v) => !v)}
                      aria-label={showDisablePassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showDisablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Input
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="6-digit code or backup code"
                    maxLength={12}
                    autoComplete="one-time-code"
                    disabled={mfaLoading}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => setMfaOpen(false)} disabled={mfaLoading}>
                      Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => void handleDisableMfa()} disabled={mfaLoading}>
                      {mfaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Disable MFA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {mfaLoading && !mfaSetup ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating setup key…
                    </div>
                  ) : mfaSetup ? (
                    <>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col items-center text-center gap-2">
                        <p className="text-xs font-semibold text-gray-800">
                          Step 1: Scan QR code
                        </p>
                        {mfaQrDataUrl && (
                          <img
                            src={mfaQrDataUrl}
                            alt="Authenticator QR code"
                            className="w-44 h-44 rounded-lg border border-gray-200 bg-white p-2"
                          />
                        )}
                        <p className="text-xs text-gray-500">
                          Scan with Google Authenticator, Authy, Microsoft Authenticator, or Apple Passwords.
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                        <p className="text-xs font-medium text-gray-600">Manual setup key</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono break-all text-gray-900 select-all">
                            {mfaSetup.secret}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs flex-shrink-0"
                            onClick={() => void copyText(mfaSetup.secret, 'Setup key')}
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Account: {mfaSetup.account_name} · Issuer: {mfaSetup.issuer}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-800">
                          Step 2: Enter the 6-digit code
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className="h-10 rounded-xl border-[#F4D6D5]"
                            disabled={mfaLoading}
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-10 whitespace-nowrap bg-[#BE322D] hover:bg-[#9F2622] text-white"
                            onClick={() => void handleEnableMfa()}
                            disabled={mfaLoading}
                          >
                            {mfaLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <KeyRound className="w-4 h-4 mr-2" />
                            )}
                            {mfaLoading ? 'Verifying…' : 'Enable MFA'}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </Card>

        {isAdmin && (
          <Card className="border-[#E8ECFF] bg-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#BE322D]" />
              <h2 className="font-semibold text-gray-900 text-sm">Bot controls</h2>
              <Badge variant="outline" className="text-[10px] font-semibold border-red-200 bg-red-50 text-red-700">
                Admin only
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Turn automated AI bot replies off or back on globally. When turned off,
              automated replies stop across web and WhatsApp until an admin turns the bot
              back on. Live counselor chat and the support queue keep working.
            </p>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">AI bot availability</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Use this for incidents, bad responses, or maintenance. Applies globally
                  for all users.
                </p>
              </div>
              <BotKillSwitch session={session} />
            </div>
          </Card>
        )}

        <Card className="border-[#E8ECFF] bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-[#BE322D]" />
            <h2 className="font-semibold text-gray-900 text-sm">Dashboard install</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Install the staff dashboard as its own app. It opens directly to{' '}
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/dashboard</code>{' '}
            and stays separate from the client app.
          </p>
          {isInstalled ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              The dashboard is already installed on this device.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleInstall}
                className="bg-[#BE322D] hover:bg-[#9F2622] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Install dashboard app
              </Button>
              <p className="text-xs text-gray-500">
                If the install prompt does not appear, use your browser menu (Install app
                / Add to Home Screen).
              </p>
            </div>
          )}
        </Card>

        <Card className="border-[#E8ECFF] bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#BE322D]" />
            <h2 className="font-semibold text-gray-900 text-sm">Work status</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Set your availability so the team can see your current status. This updates
            the status shown on your profile.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(STATUS_LABELS) as WorkStatus[]).map((status) => {
              const selected = availability === status;
              const styles = STATUS_STYLES[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    selected ? styles.active : styles.idle
                  }`}
                  aria-pressed={selected}
                >
                  <Circle
                    className={`w-2.5 h-2.5 ${styles.dot} ${selected ? '' : 'opacity-80'}`}
                    fill="currentColor"
                  />
                  {STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Current status:{' '}
            <span className="font-medium text-gray-700">
              {STATUS_LABELS[availability]}
            </span>
          </p>
        </Card>

        <Card className="border-rose-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <LogOut className="w-4 h-4 text-rose-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Session</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Sign out of the staff dashboard on this device. You will need your
            credentials to sign in again.
          </p>
          <Button type="button" variant="destructive" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
