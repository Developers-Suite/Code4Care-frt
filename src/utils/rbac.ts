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
  | 'MANAGE_STAFF';

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
  ],
  consultant: [
    'VIEW_OVERVIEW',
    'VIEW_SUPPORT_QUEUE',
    'VIEW_CONVERSATIONS',
    'INTERVENE_CONVERSATION',
    'VIEW_SAFETY',
    'RESOLVE_SAFETY',
  ],
  coordinator: [
    'VIEW_OVERVIEW',
    'VIEW_SUPPORT_QUEUE',
    'VIEW_CONVERSATIONS',
    'VIEW_SAFETY',
    'EXPORT_REPORTS',
  ],
  viewer: [
    'VIEW_OVERVIEW',
    'VIEW_CONVERSATIONS',
    'VIEW_SAFETY',
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
};

export function hasPermission(role?: StaffRole | string, permission?: Permission): boolean {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role as StaffRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function canAccessSection(role?: StaffRole | string, section?: AdminSection): boolean {
  if (!role || !section) return false;
  const required = SECTION_REQUIRED_PERMISSIONS[section];
  if (!required) return true;
  return hasPermission(role, required);
}

export function getDefaultSectionForRole(role?: StaffRole | string): AdminSection {
  switch (role) {
    case 'consultant':
      return 'counselor-queue';
    case 'supervisor':
    case 'admin':
    case 'coordinator':
    case 'viewer':
    default:
      return 'overview';
  }
}
