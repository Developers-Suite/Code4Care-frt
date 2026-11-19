import { StaffRole } from '@/services/staffAccessService';
import { AdminSection } from '@/components/AdminSidebar';

export type Permission =
  | 'VIEW_OVERVIEW'
  | 'VIEW_SUPPORT_QUEUE'
  | 'VIEW_CONVERSATIONS'
  | 'INTERVENE_CONVERSATION'
  | 'VIEW_USERS'
  | 'MANAGE_USERS'
  | 'VIEW_SAFETY'
  | 'RESOLVE_SAFETY'
  | 'VIEW_AUDIT'
  | 'EXPORT_REPORTS'
  | 'MANAGE_STAFF'
  | 'VIEW_SETTINGS';

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  admin: [
    'VIEW_OVERVIEW',
    'VIEW_SUPPORT_QUEUE',
    'VIEW_CONVERSATIONS',
    'INTERVENE_CONVERSATION',
    'VIEW_USERS',
    'MANAGE_USERS',
    'VIEW_SAFETY',
    'RESOLVE_SAFETY',
    'VIEW_AUDIT',
    'EXPORT_REPORTS',
    'MANAGE_STAFF',
    'VIEW_SETTINGS',
  ],
  supervisor: [
    'VIEW_OVERVIEW',
    'VIEW_SUPPORT_QUEUE',
    'VIEW_CONVERSATIONS',
    'INTERVENE_CONVERSATION',
    'VIEW_USERS',
    'MANAGE_USERS',
    'VIEW_SAFETY',
    'RESOLVE_SAFETY',
    'VIEW_AUDIT',
    'EXPORT_REPORTS',
    'VIEW_SETTINGS',
  ],
  consultant: [
    'VIEW_OVERVIEW',
    'VIEW_SUPPORT_QUEUE',
    'VIEW_CONVERSATIONS',
    'INTERVENE_CONVERSATION',
    'VIEW_SAFETY',
    'RESOLVE_SAFETY',
    'VIEW_SETTINGS',
  ],
};

const SECTION_REQUIRED_PERMISSIONS: Record<AdminSection, Permission> = {
  'overview': 'VIEW_OVERVIEW',
  'counselor-queue': 'VIEW_SUPPORT_QUEUE',
  'conversations': 'VIEW_CONVERSATIONS',
  'users': 'VIEW_USERS',
  'safety': 'VIEW_SAFETY',
  'audit': 'VIEW_AUDIT',
  'admin-accounts': 'MANAGE_STAFF',
  'settings': 'VIEW_SETTINGS',
};

export function normalizeRole(role?: string): StaffRole {
  if (!role) return 'admin';
  const clean = role.trim().toLowerCase();
  if (clean === 'counselor') return 'consultant';
    if (clean === 'admin' || clean === 'supervisor' || clean === 'consultant') {
      return clean as StaffRole;
    }
    return 'admin';
  }

  export function hasPermission(role?: StaffRole | string, permission?: Permission): boolean {
    if (!permission) return true;
    const normalized = normalizeRole(role);
    const permissions = ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS.admin;
    return permissions.includes(permission);
  }

  export function canAccessSection(role?: StaffRole | string, section?: AdminSection): boolean {
    if (!section) return true;
    const required = SECTION_REQUIRED_PERMISSIONS[section];
    if (!required) return true;
    return hasPermission(role, required);
  }

  export function getDefaultSectionForRole(role?: StaffRole | string): AdminSection {
    const normalized = normalizeRole(role);
    switch (normalized) {
      case 'consultant':
        return 'counselor-queue';
      case 'supervisor':
      case 'admin':
      default:
        return 'overview';
    }
  }
