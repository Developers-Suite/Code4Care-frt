import React from 'react';
import {
  LogOut,
  UserCog,
  Shield,
  ChevronDown,
  CheckCircle2,
  Mail,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StaffSession } from '@/services/staffAccessService';
import { AdminSection } from '../AdminSidebar';

interface UserAvatarProfileProps {
  session: StaffSession;
  onLogout: () => void;
  onNavigate?: (section: AdminSection) => void;
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'AD';
}

function getRoleBadgeColor(role?: string): { bg: string; text: string; border: string } {
  switch (role) {
    case 'admin':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'supervisor':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'consultant':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'coordinator':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export const UserAvatarProfile: React.FC<UserAvatarProfileProps> = ({
  session,
  onLogout,
  onNavigate,
}) => {
  const initials = getInitials(session.name, session.email);
  const roleColor = getRoleBadgeColor(session.role);
  const isAdmin = session.role === 'admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#BE322D]/30 border border-transparent hover:border-gray-200 cursor-pointer"
          aria-label="User profile menu"
        >
          <div className="relative">
            <Avatar className="h-8 w-8 border border-[#BE322D]/20 shadow-xs">
              <AvatarImage src="" alt={session.name || 'User profile'} />
              <AvatarFallback className="bg-gradient-to-br from-[#BE322D] to-[#F16365] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"
              title="Online"
            />
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
              {session.name || 'Staff User'}
            </div>
            <div className="text-[10px] text-gray-500 capitalize leading-tight">
              {session.role || 'Staff'}
            </div>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg border-[#E8ECFF]">
        {/* User Card Header */}
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border border-[#BE322D]/20">
              <AvatarFallback className="bg-gradient-to-br from-[#BE322D] to-[#F16365] text-white text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {session.name || 'Staff User'}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{session.email}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold px-2 py-0.5 capitalize ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}
                >
                  <Shield className="w-2.5 h-2.5 mr-1" />
                  {session.role}
                </Badge>
                <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Quick actions */}
        <div className="px-1 py-1 space-y-0.5">
          {isAdmin && onNavigate && (
            <DropdownMenuItem
              onClick={() => onNavigate('admin-accounts')}
              className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 rounded-md py-2 px-2.5 gap-2"
            >
              <UserCog className="w-3.5 h-3.5 text-gray-500" />
              Manage Staff Accounts
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="cursor-default text-xs text-gray-500 rounded-md py-1.5 px-2.5 gap-2 select-none"
          >
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">ID: {session.staffId || 'Staff'}</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md py-2 px-2.5 gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
