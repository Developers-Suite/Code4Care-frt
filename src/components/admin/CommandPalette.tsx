import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  LayoutDashboard,
  Headphones,
  Users,
  MessageSquare,
  AlertTriangle,
  Shield,
  UserCog,
  LogOut,
  Command,
  Settings,
} from 'lucide-react';
import { AdminSection } from '../AdminSidebar';
import { canAccessSection } from '@/utils/rbac';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: AdminSection) => void;
  onLogout: () => void;
  role?: string;
}

interface CommandItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  category: 'Navigation' | 'Actions';
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
  role,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigationOptions: {
    id: AdminSection;
    label: string;
    desc: string;
    icon: React.ElementType;
  }[] = [
    { id: 'overview',        label: 'Overview',          desc: 'KPI metrics & analytics snapshot',     icon: LayoutDashboard },
    { id: 'counselor-queue', label: 'Support Queue',     desc: 'Live WhatsApp counselor takeover',      icon: Headphones },
    { id: 'conversations',   label: 'Conversations',     desc: 'Chat history & live transcripts',       icon: MessageSquare },
    { id: 'users',           label: 'Users & Sessions',  desc: 'User demographics & engagement',       icon: Users },
    { id: 'safety',          label: 'Safety & Crisis',   desc: 'Crisis triggers & intervention flags', icon: AlertTriangle },
    { id: 'audit',           label: 'Admin & Audit',     desc: 'System activity & report exports',     icon: Shield },
    { id: 'settings',        label: 'Settings',          desc: 'Account, security & preferences',      icon: Settings },
    { id: 'admin-accounts',  label: 'Admin Accounts',    desc: 'Staff permissions & access control',   icon: UserCog },
  ];

  const items: CommandItem[] = useMemo(() => {
    const userRole = role || 'admin';
    const list: CommandItem[] = [];

    // Filter navigation based on RBAC
    navigationOptions.forEach((nav) => {
      if (canAccessSection(userRole, nav.id)) {
        list.push({
          id: nav.id,
          label: nav.label,
          desc: nav.desc,
          icon: nav.icon,
          category: 'Navigation',
          action: () => {
            onNavigate(nav.id);
            onClose();
          },
        });
      }
    });

    // Quick actions
    list.push({
      id: 'sign-out',
      label: 'Sign Out',
      desc: 'End active staff session',
      icon: LogOut,
      category: 'Actions',
      action: () => {
        onClose();
        onLogout();
      },
    });

    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [role, query, onNavigate, onClose, onLogout]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (items.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-gray-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search sections, actions... (↑↓ to select, Enter to open)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No matching sections or actions found.
              </div>
            ) : (
              items.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF1F1] text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#BE322D] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#BE322D]' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-0.5 bg-gray-100 rounded flex-shrink-0">
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" /> Staff Command Palette
            </span>
            <div className="flex items-center gap-2">
              <span>Navigate: <strong>↑↓</strong></span>
              <span>Open: <strong>↵</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
