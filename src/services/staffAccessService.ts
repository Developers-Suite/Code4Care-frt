import { safeStorage } from '@/utils/safeStorage';
import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';

export type StaffRole = 'admin' | 'consultant' | 'supervisor' | 'coordinator' | 'viewer';
export type StaffStatus = 'active' | 'inactive';
export type StaffAvailability = 'available' | 'busy' | 'offline';
export type SupportRequestStatus = 'waiting' | 'assigned' | 'active' | 'resolved';

export interface StaffAccount {
  id: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  availability: StaffAvailability;
  email: string;
  phone: string;
  joinDate: string;
  trained: boolean;
  currentLoad: number;
  password: string;
}

export interface SupportRequest {
  id: string;
  userId: string;
  userNickname: string;
  userAge: string;
  requestedAt: string;
  status: SupportRequestStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  duration?: number;
}

export interface StaffSession {
  staffId: string;
  name: string;
  role: StaffRole;
  email: string;
  loginAt: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: AdminLoginUser;
}

export interface AdminLoginUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AdminLoginUser;
}

export interface AdminCreateStaffRequest {
  username: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface AdminUpdateStaffRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: StaffRole;
  is_active?: boolean;
}

export interface AdminStaffRecord {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string;
}

export interface AdminStaffListResponse {
  staff: AdminStaffRecord[];
  total: number;
}

export interface AdminDashboardStats {
  total_conversations: number;
  active_sessions_today: number;
  total_messages: number;
  messages_today: number;
  avg_response_time_ms: number;
  safety_flags_today: number;
  escalations_today: number;
  feedback_positive: number;
  feedback_negative: number;
  pending_reports: number;
}


export interface AdminStaffPasswordResetRequest {
  temporary_password: string;
}

export interface AdminStaffPasswordResetResponse {
  id: string;
  password_reset: boolean;
  reset_at: string;
  notification_sent: boolean;
  notification_method: string;
}

export interface AdminStaffAvailabilityRequest {
  availability: StaffAvailability;
  reason?: string;
  until?: string;
}

export interface AdminStaffAvailabilityResponse {
  id: string;
  availability: StaffAvailability | string;
  changed_at: string;
  active_sessions: number;
  queued_requests: number;
}

export interface AdminConversationListItem {
  id: string;
  session_id: string;
  user_nickname?: string;
  platform?: string;
  language: string;
  message_count: number;
  created_at: string;
  last_active_at: string;
  ended_at?: string | null;
  is_escalated: boolean;
  has_safety_flags: boolean;
  has_crisis?: boolean;
  has_panic?: boolean;
  crisis_types?: string[];
}

export interface AdminConversationListResponse {
  conversations: AdminConversationListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminConversationMessage {
  id: string;
  sender: string;
  content: string;
  language_detected: string;
  safety_flags: string[];
  citations: Record<string, unknown>[];
  response_time_ms: number;
  created_at: string;
}

export interface AdminConversationDetail {
  id: string;
  session_id: string;
  language: string;
  created_at: string;
  last_active_at: string;
  is_escalated: boolean;
  auto_delete_period: string;
  auto_delete_at: string;
  messages: AdminConversationMessage[];
}

export interface AdminListConversationsOptions {
  page?: number;
  page_size?: number;
  is_escalated?: boolean | null;
  has_crisis?: boolean | null;
}

export interface AdminFeedbackItem {
  id: string;
  session_id: string;
  message_id: string;
  rating: number;
  comment: string;
  created_at: string;
  message_content: string;
}

export interface AdminFeedbackListResponse {
  feedback: AdminFeedbackItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminListFeedbackOptions {
  page?: number;
  page_size?: number;
  rating?: 1 | 2 | 3 | 4 | 5 | null;
}

export interface AdminReportItem {
  id: string;
  session_id: string;
  message_id: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_by: string;
  reviewed_at: string;
  resolution_notes: string;
  message_content: string;
}

export interface AdminReportListResponse {
  reports: AdminReportItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminListReportsOptions {
  page?: number;
  page_size?: number;
  status_filter?: string | null;
}

export interface AdminUpdateReportRequest {
  status: string;
  resolution_notes?: string;
}

const STAFF_ACCOUNTS_KEY = 'lydiacontactcenter_staff_accounts';
const SUPPORT_REQUESTS_KEY = 'lydiacontactcenter_support_requests';
const SESSION_KEY = 'lydiacontactcenter_staff_session';
const ADMIN_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_ME_PATH = '/admin/me';
const ADMIN_CREATE_STAFF_PATH = '/admin/staff';
function normalizeRole(role: string): StaffRole {
  if (role === 'counselor') {
    return 'consultant';
  }

  if (role === 'admin' || role === 'consultant' || role === 'supervisor' || role === 'coordinator' || role === 'viewer') {
    return role;
  }

  return 'consultant';
}

function canAccessDashboard(role: StaffRole) {
  return role === 'admin' || role === 'consultant' || role === 'supervisor' || role === 'coordinator';
}

function normalizeAvailability(availability: string): StaffAvailability {
  if (availability === 'available' || availability === 'busy' || availability === 'offline') {
    return availability;
  }

  return 'offline';
}

const defaultStaffAccounts: StaffAccount[] = [
  {
    id: 'staff-admin-1',
    name: 'System Admin',
    role: 'admin',
    status: 'active',
    availability: 'available',
    email: 'admin@lydiacontactcenter.org',
    phone: '+233 30 200 0001',
    joinDate: '2025-01-01',
    trained: true,
    currentLoad: 0,
    password: '',
  },
  {
    id: 'staff-consultant-1',
    name: 'Sarah Johnson',
    role: 'consultant',
    status: 'active',
    availability: 'available',
    email: 'sarah@lydiacontactcenter.org',
    phone: '+233 24 123 4567',
    joinDate: '2025-01-15',
    trained: true,
    currentLoad: 0,
    password: '',
  },
  {
    id: 'staff-supervisor-1',
    name: 'David Mensah',
    role: 'supervisor',
    status: 'active',
    availability: 'busy',
    email: 'david@lydiacontactcenter.org',
    phone: '+233 55 234 5678',
    joinDate: '2024-12-01',
    trained: true,
    currentLoad: 0,
    password: '',
  },
];

const defaultSupportRequests: SupportRequest[] = [
  { id: 'req-1', userId: '1', userNickname: 'SilentThinker', userAge: '16-18', requestedAt: '2 mins ago', status: 'active', assignedStaffId: 'staff-consultant-1', assignedStaffName: 'Sarah Johnson', duration: 2 },
  { id: 'req-2', userId: '2', userNickname: 'BraveHeart', userAge: '19-24', requestedAt: '15 mins ago', status: 'assigned', assignedStaffId: 'staff-supervisor-1', assignedStaffName: 'David Mensah' },
  { id: 'req-3', userId: '6', userNickname: 'HopeSeeker', userAge: '15-18', requestedAt: '5 mins ago', status: 'waiting', duration: 5 },
];

function parseJson<T>(raw: string | null, defaultValue: T): T {
  if (!raw) return defaultValue;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function computeCurrentLoad(staffId: string, requests: SupportRequest[]) {
  return requests.filter((request) => request.assignedStaffId === staffId && request.status !== 'resolved').length;
}

function withCalculatedLoads(staff: StaffAccount[], requests: SupportRequest[]) {
  return staff.map((member) => ({
    ...member,
    role: normalizeRole(String(member.role)),
    currentLoad: computeCurrentLoad(member.id, requests),
  }));
}

function buildAdminUrl(path: string) {
  if (!ADMIN_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required for admin requests.');
  }

  return new URL(path, ADMIN_API_BASE_URL).toString();
}

function buildAdminUrlWithParams(path: string, params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return `${buildAdminUrl(path)}${queryString ? `?${queryString}` : ''}`;
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

function requireAdminAccessToken(accessToken?: string) {
  if (!accessToken) {
    throw new Error('Admin session expired. Please sign in again.');
  }

  return accessToken;
}

async function readApiError(response: Response): Promise<string> {
  const bodyText = await response.text();

  if (!bodyText) {
    return response.statusText || 'Admin login request failed';
  }

  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;

    if (typeof parsed.detail === 'string') {
      return parsed.detail;
    }

    if (Array.isArray(parsed.detail)) {
      return parsed.detail
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return String(item);
          }

          const detail = item as Record<string, unknown>;
          const location = Array.isArray(detail.loc) ? detail.loc.join('.') : '';
          const message = typeof detail.msg === 'string' ? detail.msg : 'Validation error';
          return location ? `${location}: ${message}` : message;
        })
        .join('; ');
    }

    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    return bodyText;
  }

  return bodyText;
}

function buildAdminHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

function mergeRemoteStaffIntoLocal(remoteStaff: AdminStaffRecord[]): StaffAccount[] {
  const existing = parseJson<StaffAccount[]>(safeStorage.getItem(STAFF_ACCOUNTS_KEY), []);

  return withCalculatedLoads(
    remoteStaff.map((member) => {
      const local = existing.find((item) => item.id === member.id || item.email.toLowerCase() === member.email.toLowerCase());

      return {
        id: member.id,
        name: member.username,
        role: normalizeRole(member.role),
        status: member.is_active ? 'active' : 'inactive',
        availability: local?.availability ?? 'available',
        email: member.email,
        phone: local?.phone ?? '',
        joinDate: member.created_at.split('T')[0] || member.created_at,
        trained: local?.trained ?? false,
        currentLoad: local?.currentLoad ?? 0,
        password: local?.password ?? '',
      };
    }),
    existing,
  );
}

function mergeSingleRemoteStaff(member: AdminStaffRecord): StaffAccount {
  const existing = parseJson<StaffAccount[]>(safeStorage.getItem(STAFF_ACCOUNTS_KEY), []);
  const local = existing.find((item) => item.id === member.id || item.email.toLowerCase() === member.email.toLowerCase());

  return {
    id: member.id,
    name: member.username,
    role: normalizeRole(member.role),
    status: member.is_active ? 'active' : 'inactive',
    availability: local?.availability ?? 'available',
    email: member.email,
    phone: local?.phone ?? '',
    joinDate: member.created_at.split('T')[0] || member.created_at,
    trained: local?.trained ?? false,
    currentLoad: local?.currentLoad ?? 0,
    password: local?.password ?? '',
  };
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function readTextOrJsonString(response: Response): Promise<string> {
  const bodyText = await response.text();

  if (!bodyText) {
    return '';
  }

  try {
    const parsed = JSON.parse(bodyText) as unknown;
    return typeof parsed === 'string' ? parsed : bodyText;
  } catch {
    return bodyText;
  }
}

export class StaffAccessService {
  static getSupportRequests(): SupportRequest[] {
    const stored = parseJson<SupportRequest[]>(safeStorage.getItem(SUPPORT_REQUESTS_KEY), []);

    if (stored.length === 0) {
      safeStorage.setItem(SUPPORT_REQUESTS_KEY, JSON.stringify(defaultSupportRequests));
      return defaultSupportRequests;
    }

    return stored;
  }

  static saveSupportRequests(requests: SupportRequest[]) {
    safeStorage.setItem(SUPPORT_REQUESTS_KEY, JSON.stringify(requests));
    this.syncStaffLoads();
  }

  static getStaffAccounts(): StaffAccount[] {
    const requests = this.getSupportRequests();
    const stored = parseJson<StaffAccount[]>(safeStorage.getItem(STAFF_ACCOUNTS_KEY), []);

    if (stored.length === 0) {
      const seeded = withCalculatedLoads(defaultStaffAccounts, requests);
      safeStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const normalized = withCalculatedLoads(stored, requests);
    safeStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  static saveStaffAccounts(accounts: StaffAccount[]) {
    const requests = this.getSupportRequests();
    const normalized = withCalculatedLoads(accounts, requests);
    safeStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(normalized));
  }

  static async listStaff(accessToken?: string): Promise<StaffAccount[]> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildAdminUrl(ADMIN_CREATE_STAFF_PATH), {
        method: 'GET',
        headers: buildAdminHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = await readJsonResponse<AdminStaffListResponse>(response);
      const merged = mergeRemoteStaffIntoLocal(data.staff || []);
      this.saveStaffAccounts(merged);
      return merged;
    } catch (error) {
      logger.error('Failed to load staff accounts', error);
      throw error;
    }
  }

  static async createStaffAccount(
    payload: {
      name: string;
      email: string;
      phone?: string;
      role: StaffRole;
      password: string;
    },
    accessToken?: string,
  ): Promise<StaffAccount> {
    const username = payload.name.trim();
    const email = payload.email.trim();
    const password = payload.password.trim();

    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    if (!username || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }

    const response = await fetch(buildAdminUrl(ADMIN_CREATE_STAFF_PATH), {
      method: 'POST',
      headers: buildAdminHeaders(accessToken),
      body: JSON.stringify({
        username,
        email,
        password,
        role: payload.role,
      } satisfies AdminCreateStaffRequest),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = (await response.json()) as AdminLoginUser;
    const nextStaff: StaffAccount = {
      id: data.id,
      name: data.username,
      role: normalizeRole(data.role),
      status: data.is_active ? 'active' : 'inactive',
      availability: 'available',
      email: data.email,
      phone: payload.phone?.trim() || '',
      joinDate: data.created_at.split('T')[0] || data.created_at,
      trained: false,
      currentLoad: 0,
      password: '',
    };

    const staff = this.getStaffAccounts();
    const next = [nextStaff, ...staff.filter((member) => member.id !== nextStaff.id)];
    this.saveStaffAccounts(next);

    return nextStaff;
  }

  static async updateStaffAccount(
    staffId: string,
    payload: {
      name: string;
      email: string;
      role: StaffRole;
      isActive?: boolean;
    },
    accessToken?: string,
  ): Promise<StaffAccount> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    const response = await fetch(buildAdminUrl(`/admin/staff/${encodePathSegment(staffId)}`), {
      method: 'PATCH',
      headers: buildAdminHeaders(accessToken),
      body: JSON.stringify({
        username: payload.name.trim(),
        email: payload.email.trim(),
        role: payload.role,
        is_active: payload.isActive ?? true,
      } satisfies AdminUpdateStaffRequest),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await readJsonResponse<AdminStaffRecord>(response);
    const nextStaff = mergeSingleRemoteStaff(data);
    const staff = this.getStaffAccounts();
    const updated = [nextStaff, ...staff.filter((member) => member.id !== nextStaff.id)];
    this.saveStaffAccounts(updated);
    return nextStaff;
  }

  static syncStaffLoads() {
    const staff = this.getStaffAccounts();
    const requests = this.getSupportRequests();
    const normalized = withCalculatedLoads(staff, requests);
    safeStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(normalized));
  }

  static upsertStaffAccount(payload: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    role: StaffRole;
    status?: StaffStatus;
    availability?: StaffAvailability;
    trained?: boolean;
    password?: string;
  }) {
    const staff = this.getStaffAccounts();

    if (payload.id) {
      const updated = staff.map((member) => {
        if (member.id !== payload.id) {
          return member;
        }

        return {
          ...member,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role,
          status: payload.status ?? member.status,
          availability: payload.availability ?? member.availability,
          trained: payload.trained ?? member.trained,
          password: member.password,
        };
      });

      this.saveStaffAccounts(updated);
      return updated;
    }

    const next: StaffAccount = {
      id: `staff-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      status: payload.status ?? 'active',
      availability: payload.availability ?? 'available',
      trained: payload.trained ?? false,
      password: '',
      joinDate: new Date().toISOString().split('T')[0],
      currentLoad: 0,
    };

    const updated = [...staff, next];
    this.saveStaffAccounts(updated);
    return updated;
  }

  static async resetStaffPassword(
    staffId: string,
    temporaryPassword: string,
    accessToken?: string,
  ): Promise<AdminStaffPasswordResetResponse> {
    const token = requireAdminAccessToken(accessToken);
    const password = temporaryPassword.trim();

    if (!password) {
      throw new Error('Temporary password is required.');
    }

    const response = await fetch(buildAdminUrl(`/admin/staff/${encodePathSegment(staffId)}/reset-password`), {
      method: 'POST',
      headers: buildAdminHeaders(token),
      body: JSON.stringify({
        temporary_password: password,
      } satisfies AdminStaffPasswordResetRequest),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminStaffPasswordResetResponse>(response);
  }

  static async changeStaffAvailability(
    staffId: string,
    payload: AdminStaffAvailabilityRequest,
    accessToken?: string,
  ): Promise<AdminStaffAvailabilityResponse> {
    const token = requireAdminAccessToken(accessToken);

    const response = await fetch(buildAdminUrl(`/admin/staff/${encodePathSegment(staffId)}/change-availability`), {
      method: 'POST',
      headers: buildAdminHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await readJsonResponse<AdminStaffAvailabilityResponse>(response);
    const normalizedAvailability = normalizeAvailability(data.availability);
    const staff = this.getStaffAccounts().map((member) => (
      member.id === staffId ? { ...member, availability: normalizedAvailability } : member
    ));
    this.saveStaffAccounts(staff);
    return { ...data, availability: normalizedAvailability };
  }

  static async deleteStaffAccount(staffId: string, accessToken?: string) {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildAdminUrl(`/admin/staff/${encodePathSegment(staffId)}`), {
        method: 'DELETE',
        headers: buildAdminHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
    } catch (error) {
      logger.error(`Failed to delete staff account ${staffId}`, error);
      throw error;
    }

    const staff = this.getStaffAccounts().filter((member) => member.id !== staffId);
    this.saveStaffAccounts(staff);

    const requests = this.getSupportRequests().map((request) => {
      if (request.assignedStaffId !== staffId) {
        return request;
      }

      return {
        ...request,
        status: 'waiting' as const,
        assignedStaffId: undefined,
        assignedStaffName: undefined,
      };
    });

    this.saveSupportRequests(requests);
  }

  static async adminListStaff(accessToken: string): Promise<AdminStaffRecord[]> {
    const response = await fetch(buildAdminUrl('/admin/staff'), {
      headers: buildAdminHeaders(accessToken),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    const data = await readJsonResponse<AdminStaffListResponse>(response);
    return data.staff ?? [];
  }

  static async adminCreateStaff(
    payload: AdminCreateStaffRequest,
    accessToken: string,
  ): Promise<AdminStaffRecord> {
    const response = await fetch(buildAdminUrl('/admin/staff'), {
      method: 'POST',
      headers: buildAdminHeaders(accessToken),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    return readJsonResponse<AdminStaffRecord>(response);
  }

  static async adminUpdateStaff(
    staffId: string,
    payload: AdminUpdateStaffRequest,
    accessToken: string,
  ): Promise<AdminStaffRecord> {
    const body: Record<string, unknown> = {};
    if (payload.username) body.username = payload.username;
    if (payload.email) body.email = payload.email;
    if (payload.password) body.password = payload.password;
    if (payload.role) body.role = payload.role;
    if (payload.is_active !== undefined) body.is_active = payload.is_active;

    const response = await fetch(buildAdminUrl(`/admin/staff/${encodePathSegment(staffId)}`), {
      method: 'PATCH',
      headers: buildAdminHeaders(accessToken),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    return readJsonResponse<AdminStaffRecord>(response);
  }

  static async adminDeleteStaff(staffId: string, accessToken: string): Promise<void> {
    const response = await fetch(buildAdminUrl(`/admin/staff/${encodePathSegment(staffId)}`), {
      method: 'DELETE',
      headers: buildAdminHeaders(accessToken),
    });
    if (!response.ok) throw new Error(await readApiError(response));
  }

  static async getDashboardStats(accessToken?: string): Promise<AdminDashboardStats> {
    if (!accessToken) {
      throw new Error('Admin session expired. Please sign in again.');
    }

    try {
      const response = await fetch(buildAdminUrl('/admin/dashboard'), {
        method: 'GET',
        headers: buildAdminHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return await readJsonResponse<AdminDashboardStats>(response);
    } catch (error) {
      logger.error('Failed to load dashboard stats', error);
      throw error;
    }
  }

  static async listConversations(
    options: AdminListConversationsOptions = {},
    accessToken?: string,
  ): Promise<AdminConversationListResponse> {
    const token = requireAdminAccessToken(accessToken);
    const response = await fetch(buildAdminUrlWithParams('/admin/conversations', {
      page: options.page ?? 1,
      page_size: options.page_size ?? 20,
      is_escalated: options.is_escalated,
      has_crisis: options.has_crisis,
    }), {
      method: 'GET',
      headers: buildAdminHeaders(token),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminConversationListResponse>(response);
  }

  static async getConversationDetail(
    conversationId: string,
    accessToken?: string,
  ): Promise<AdminConversationDetail> {
    const token = requireAdminAccessToken(accessToken);
    const response = await fetch(buildAdminUrl(`/admin/conversations/${encodePathSegment(conversationId)}`), {
      method: 'GET',
      headers: buildAdminHeaders(token),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminConversationDetail>(response);
  }

  static async listFeedback(
    options: AdminListFeedbackOptions = {},
    accessToken?: string,
  ): Promise<AdminFeedbackListResponse> {
    const token = requireAdminAccessToken(accessToken);
    const response = await fetch(buildAdminUrlWithParams('/admin/feedback', {
      page: options.page ?? 1,
      page_size: options.page_size ?? 20,
      rating: options.rating,
    }), {
      method: 'GET',
      headers: buildAdminHeaders(token),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminFeedbackListResponse>(response);
  }

  static async listReports(
    options: AdminListReportsOptions = {},
    accessToken?: string,
  ): Promise<AdminReportListResponse> {
    const token = requireAdminAccessToken(accessToken);
    const response = await fetch(buildAdminUrlWithParams('/admin/reports', {
      page: options.page ?? 1,
      page_size: options.page_size ?? 20,
      status_filter: options.status_filter,
    }), {
      method: 'GET',
      headers: buildAdminHeaders(token),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminReportListResponse>(response);
  }

  static async updateReport(
    reportId: string,
    payload: AdminUpdateReportRequest,
    accessToken?: string,
  ): Promise<string> {
    const token = requireAdminAccessToken(accessToken);
    const response = await fetch(buildAdminUrl(`/admin/reports/${encodePathSegment(reportId)}`), {
      method: 'PATCH',
      headers: buildAdminHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readTextOrJsonString(response);
  }

  static verifyCredentials(email: string, password: string): StaffSession | null {
    const normalizedEmail = email.trim().toLowerCase();
    const account = this.getStaffAccounts().find((member) => {
      return member.email.toLowerCase() === normalizedEmail && member.password === password;
    });

    if (!account) {
      return null;
    }

    if (account.status !== 'active') {
      return null;
    }

    if (!canAccessDashboard(account.role)) {
      return null;
    }

    const session: StaffSession = {
      staffId: account.id,
      name: account.name,
      role: account.role,
      email: account.email,
      loginAt: new Date().toISOString(),
    };

    return session;
  }

  static async login(email: string, password: string): Promise<StaffSession> {
    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('Please enter both email and password.');
    }

    const response = await fetch(buildAdminUrl(ADMIN_LOGIN_PATH), {
      method: 'POST',
      headers: buildAdminHeaders(),
      body: JSON.stringify({
        email: normalizedEmail,
        password: normalizedPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = (await response.json()) as AdminLoginResponse;
    const role = normalizeRole(data.user.role);

    if (!canAccessDashboard(role)) {
      throw new Error('Role not permitted for dashboard access.');
    }

    if (!data.user.is_active) {
      throw new Error('Account is inactive.');
    }

    AuthService.storeToken(data);

    return {
      staffId: data.user.id,
      name: data.user.username || data.user.email,
      role,
      email: data.user.email,
      loginAt: new Date().toISOString(),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      user: data.user,
    };
  }

  static async getCurrentUser(accessToken?: string): Promise<AdminLoginUser> {
    const token = accessToken || await AuthService.getValidAccessToken();
    const response = await fetch(buildAdminUrl(ADMIN_ME_PATH), {
      method: 'GET',
      headers: buildAdminHeaders(token),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    return readJsonResponse<AdminLoginUser>(response);
  }

  static async refreshSession(): Promise<StaffSession | null> {
    const session = this.getSession();

    if (!session?.accessToken) {
      return session;
    }

    try {
      const user = await this.getCurrentUser(session.accessToken);
      const role = normalizeRole(user.role);

      if (!canAccessDashboard(role) || !user.is_active) {
        this.clearSession();
        AuthService.clearTokens();
        return null;
      }

      const refreshedSession: StaffSession = {
        ...session,
        staffId: user.id,
        name: user.username || user.email,
        role,
        email: user.email,
        user,
      };

      this.setSession(refreshedSession);
      return refreshedSession;
    } catch {
      try {
        const accessToken = await AuthService.getValidAccessToken();
        const user = await this.getCurrentUser(accessToken);
        const role = normalizeRole(user.role);

        if (!canAccessDashboard(role) || !user.is_active) {
          this.clearSession();
          AuthService.clearTokens();
          return null;
        }

        const refreshedSession: StaffSession = {
          ...session,
          staffId: user.id,
          name: user.username || user.email,
          role,
          email: user.email,
          accessToken,
          user,
        };

        this.setSession(refreshedSession);
        return refreshedSession;
      } catch {
        this.clearSession();
        AuthService.clearTokens();
        return null;
      }
    }
  }

  static async logout(accessToken?: string): Promise<void> {
    await AuthService.logout(accessToken);
    this.clearSession();
  }

  static setSession(session: StaffSession) {
    safeStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  static getSession(): StaffSession | null {
    const raw = safeStorage.getItem(SESSION_KEY);
    return parseJson<StaffSession | null>(raw, null);
  }

  static clearSession() {
    safeStorage.removeItem(SESSION_KEY);
  }
}
