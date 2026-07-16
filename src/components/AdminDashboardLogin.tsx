import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion } from 'motion/react';
import { Lock, Mail, Shield, ChevronRight } from 'lucide-react';
import { StaffAccessService, StaffSession } from '@/services/staffAccessService';

interface AdminDashboardLoginProps {
  onAdminLogin: (session: StaffSession) => void;
}

export function AdminDashboardLogin({ onAdminLogin }: AdminDashboardLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const session = await StaffAccessService.login(email, password);
      onAdminLogin(session);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid credentials, inactive account, or role not permitted.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <Shield className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-semibold tracking-wide uppercase text-[#BE322D] mb-1">Lydia Contact Center</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Staff Dashboard Login</h1>
            <p className="text-gray-500 text-sm">Secure access for Admin and Support Consultant accounts.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input
                type="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input
                type="password"
                placeholder="Account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="h-12 pl-10 rounded-xl border-gray-200 focus:border-[#BE322D]"
                disabled={isLoading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-[#BE322D] to-[#F16365] hover:from-[#9F2622] hover:to-[#DD575A] text-lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Verifying...
                </div>
              ) : (
                <>
                  Access Dashboard
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 pt-2">
              Use the admin credentials provisioned by the Code4Care backend.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
