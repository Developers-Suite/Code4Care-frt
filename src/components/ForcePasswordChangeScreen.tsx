import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, KeyRound, Lock, LogOut, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordPolicyChecklist } from './PasswordPolicyChecklist';
import { StaffAccessService, StaffSession } from '@/services/staffAccessService';
import { getPasswordPolicyError, isPasswordValid } from '@/utils/passwordPolicy';

interface ForcePasswordChangeScreenProps {
  session: StaffSession;
  onPasswordChanged: () => void;
  onLogout: () => void;
}

export function ForcePasswordChangeScreen({
  session,
  onPasswordChanged,
  onLogout,
}: ForcePasswordChangeScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit =
    !isSaving &&
    currentPassword.length > 0 &&
    isPasswordValid(newPassword) &&
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Enter your current temporary password.');
      return;
    }
    const policyErr = getPasswordPolicyError(newPassword);
    if (policyErr) {
      setError(policyErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from the temporary password.');
      return;
    }

    setIsSaving(true);
    try {
      await StaffAccessService.changePassword(
        currentPassword,
        newPassword,
        session.accessToken,
      );
      onPasswordChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-3 py-6 sm:p-4 overflow-y-auto bg-gradient-to-b from-white via-[#FFF8F8] to-[#FFF1F1]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-white/90 border border-red-100 rounded-2xl shadow-sm p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#BE322D] to-[#F16365] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-semibold tracking-wide uppercase text-[#BE322D] mb-1">
            Security Requirement
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">
            Change Temporary Password
          </h1>
          <p className="text-gray-500 text-sm">
            Signed in as <span className="font-medium text-gray-700">{session.email}</span>. Set a strong personal password before accessing the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <Input
              type={showCurrent ? 'text' : 'password'}
              placeholder="Current temporary password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setError('');
              }}
              className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
              disabled={isSaving}
              autoComplete="current-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder="New strong password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
              disabled={isSaving}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              className="h-12 pl-10 pr-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
              disabled={isSaving}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <PasswordPolicyChecklist password={newPassword} confirmPassword={confirmPassword} />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-base"
          >
            {isSaving ? 'Updating Password...' : 'Save Password & Continue'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-10 text-sm text-gray-500 hover:text-gray-800"
            onClick={onLogout}
            disabled={isSaving}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign out
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
