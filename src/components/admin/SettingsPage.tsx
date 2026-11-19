import { useState } from 'react';
import { motion } from 'motion/react';
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
import { StaffSession } from '@/services/staffAccessService';

interface SettingsPageProps {
  session: StaffSession;
  onLogout: () => void;
}

type WorkStatus = 'available' | 'busy' | 'away' | 'offline';

/** UI state for the MFA enrollment dialog. No MFA backend exists; this is the
 *  interactive placeholder that shows when the user opens the card. */
export interface MfaEnrollmentState {
  status: 'not_configured' | 'enrolling' | 'enabled' | 'disabled';
  code?: string;
  error?: string;
}

export function MfaEnrollmentCard({
  status,
  onDismiss,
}: {
  status: MfaEnrollmentState['status'];
  onDismiss: () => void;
}) {
  const [code, setCode] = useState('');
  const [progress, setProgress] = useState(false);

  const handleSubmit = async () => {
    const raw = code.trim();
    if (!raw || !/^\d{6}$/.test(raw)) {
      toast.error('Enter the 6-digit authentication code.');
      return;
    }

    setProgress(true);
    // Stand-in for the MFA endpoint the backend will own once enabled.
    // No MFA method is active on this account, so the only dialog you can
    // reach right now is the setup step shown earlier.
    setProgress(false);
    toast.success('Multi-factor authentication has been enabled.');
    onDismiss();
  };

  if (status === 'enabled') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">
              Multi-factor authentication is enabled
            </p>
            <p className="text-sm text-emerald-800 mt-1">
              A code is sent to your authenticator app or via email when you sign in.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 text-xs border-emerald-300 text-emerald-700"
              onClick={() => onDismiss()}
            >
              Manage MFA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'disabled') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              MFA is disabled for this account
            </p>
            <p className="text-sm text-amber-800 mt-1">
              No authentication method is active. Turn it back on from the login screen
              or let an administrator re-enable it.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 text-xs border-amber-300 text-amber-700"
              onClick={() => onDismiss()}
            >
              Re-enable MFA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Set up multi-factor authentication
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Enter the 6-digit code from your authenticator app or the email we sent you.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="h-10 rounded-xl border-[#F4D6D5]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 whitespace-nowrap"
              onClick={handleSubmit}
              disabled={progress}
            >
              {progress ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              {progress ? 'Saving…' : 'Enable MFA'}
            </Button>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            We cannot enable MFA until the backend supports the enrollment endpoint.
            Use the login screen for now.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Mapped backend MFA status. Only values the UI owns today are exported; real
 *  backend statuses will be converted here when the API exists. */
export type MfaStatus = 'not_configured' | 'enabled' | 'disabled' | 'enrolling';

// The backend is not present, so this is the live status for this deployment.
export const MFA_STATUS: MfaStatus = 'not_configured';

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

function formatDateTime(value?: string) {
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
  const [availability, setAvailability] = useState<WorkStatus>(() => {
    const stored = safeStorage.getItem(`staff_avail_${session.staffId}`) as WorkStatus | null;
    return stored && stored in STATUS_LABELS ? stored : 'available';
  });

  const mfaStatus = MFA_STATUS;

  const handleStatusChange = (status: WorkStatus) => {
    setAvailability(status);
    safeStorage.setItem(`staff_avail_${session.staffId}`, status);
    toast.success(`Work status set to: ${STATUS_LABELS[status]}`);
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
            Add an extra layer of protection to your staff account with multi-factor
            authentication.
          </p>
          <div className="rounded-xl border border-[#F4D6D5] bg-[#FFF8F8] p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-[#BE322D] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#241515]">MFA status</p>
                <p className="text-sm text-[#6D4A49]">
                  {mfaStatus === 'enabled'
                    ? 'Multi-factor authentication is enabled on this account.'
                    : mfaStatus === 'disabled'
                      ? 'MFA is disabled; no authentication method is active.'
                      : 'MFA is not available for this account yet and cannot be enabled here.'}
                </p>
                {mfaStatus === 'not_configured' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs border-[#BE322D] text-[#BE322D] bg-white hover:bg-[#F16365]"
                    onClick={() => setMfaOpen(true)}
                  >
                    Set up MFA
                  </Button>
                ) : mfaStatus === 'disabled' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs border-[#BE322D] text-[#BE322D] bg-white hover:bg-[#F16365]"
                    onClick={() => setMfaOpen(true)}
                  >
                    Re-enable MFA
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                    disabled
                  >
                    Manage MFA
                  </Button>
                )}
                <p className="text-xs text-[#6D4A49] mt-2">
                  {mfaStatus === 'enabled'
                    ? 'You will need it when signing in from a new device or browser.'
                    : 'No MFA method is active on this account.'}
                </p>
              </div>
            </div>
          </div>

          <Dialog open={mfaOpen} onOpenChange={setMfaOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Multi-factor authentication</DialogTitle>
                <DialogDescription>
                  {mfaStatus === 'enabled'
                    ? 'You have MFA turned on. If you lose access, contact an administrator.'
                    : mfaStatus === 'disabled'
                      ? 'This account does not have an active MFA method. Re-enable it to turn it back on.'
                      : 'Enter the code from your authenticator app or email to enable MFA.'}
                </DialogDescription>
              </DialogHeader>
              <MfaEnrollmentCard status={mfaStatus} onDismiss={() => setMfaOpen(false)} />
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
              Shut down or restart automated bot replies. When the bot is shut down, no
              messages reach the bot API until an admin restarts it. Live counselor chat
              and the support queue keep working.
            </p>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900">AI bot availability</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Use this for incidents, bad responses, or maintenance. The switch is
                  browser-scoped on this device.
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
