import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus, Pencil, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  StaffAccessService,
  StaffSession,
  AdminStaffRecord,
  StaffRole,
} from '@/services/staffAccessService';
import { logger } from '@/utils/logger';

const ROLES: StaffRole[] = ['consultant', 'supervisor', 'admin'];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  supervisor: 'bg-violet-100 text-violet-700 border-violet-200',
  consultant: 'bg-teal-100 text-teal-700 border-teal-200',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />;
}

interface FormState {
  username: string;
  email: string;
  password: string;
  role: StaffRole;
}

const BLANK: FormState = { username: '', email: '', password: '', role: 'consultant' };

interface AdminManagementPageProps {
  session: StaffSession;
}

export function AdminManagementPage({ session }: AdminManagementPageProps) {
  const [staff, setStaff] = useState<AdminStaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminStaffRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStaffRecord | null>(null);

  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await StaffAccessService.adminListStaff(session.accessToken);
      setStaff(list);
    } catch (e: any) {
      logger.error('admin management load', e);
      setError(e?.message ?? 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(BLANK); setFormError(null); setAddOpen(true); };
  const openEdit = (s: AdminStaffRecord) => {
    setForm({ username: s.username, email: s.email, password: '', role: s.role as StaffRole });
    setFormError(null);
    setEditTarget(s);
  };

  const handleSaveAdd = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Username, email and password are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await StaffAccessService.adminCreateStaff(
        { username: form.username.trim(), email: form.email.trim(), password: form.password, role: form.role },
        session.accessToken,
      );
      setStaff((prev) => [created, ...prev]);
      setAddOpen(false);
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!form.username.trim() || !form.email.trim()) {
      setFormError('Username and email are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
      };
      if (form.password.trim()) payload.password = form.password.trim();
      const updated = await StaffAccessService.adminUpdateStaff(editTarget.id, payload, session.accessToken);
      setStaff((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setEditTarget(null);
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await StaffAccessService.adminDeleteStaff(deleteTarget.id, session.accessToken);
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete account');
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const isSelf = (s: AdminStaffRecord) => s.id === session.staffId;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Accounts</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage staff access, roles and credentials</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} className="gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
              <Button size="sm" onClick={openAdd} className="gap-1.5 text-xs bg-[#BE322D] hover:bg-[#a02a25] text-white">
                <UserPlus className="w-3.5 h-3.5" /> Add Account
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <Card className="border-[#E8ECFF] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E8ECFF]">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Account</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Last Login</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Created</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#E8ECFF]">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-red-500">{error}</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No accounts found</td></tr>
                ) : staff.map((s) => (
                  <tr key={s.id} className="border-b border-[#E8ECFF] hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FFF1F1] flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#BE322D]" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {s.username}
                            {isSelf(s) && <span className="ml-1.5 text-[10px] text-gray-400">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                        <Badge className={`text-[10px] capitalize ${ROLE_COLORS[s.role] ?? ROLE_COLORS.consultant}`}>
                          {s.role.replace(/_/g, ' ')}
                        </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.is_active ? (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {s.last_login_at ? new Date(s.last_login_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          disabled={isSelf(s)}
                          onClick={() => !isSelf(s) && setDeleteTarget(s)}
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isSelf(s) ? 'text-gray-300' : 'text-red-400'}`} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && staff.length > 0 && (
            <div className="px-4 py-3 border-t border-[#E8ECFF] text-xs text-gray-400">
              {staff.length} account{staff.length !== 1 ? 's' : ''}
            </div>
          )}
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!saving) setAddOpen(o); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin Account</DialogTitle>
          </DialogHeader>
          <StaffForm form={form} setForm={setForm} showPassword requiredPassword formError={formError} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveAdd} disabled={saving} className="bg-[#BE322D] hover:bg-[#a02a25] text-white">
              {saving ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!saving && !o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account — {editTarget?.username}</DialogTitle>
          </DialogHeader>
          <StaffForm form={form} setForm={setForm} showPassword={false} requiredPassword={false} formError={formError} />
          <div className="px-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE322D]/30"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="bg-[#BE322D] hover:bg-[#a02a25] text-white">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deleteTarget?.username}</strong> ({deleteTarget?.email}). They will no longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StaffForm({
  form, setForm, showPassword, requiredPassword, formError,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  showPassword: boolean;
  requiredPassword: boolean;
  formError: string | null;
}) {
  return (
    <div className="space-y-3 py-1">
      {formError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          placeholder="johndoe"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE322D]/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="john@example.com"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE322D]/30"
        />
      </div>
      {showPassword && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Password {requiredPassword && <span className="text-red-500">*</span>}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Min. 8 characters"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE322D]/30"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE322D]/30 bg-white"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
