import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
} from 'lucide-react';
import {
  MfaChallengeRequiredError,
  StaffAccessService,
  StaffSession,
} from '@/services/staffAccessService';
import { PasswordPolicyChecklist } from './PasswordPolicyChecklist';
import { getPasswordPolicyError, isPasswordValid } from '@/utils/passwordPolicy';

interface AdminDashboardLoginProps {
  onAdminLogin: (session: StaffSession) => void;
}

type AuthMode = 'login' | 'mfa' | 'forgot' | 'reset';

export function AdminDashboardLogin({ onAdminLogin }: AdminDashboardLoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Detect ?reset_token=... from password reset email links and scrub URL bar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('reset_token');
    if (tokenParam && tokenParam.trim()) {
      setResetToken(tokenParam.trim());
      setMode('reset');
      setError('');
      setSuccessMessage('');
      params.delete('reset_token');
      const remaining = params.toString();
      const nextUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        const res = await StaffAccessService.requestPasswordReset(email);
        setSuccessMessage(res.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to send password reset email.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      const policyErr = getPasswordPolicyError(newPassword);
      if (policyErr) {
        setError(policyErr);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await StaffAccessService.completePasswordReset(resetToken, newPassword);
        setMode('login');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setPassword('');
        setSuccessMessage(res.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to reset password.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'mfa' && mfaToken) {
        const session = await StaffAccessService.verifyMfaLogin(mfaToken, mfaCode);
        onAdminLogin(session);
      } else {
        const session = await StaffAccessService.login(email, password);
        onAdminLogin(session);
      }
    } catch (loginError) {
      if (loginError instanceof MfaChallengeRequiredError) {
        setMfaToken(loginError.mfaToken);
        setMfaCode('');
        setMode('mfa');
        setError('');
        setSuccessMessage('');
      } else {
        setError(
          loginError instanceof Error
            ? loginError.message
            : 'Invalid credentials, inactive account, or role not permitted.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setMfaToken(null);
    setMfaCode('');
    setError('');
  };

  const headerTitle =
    mode === 'mfa'
      ? 'Two-Factor Verification'
      : mode === 'forgot'
        ? 'Forgot Password'
        : mode === 'reset'
          ? 'Set New Password'
          : 'Staff Dashboard Login';

  const headerSubtitle =
    mode === 'mfa'
      ? 'Enter the 6-digit code from your authenticator app or a one-time backup code.'
      : mode === 'forgot'
        ? 'Enter your work email and we will send a password reset link.'
        : mode === 'reset'
          ? 'Choose a new strong password for your Lydia Contact Center account.'
          : 'Secure access for Admin and Support Consultant accounts.';

  const submitDisabled =
    isLoading ||
    (mode === 'reset' && (!isPasswordValid(newPassword) || newPassword !== confirmPassword));

  return (
    <div className="h-[100dvh] lg:h-screen flex items-center justify-center px-3 py-4 sm:p-4 overflow-y-auto bg-gradient-to-b from-white via-[#FFF8F8] to-[#FFF1F1]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <div className="w-full px-1 sm:px-2">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#BE322D] to-[#F16365] flex items-center justify-center">
              {mode === 'mfa' || mode === 'reset' ? (
                <KeyRound className="w-6 h-6 text-white" />
              ) : mode === 'forgot' ? (
                <Mail className="w-6 h-6 text-white" />
              ) : (
                <Shield className="w-6 h-6 text-white" />
              )}
            </div>
            <p className="text-xs font-semibold tracking-wide uppercase text-[#BE322D] mb-1">
              Lydia Contact Center
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {headerTitle}
            </h1>
            <p className="text-gray-500 text-sm">{headerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'mfa' && (
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <Input
                  type="text"
                  placeholder="6-digit code or backup code"
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(e.target.value);
                    setError('');
                  }}
                  autoComplete="one-time-code"
                  maxLength={12}
                  className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#BE322D] tracking-widest"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}

            {mode === 'forgot' && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <Input
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New strong password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                    disabled={isLoading}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <PasswordPolicyChecklist
                  password={newPassword}
                  confirmPassword={confirmPassword}
                />
              </>
            )}

            {mode === 'login' && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <Input
                    type="email"
                    placeholder="Work email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Account password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="text-xs font-medium text-[#BE322D] hover:underline focus:outline-none"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-lg"
              disabled={submitDisabled}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {mode === 'forgot'
                    ? 'Sending link...'
                    : mode === 'reset'
                      ? 'Updating...'
                      : 'Verifying...'}
                </div>
              ) : (
                <>
                  {mode === 'mfa'
                    ? 'Verify & Sign In'
                    : mode === 'forgot'
                      ? 'Send Reset Link'
                      : mode === 'reset'
                        ? 'Reset Password'
                        : 'Access Dashboard'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>

            {mode !== 'login' ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 text-sm text-gray-500 hover:text-gray-800"
                onClick={switchToLogin}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to email &amp; password
              </Button>
            ) : (
              <p className="text-center text-xs text-gray-400 pt-2">
                Use the credentials sent to your email or provisioned by an administrator.
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
