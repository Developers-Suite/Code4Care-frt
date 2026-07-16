import {
  LayoutDashboard,
  Users,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  HeadphonesIcon,
  BookOpen,
  Shield,
  LogOut,
  X,
  UserCog,
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'motion/react';

export type AdminSection =
  | 'overview'
  | 'users'
  | 'conversations'
  | 'safety'
  | 'audit'
  | 'admin-accounts';

interface AdminSidebarProps {
  currentSection: AdminSection;
  setCurrentSection: (section: AdminSection) => void;
  onLogout: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  role?: string;
}

const navigationItems: {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { id: 'overview',        label: 'Overview',          icon: LayoutDashboard, desc: 'Executive summary & KPIs' },
  { id: 'users',           label: 'Users & Sessions',  icon: Users,           desc: 'Demographics & retention' },
  { id: 'conversations',   label: 'Conversations',     icon: MessageSquare,   desc: 'Chat volume & topics' },
  { id: 'safety',          label: 'Safety & Crisis',   icon: AlertTriangle,   desc: 'Crisis & escalations' },
  { id: 'audit',           label: 'Admin & Audit',     icon: Shield,          desc: 'Reports & audit log' },
  { id: 'admin-accounts',  label: 'Admin Accounts',    icon: UserCog,         desc: 'Manage staff access' },
];

export function AdminSidebar({
  currentSection,
  setCurrentSection,
  onLogout,
  isMobile = false,
  onClose,
  role,
}: AdminSidebarProps) {
  const isAdmin = role === 'admin';
  const visibleItems = navigationItems.filter(
    (item) => item.id !== 'admin-accounts' || isAdmin,
  );
  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Header */}
      <div className="p-5 border-b border-[#E8ECFF]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#BE322D] to-[#F16365] flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight text-gray-900">Lydia Contact Center</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-900">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-3">
            Analytics
          </p>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id);
                  onClose?.();
                }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full group rounded-lg px-3 py-2.5 transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FFF1F1] border border-[#F4D6D5]'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#BE322D]' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <div className="text-left flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-[#BE322D]' : 'text-gray-700'}`}>
                      {item.label}
                    </div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-[#F16365]' : 'text-gray-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="active-dot"
                      className="w-1.5 h-1.5 rounded-full bg-[#BE322D] flex-shrink-0"
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="bg-[#F4D6D5]" />

      <div className="p-3">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
