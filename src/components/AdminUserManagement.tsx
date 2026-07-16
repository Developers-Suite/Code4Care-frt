import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Check,
  X,
  Users,
  UserCheck,
  UserMinus,
  UserX,
  Briefcase,
  ShieldCheck,
  Download,
  Send,
  MessageCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  StaffAccessService,
  StaffAccount,
  StaffRole,
  StaffSession,
} from '@/services/staffAccessService';
import {
  UserChatHistoryResponse,
  UserDetails,
  UserListItem,
  UserManagementService,
  UserStatus,
} from '@/services/userManagementService';
import { logger } from '@/utils/logger';
import { buildAdminExportFilename, downloadJsonFile } from '@/utils/adminExport';

function getPlatformInfo(id: string): { platform: 'telegram' | 'whatsapp' | 'web'; label: string } {
  if (id.startsWith('telegram:')) return { platform: 'telegram', label: 'Telegram' };
  if (id.startsWith('whatsapp:')) return { platform: 'whatsapp', label: 'WhatsApp' };
  return { platform: 'web', label: 'Web' };
}

function PlatformBadge({ id }: { id: string }) {
  const { platform, label } = getPlatformInfo(id);
  if (platform === 'telegram') {
    return (
      <Badge className="bg-sky-50 text-sky-700 border-sky-200 gap-1 text-xs py-0">
        <Send className="w-3 h-3" />{label}
      </Badge>
    );
  }
  if (platform === 'whatsapp') {
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200 gap-1 text-xs py-0">
        <MessageCircle className="w-3 h-3" />{label}
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-50 text-slate-600 border-slate-200 gap-1 text-xs py-0">
      <Globe className="w-3 h-3" />{label}
    </Badge>
  );
}

interface AdminUserManagementProps {
  selectedLanguage: string;
  session: StaffSession;
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  role: 'consultant' as StaffRole,
  password: '',
};

export function AdminUserManagement({ selectedLanguage, session }: AdminUserManagementProps) {
  void selectedLanguage;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'active_suspended'>('all');
  const [filterStaffStatus, setFilterStaffStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPages, setUsersPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({ active: 0, inactive: 0, suspended: 0 });
  const PAGE_SIZE = 50;
  const [staff, setStaff] = useState<StaffAccount[]>(() => StaffAccessService.getStaffAccounts());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);
  const [deleteStaffName, setDeleteStaffName] = useState('');
  const [deleteStaffPassword, setDeleteStaffPassword] = useState('');
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);
  const [deleteStaffError, setDeleteStaffError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetails | null>(null);
  const [selectedUserChat, setSelectedUserChat] = useState<UserChatHistoryResponse | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
  const [isLoadingUserChat, setIsLoadingUserChat] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');
  const [nextStatus, setNextStatus] = useState<UserStatus>('active');
  const [statusReason, setStatusReason] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [deleteReason, setDeleteReason] = useState<'user_request' | 'gdpr' | 'safety'>('safety');
  const [deleteConfirmationCode, setDeleteConfirmationCode] = useState('');

  const closeUserModal = () => {
    setUserModalOpen(false);
    setSelectedUserId(null);
    setSelectedUserDetails(null);
    setSelectedUserChat(null);
    setUserActionError('');
    setUserActionSuccess('');
    setNextStatus('active');
    setStatusReason('');
    setFollowUpNotes('');
    setDeleteReason('safety');
    setDeleteConfirmationCode('');
  };

  const formatDateTime = (value?: string) => {
    if (!value) {
      return 'N/A';
    }

    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  };

  const loadStaff = async () => {
    try {
      setStaff(await StaffAccessService.listStaff(session.accessToken));
    } catch (error) {
      logger.error('Failed to load staff', error);
    }
  };

  const loadUsers = async (search?: string, page?: number) => {
    const targetPage = page ?? currentPage;
    setIsLoadingUsers(true);
    try {
      const response = await UserManagementService.listUsers(
        {
          page: targetPage,
          limit: PAGE_SIZE,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: search || undefined,
        },
        session.accessToken
      );
      setUsers(response.users);
      setUsersTotal(response.total ?? response.users.length);
      setUsersPages(response.pages ?? 1);
      setCurrentPage(targetPage);
      if (response.status_counts) setStatusCounts(response.status_counts);
    } catch (error) {
      logger.error('Failed to load users', error);
      setUsers([]);
      setUsersTotal(0);
      setUsersPages(1);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleViewUser = async (user: UserListItem) => {
    setUserModalOpen(true);
    setSelectedUserId(user.id);
    setSelectedUserDetails(null);
    setSelectedUserChat(null);
    setUserActionError('');
    setUserActionSuccess('');
    setNextStatus(user.status);
    setStatusReason('');
    setFollowUpNotes('');
    setDeleteReason('safety');
    setDeleteConfirmationCode('');

    setIsLoadingUserDetails(true);
    setIsLoadingUserChat(true);

    try {
      const [details, chatHistory] = await Promise.all([
        UserManagementService.getUserDetails(user.id, session.accessToken),
        UserManagementService.getUserChatHistory(user.id, { limit: 500, offset: 0 }, session.accessToken),
      ]);

      setSelectedUserDetails(details);
      setSelectedUserChat(chatHistory);
      setNextStatus(details.status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load user details.';
      setUserActionError(message);
      logger.error(`Failed to load user action panel for ${user.id}`, error);
    } finally {
      setIsLoadingUserDetails(false);
      setIsLoadingUserChat(false);
    }
  };

  const handleUpdateUserStatus = async () => {
    if (!selectedUserId) {
      return;
    }

    const trimmedReason = statusReason.trim();
    const trimmedFollowUp = followUpNotes.trim();
    const currentStatus = selectedUserDetails?.status;
    const statusChanged = currentStatus ? currentStatus !== nextStatus : true;

    if (statusChanged && !trimmedReason) {
      setUserActionError('Add a reason for changing user status.');
      return;
    }

    setIsUpdatingUser(true);
    setUserActionError('');
    setUserActionSuccess('');

    try {
      const response = await UserManagementService.updateUser(
        selectedUserId,
        {
          status: nextStatus,
          reason_for_change: trimmedReason || undefined,
          follow_up_notes: trimmedFollowUp || undefined,
          follow_up_required: Boolean(trimmedFollowUp),
        },
        session.accessToken,
      );

      setUserActionSuccess(`User status updated to ${response.status}.`);

      // Apply immediate UI state so successful updates are reflected even if background refresh fails.
      setUsers((prev) => prev.map((user) => (user.id === selectedUserId ? { ...user, status: response.status } : user)));
      setSelectedUserDetails((prev) => (prev ? { ...prev, status: response.status } : prev));
      setNextStatus(response.status);

      try {
        await loadUsers(searchTerm || undefined, currentPage);
      } catch (refreshError) {
        logger.error('Users list refresh failed after status update', refreshError);
      }

      try {
        const refreshedDetails = await UserManagementService.getUserDetails(selectedUserId, session.accessToken);
        setSelectedUserDetails(refreshedDetails);
        setNextStatus(refreshedDetails.status);
      } catch (refreshError) {
        logger.error(`User details refresh failed after updating ${selectedUserId}`, refreshError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update user status.';
      setUserActionError(message);
      logger.error(`Failed to update user ${selectedUserId}`, error);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) {
      return;
    }

    if (!deleteConfirmationCode.trim()) {
      setUserActionError('Enter a confirmation code before deleting this user.');
      return;
    }

    setIsDeletingUser(true);
    setUserActionError('');
    setUserActionSuccess('');

    try {
      await UserManagementService.deleteUser(
        selectedUserId,
        {
          reason: deleteReason,
          confirmation_code: deleteConfirmationCode.trim(),
        },
        session.accessToken,
      );

      setUserActionSuccess('User deleted successfully.');
      await loadUsers(searchTerm || undefined, currentPage);
      closeUserModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete user.';
      setUserActionError(message);
      logger.error(`Failed to delete user ${selectedUserId}`, error);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Track whether the initial load has already run so that filter/search effects
  // don't fire an extra request on mount (their dependencies change at the same time).
  const initialLoadDone = useRef(false);

  useEffect(() => {
    void loadStaff();
    void loadUsers(undefined, 1);
    initialLoadDone.current = true;
  }, [session.accessToken]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    void loadUsers(searchTerm || undefined, 1);
  }, [filterStatus]);

  useEffect(() => {
    void loadStaff();
  }, [filterStaffStatus]);
  // Debounce search: send to backend after 400ms of no typing
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timer = setTimeout(() => {
      void loadUsers(searchTerm || undefined, 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      // Client-side secondary filter for instant feedback within loaded results
      filtered = filtered.filter((u) =>
        u.nickname.toLowerCase().includes(q) ||
        u.age_range.includes(q) ||
        u.id.toLowerCase().includes(q) ||
        getPlatformInfo(u.id).label.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => b.engagement_score - a.engagement_score);

    return filtered;
  }, [users, searchTerm]);

  const handleAddStaff = () => {
    setEditingStaffId(null);
    setFormData(initialForm);
    setSaveError('');
    setStaffModalOpen(true);
  };

  const handleEditStaff = (member: StaffAccount) => {
    setEditingStaffId(member.id);
    setSaveError('');
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      password: '',
    });
    setStaffModalOpen(true);
  };

  const handleSaveStaff = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    if (!editingStaffId && !formData.password.trim()) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      if (editingStaffId) {
        await StaffAccessService.updateStaffAccount(editingStaffId, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          isActive: true,
        }, session.accessToken);

        if (formData.password.trim()) {
          await StaffAccessService.resetStaffPassword(editingStaffId, formData.password.trim(), session.accessToken);
        }

        StaffAccessService.upsertStaffAccount({
          id: editingStaffId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
        });
      } else {
        await StaffAccessService.createStaffAccount(
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: formData.role,
            password: formData.password.trim(),
          },
          session.accessToken,
        );
      }

      setStaffModalOpen(false);
      setFormData(initialForm);
      void loadStaff();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestDeleteStaff = (member: StaffAccount) => {
    setDeleteStaffId(member.id);
    setDeleteStaffName(member.name);
    setDeleteStaffPassword('');
    setDeleteStaffError('');
  };

  const isDeactivatingStaff = (): boolean => {
    if (!deleteStaffId) return false;
    const member = staff.find((s) => s.id === deleteStaffId);
    return member?.status === 'active';
  };

  const closeDeleteStaffDialog = () => {
    setDeleteStaffId(null);
    setDeleteStaffName('');
    setDeleteStaffPassword('');
    setDeleteStaffError('');
    setIsDeletingStaff(false);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!deleteStaffId) {
      return;
    }

    const password = deleteStaffPassword.trim();
    if (!password) {
      setDeleteStaffError('Enter the admin password to confirm deletion.');
      return;
    }

    setIsDeletingStaff(true);
    setDeleteStaffError('');

    try {
      const targetStaff = staff.find((member) => member.id === deleteStaffId);
      if (!targetStaff) {
        throw new Error('Staff member not found.');
      }

      const reauthenticatedSession = await StaffAccessService.login(session.email, password);
      const isDeactivating = targetStaff.status === 'active';

      if (isDeactivating) {
        await StaffAccessService.updateStaffAccount(
          deleteStaffId,
          {
            name: targetStaff.name,
            email: targetStaff.email,
            role: targetStaff.role,
            isActive: false,
          },
          reauthenticatedSession.accessToken || session.accessToken,
        );
      } else {
        await StaffAccessService.deleteStaffAccount(deleteStaffId, reauthenticatedSession.accessToken || session.accessToken);
      }
      await loadStaff();
      closeDeleteStaffDialog();
    } catch (error) {
      const action = isDeactivatingStaff() ? 'deactivate' : 'delete';
      setDeleteStaffError(error instanceof Error ? error.message : `Unable to ${action} staff member.`);
      setIsDeletingStaff(false);
    }
  };

  const stats = {
    total: statusCounts.active + statusCounts.inactive + statusCounts.suspended || usersTotal,
    active: statusCounts.active,
    inactive: statusCounts.inactive,
    suspended: statusCounts.suspended,
    staffActive: staff.filter((s) => s.status === 'active').length,
    staffTotal: staff.length,
  };

  const userStats = [
    { label: 'Total Users', value: stats.total, icon: Users, iconClass: 'text-[#BE322D]' },
    { label: 'Active', value: stats.active, icon: UserCheck, iconClass: 'text-green-600' },
    { label: 'Inactive', value: stats.inactive, icon: UserMinus, iconClass: 'text-yellow-600' },
    { label: 'Suspended', value: stats.suspended, icon: UserX, iconClass: 'text-red-600' },
  ];

  const staffStats = [
    { label: 'Total Staff', value: stats.staffTotal, icon: Briefcase, iconClass: 'text-[#BE322D]' },
    { label: 'Active', value: stats.staffActive, icon: UserCheck, iconClass: 'text-green-600' },
    { label: 'Inactive', value: staff.filter((s) => s.status === 'inactive').length, icon: UserMinus, iconClass: 'text-slate-600' },
  ];

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'suspended':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleExport = () => {
    downloadJsonFile(buildAdminExportFilename('user-management'), {
      section: 'user-management',
      generatedAt: new Date().toISOString(),
      stats,
      users: filteredUsers,
      staff,
    });
  };

  return (
    <div className="space-y-6 p-6 bg-white min-h-screen">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">User & Staff Management</h1>
          <p className="text-gray-500">Monitor user accounts and manage staff access.</p>
        </div>
        <Button variant="outline" className="gap-2 border-[#F4D6D5] hover:bg-[#FFF1F1] text-[#BE322D]" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-[#F4D6D5]">
          <TabsTrigger value="users">Users ({stats.total})</TabsTrigger>
          <TabsTrigger value="staff">Staff Access ({stats.staffTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {userStats.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className="p-4 bg-white border-[#F4D6D5]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    </div>
                    <stat.icon className={`w-6 h-6 ${stat.iconClass}`} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-[#F4D6D5] bg-white overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-3 p-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by nickname or platform..."
                  className="pl-9 bg-gray-50 border-[#F4D6D5] text-gray-900 placeholder:text-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-4 py-2 rounded-lg bg-white border border-[#F4D6D5] text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="active_suspended">Active & Suspended</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#F4D6D5] hover:bg-transparent">
                    <TableHead className="text-gray-600">Nickname</TableHead>
                    <TableHead className="text-gray-600">Platform</TableHead>
                    <TableHead className="text-gray-600">Age</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Engagement</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-[#F4D6D5] hover:bg-gray-50 transition-colors">
                        <TableCell className="text-gray-900 font-medium">{user.nickname}</TableCell>
                        <TableCell><PlatformBadge id={user.id} /></TableCell>
                        <TableCell className="text-gray-600 text-sm">{user.age_range}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getUserStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{user.total_messages} messages</span>
                              <Badge className={
                                user.total_messages === 0
                                  ? 'bg-slate-50 text-slate-500 border-slate-200 text-xs'
                                  : user.engagement_score >= 80
                                    ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                                    : user.engagement_score >= 50
                                      ? 'bg-[#FFF1F1] text-[#BE322D] border-[#F4D6D5] text-xs'
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200 text-xs'
                              }>
                                {user.total_messages === 0 ? 'No Activity' : user.engagement_score >= 80 ? 'Very Active' : user.engagement_score >= 50 ? 'Active' : 'Low'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#BE322D] to-[#F16365]" style={{ width: `${user.engagement_score}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{user.engagement_score}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[#BE322D] hover:text-[#9F2622] hover:bg-[#FFF1F1]"
                            onClick={() => handleViewUser(user)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {usersPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8ECFF]">
                <p className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, usersTotal)} of {usersTotal} users
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#F4D6D5]"
                    disabled={currentPage <= 1 || isLoadingUsers}
                    onClick={() => void loadUsers(searchTerm || undefined, currentPage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {Array.from({ length: usersPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === usersPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '…' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === currentPage ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 w-8 p-0 ${p === currentPage ? 'bg-[#BE322D] text-white' : 'border-[#F4D6D5] text-gray-600'}`}
                          disabled={isLoadingUsers}
                          onClick={() => void loadUsers(searchTerm || undefined, p as number)}
                        >
                          {p}
                        </Button>
                      )
                    )
                  }

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-[#F4D6D5]"
                    disabled={currentPage >= usersPages || isLoadingUsers}
                    onClick={() => void loadUsers(searchTerm || undefined, currentPage + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Single-page count */}
            {usersPages <= 1 && usersTotal > 0 && (
              <div className="px-4 py-3 border-t border-[#E8ECFF]">
                <p className="text-sm text-gray-500">Showing {users.length} of {usersTotal} users</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {staffStats.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className="p-4 bg-white border-[#E8ECFF]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    </div>
                    <stat.icon className={`w-6 h-6 ${stat.iconClass}`} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Badge className="bg-blue-50 text-blue-600 border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Admin can provision dashboard access credentials here.
            </Badge>
            <Button onClick={handleAddStaff} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </div>

          <Card className="border-[#E8ECFF] bg-white overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-[#E8ECFF]">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStaffStatus}
                onChange={(e) => setFilterStaffStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-4 py-2 rounded-lg bg-white border border-[#E8ECFF] text-gray-900"
              >
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="all">All Staff</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E8ECFF] hover:bg-transparent">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Role</TableHead>
                    <TableHead className="text-gray-600">Email</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Trained</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.filter((member) => filterStaffStatus === 'all' || member.status === filterStaffStatus).map((member) => (
                      <TableRow key={member.id} className="border-[#E8ECFF] hover:bg-gray-50 transition-colors">
                        <TableCell className="text-gray-900 font-medium">{member.name}</TableCell>
                        <TableCell className="text-gray-600 capitalize text-sm">{member.role}</TableCell>
                        <TableCell className="text-gray-600 text-sm">{member.email}</TableCell>
                        <TableCell>
                          <Badge className={member.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.trained ? (
                            <Badge className="bg-green-50 text-green-600 border-green-200"><Check className="w-3 h-3 mr-1" />Yes</Badge>
                          ) : (
                            <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200"><X className="w-3 h-3 mr-1" />Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {member.status === 'active' ? (
                              <>
                                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditStaff(member)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRequestDeleteStaff(member)}>
                                  Deactivate
                                </Button>
                              </>
                            ) : (
                              <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRequestDeleteStaff(member)}>
                                Delete Permanently
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {staffModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setStaffModalOpen(false)}
        >
          <Card className="bg-white p-6 max-w-md w-full mx-4 border-[#E8ECFF]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingStaffId ? 'Edit Staff Member' : 'Add Staff Member'}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" className="bg-gray-50 border-[#E8ECFF] text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@lydiacontactcenter.org" className="bg-gray-50 border-[#E8ECFF] text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+233 XX XXX XXXX" className="bg-gray-50 border-[#E8ECFF] text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-[#E8ECFF] text-gray-900">
                  <option value="consultant">Consultant</option>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="coordinator">Coordinator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingStaffId ? 'Reset Password (optional)' : 'Password'}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingStaffId ? 'Leave blank to keep current password' : 'Set account password'}
                  className="bg-gray-50 border-[#E8ECFF] text-gray-900"
                />
              </div>

              {saveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1 border-gray-300" onClick={() => setStaffModalOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveStaff} disabled={isSaving}>
                {isSaving ? 'Saving...' : editingStaffId ? 'Update' : 'Create'} Account
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {userModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeUserModal}
        >
          <Card className="bg-white p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-[#E8ECFF]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <p className="text-sm text-gray-500">Inspect profile, status, and chat activity.</p>
              </div>
              <Button variant="outline" onClick={closeUserModal}>
                Close
              </Button>
            </div>

            {userActionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
                {userActionError}
              </div>
            )}

            {userActionSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 mb-4">
                {userActionSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card className="border-[#E8ECFF] p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Profile</h4>
                  {isLoadingUserDetails ? (
                    <p className="text-sm text-gray-500">Loading user details...</p>
                  ) : selectedUserDetails ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Nickname</span><span className="text-gray-900 font-medium">{selectedUserDetails.nickname}</span></div>
                      {selectedUserId && <div className="flex justify-between gap-4"><span className="text-gray-500">Platform</span><PlatformBadge id={selectedUserId} /></div>}
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Status</span><Badge variant="outline" className={getUserStatusColor(selectedUserDetails.status)}>{selectedUserDetails.status}</Badge></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Age range</span><span className="text-gray-900">{selectedUserDetails.age_range || 'N/A'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Gender</span><span className="text-gray-900">{selectedUserDetails.gender_identity || 'N/A'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Region</span><span className="text-gray-900">{selectedUserDetails.region || 'N/A'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Language</span><span className="text-gray-900 uppercase">{selectedUserDetails.language || 'N/A'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Created</span><span className="text-gray-900">{formatDateTime(selectedUserDetails.created_at)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-gray-500">Last active</span><span className="text-gray-900">{formatDateTime(selectedUserDetails.last_active)}</span></div>
                      {selectedUserDetails.statistics && (
                        <>
                          <div className="border-t border-[#E8ECFF] my-1" />
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Sessions</span><span className="text-gray-900">{selectedUserDetails.statistics.total_sessions ?? 0}</span></div>
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Messages</span><span className="text-gray-900">{selectedUserDetails.statistics.total_messages ?? 0}</span></div>
                        </>
                      )}
                      {selectedUserDetails.safety_profile && (
                        <>
                          <div className="border-t border-[#E8ECFF] my-1" />
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Panic events</span><span className={`font-medium ${(selectedUserDetails.safety_profile as any).panic_button_used > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{(selectedUserDetails.safety_profile as any).panic_button_used ?? 0}</span></div>
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Crisis flags</span><span className={`font-medium ${(selectedUserDetails.safety_profile as any).crisis_flags > 0 ? 'text-red-600' : 'text-gray-900'}`}>{(selectedUserDetails.safety_profile as any).crisis_flags ?? 0}</span></div>
                          <div className="flex justify-between gap-4"><span className="text-gray-500">Escalations</span><span className={`font-medium ${(selectedUserDetails.safety_profile as any).escalations > 0 ? 'text-purple-600' : 'text-gray-900'}`}>{(selectedUserDetails.safety_profile as any).escalations ?? 0}</span></div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No user details available.</p>
                  )}
                </Card>

                <Card className="border-[#E8ECFF] p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Update Status</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as UserStatus)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-[#E8ECFF] text-gray-900"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for change</label>
                    <Input
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Reason for status update"
                      className="bg-gray-50 border-[#E8ECFF] text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up notes</label>
                    <textarea
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Optional notes"
                      className="w-full min-h-20 px-3 py-2 rounded-lg bg-gray-50 border border-[#E8ECFF] text-gray-900"
                    />
                  </div>
                  <Button onClick={handleUpdateUserStatus} disabled={isUpdatingUser || !selectedUserId} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isUpdatingUser ? 'Updating...' : 'Update User'}
                  </Button>
                </Card>

                <Card className="border-red-200 p-4 space-y-3 bg-red-50/30">
                  <h4 className="font-semibold text-red-700">Delete User (GDPR)</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delete reason</label>
                    <select
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value as 'user_request' | 'gdpr' | 'safety')}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-red-200 text-gray-900"
                    >
                      <option value="safety">Safety</option>
                      <option value="user_request">User Request</option>
                      <option value="gdpr">GDPR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation code</label>
                    <Input
                      value={deleteConfirmationCode}
                      onChange={(e) => setDeleteConfirmationCode(e.target.value)}
                      placeholder="Enter confirmation code"
                      className="bg-white border-red-200 text-gray-900"
                    />
                  </div>
                  <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingUser || !selectedUserId}>
                    {isDeletingUser ? 'Deleting...' : 'Delete User'}
                  </Button>
                </Card>
              </div>

              <Card className="border-[#E8ECFF] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Recent Chat History</h4>
                  {selectedUserChat && selectedUserChat.total_messages > 0 && (
                    <span className="text-xs text-gray-500">
                      {(selectedUserChat.messages?.length ?? 0) >= selectedUserChat.total_messages
                        ? `${selectedUserChat.total_messages} messages`
                        : `Showing ${selectedUserChat.messages?.length ?? 0} of ${selectedUserChat.total_messages} messages`}
                    </span>
                  )}
                </div>
                {isLoadingUserChat ? (
                  <p className="text-sm text-gray-500">Loading chat history...</p>
                ) : selectedUserChat && selectedUserChat.messages?.length ? (
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                    {selectedUserChat.messages.map((message) => {
                      const isBot = message.role === 'assistant' || message.role === 'consultant';
                      return (
                        <div key={message.id} className="rounded-lg border border-[#E8ECFF] p-3 bg-white">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge className={isBot ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                              {isBot ? 'Assistant' : 'User'}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatDateTime(message.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.message}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No chat history available.</p>
                )}
              </Card>
            </div>
          </Card>
        </motion.div>
      )}

      <AlertDialog open={Boolean(deleteStaffId)} onOpenChange={(open) => !open && closeDeleteStaffDialog()}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{isDeactivatingStaff() ? 'Deactivate staff member?' : 'Permanently delete staff member?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isDeactivatingStaff() 
                ? `This will keep ${deleteStaffName || 'this staff member'} in the system but make the account inactive. Enter the admin password to confirm.`
                : `This will permanently remove ${deleteStaffName || 'this staff member'} from the system. This cannot be undone. Enter the admin password to confirm.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Admin password</label>
            <Input
              type="password"
              value={deleteStaffPassword}
              onChange={(e) => setDeleteStaffPassword(e.target.value)}
              placeholder="Enter admin password"
              className="bg-white border-[#E8ECFF] text-gray-900"
            />
            {deleteStaffError && <p className="text-sm text-red-600">{deleteStaffError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={closeDeleteStaffDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteStaff}
              className="rounded-xl bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeletingStaff}
            >
              {isDeletingStaff ? (isDeactivatingStaff() ? 'Deactivating...' : 'Deleting...') : (isDeactivatingStaff() ? 'Deactivate Staff' : 'Delete Permanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
