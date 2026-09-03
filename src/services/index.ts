/**
 * Services Index
 * Central export point for all API and service modules
 */

// Core API Client
export { APIClient, getApiClient } from './apiClient';
export type { ApiClientConfig } from './apiClient';

// Authentication Service
export { AuthService } from './authService';
export type { TokenPayload, RefreshTokenPayload, RefreshTokenResponse } from './authService';

// Staff/Admin Services
export { StaffAccessService } from './staffAccessService';
export type {
  StaffRole,
  StaffStatus,
  StaffAvailability,
  SupportRequestStatus,
  StaffAccount,
  SupportRequest,
  StaffSession,
  AdminLoginUser,
  AdminLoginResponse,
  AdminDashboardStats,
  AdminStaffPasswordResetRequest,
  AdminStaffPasswordResetResponse,
  AdminStaffAvailabilityRequest,
  AdminStaffAvailabilityResponse,
  AdminConversationListItem,
  AdminConversationListResponse,
  AdminConversationMessage,
  AdminConversationDetail,
  AdminListConversationsOptions,
  AdminFeedbackItem,
  AdminFeedbackListResponse,
  AdminListFeedbackOptions,
  AdminReportItem,
  AdminReportListResponse,
  AdminListReportsOptions,
  AdminUpdateReportRequest,
} from './staffAccessService';

// User Management Services
export { UserManagementService } from './userManagementService';
export type {
  UserStatus,
  AgeRange,
  GenderIdentity,
  UserDetails,
  UserListItem,
  UserListResponse,
  ChatMessage,
  UserChatHistoryResponse,
  UpdateUserRequest,
  UserDeleteRequest,
} from './userManagementService';

// Support Requests Services
export { SupportRequestService } from './supportRequestService';
export type {
  SupportRequestStatus as SRStatus,
  SupportRequestType,
  RequestReason,
  RequestUrgency,
  ChatContext,
  CreateSupportRequestPayload,
  SupportRequestCreationResponse,
  SupportRequestListItem,
  SupportRequestListResponse,
  SupportRequestDetails,
  UpdateSupportRequestPayload,
  AssignRequestPayload,
  ResolveSupportRequestPayload,
  CloseSupportRequestPayload,
} from './supportRequestService';

// Chat Services
export { EnhancedChatService } from './enhancedChatService';
export type {
  ChatFeedbackPayload,
  ChatFeedbackResponse,
  EscalateToConsultantPayload,
  EscalateToConsultantResponse,
  ChatSessionMessage,
  ChatSessionHistoryResponse,
} from './enhancedChatService';

// User Engagement Services
export { UserEngagementService } from './userEngagementService';
export type {
  UserLanguage,
  ChatEventCategory,
  ChatInputMethod,
  SessionAction,
  DeviceType,
  CaptureDemographicsPayload,
  CaptureDemographicsResponse,
  LogChatEventPayload,
  LogChatEventResponse,
  UpdateUserSettingsPayload,
  UpdateUserSettingsResponse,
  TrackSessionPayload,
  TrackSessionResponse,
} from './userEngagementService';

// Analytics Services
export { RealAnalyticsService } from './realAnalyticsService';
export type {
  AnalyticsPeriod,
  AnalyticsSummary,
  AnalyticsOverviewSummary,
  TopicEngagementItem,
  TopicEngagementResponse,
  UserAnalyticsResponse,
  SafetyAnalyticsResponse,
  PerformanceMetricsResponse,
  SessionAnalyticsPayload,
  SessionAnalyticsResponse,
} from './realAnalyticsService';

// Safety Incident Services (removed - backend endpoint not available)
// The `/api/admin/incidents` admin endpoints are not implemented in the backend
// and were returning 404 in production. References removed from central exports.

// Safety Event Services
export { SafetyEventService } from './safetyEventService';
export type {
  PanicEventPayload,
  PanicEventResponse,
  CrisisEventPayload,
  CrisisEventResponse,
} from './safetyEventService';

// Health Metrics Services
export { HealthMetricsService } from './healthMetricsService';
export type {
  SystemMetric,
  PerformanceDataPoint,
  ServiceHealthStatus,
  HealthMetricsResponse,
  PerformanceHistoryResponse,
} from './healthMetricsService';

// Audit Log Services
export { AuditLogService } from './auditLogService';
export type {
  AuditLogEntry,
  AuditLogListResponse,
  AuditLogFilters,
  AuditLogStatsResponse,
} from './auditLogService';

// Original Chat Service (for completion requests)
export { requestChatCompletion, ChatbotSession, createChatSession, getBotResponse, getFollowUpSuggestions } from './chatbotService';
export type { ChatMessage as ChatbotMessage, UserDemographics, ChatApiRequest, ChatApiResponse, ChatCitation, SafetyFlag } from './chatbotService';

// Frontend RAG Fallback Service
export { executeFrontendRagFallback, generateOpenModelResponse, generateLocalBrowserRagResponse, retrieveRagContext } from './frontendRagService';
export type { KnowledgeTopic } from './frontendRagService';

// Analytics (Mock Data - kept for reference)
export { AnalyticsService } from './analyticsService';

// Text-to-Speech Service
export { default as fetchSpeechAudio } from './ttsService';

// Feedback Service
export { FeedbackService } from './feedbackService';
export type { FeedbackRequest, FeedbackResponse } from './feedbackService';

// Report Service
export { ReportService } from './reportService';
export type { ReportRequest, ReportResponse } from './reportService';

// User Tracking Service
export { UserTrackingService } from './userTrackingService';
export type {
  UserDemographicsRequest,
  UserDemographicsResponse,
  EventLogRequest,
  EventLogResponse,
  UserSettingsRequest,
  UserSettingsResponse,
  UserSessionRequest,
  UserSessionResponse,
} from './userTrackingService';

// Safety Service
export { SafetyService } from './safetyService';
export type {
  PanicEventRequest,
  PanicEventResponse as SafetyPanicEventResponse,
  CrisisEventRequest,
  CrisisEventResponse as SafetyCrisisEventResponse,
} from './safetyService';

// Follow-up Service
export { FollowUpService } from './followUpService';
export type {
  FollowUpRequestRequest,
  FollowUpRequestResponse,
} from './followUpService';

// Feature Analytics Service
export { FeatureAnalyticsService } from './featureAnalyticsService';
export type {
  StoryEventRequest,
  StoryEventResponse,
  MythBusterEventRequest,
  MythBusterEventResponse,
  ResourceAccessEventRequest,
  ResourceAccessEventResponse,
} from './featureAnalyticsService';

// Health Service
export { HealthService } from './healthService';
export type {
  HealthResponse,
  ReadyResponse,
  VersionResponse,
} from './healthService';

// Suggestions Service
export { SuggestionsService } from './suggestionsService';
export type {
  SuggestionsRequest,
  SuggestionsResponse,
} from './suggestionsService';

// Report Orchestration Service
export { ReportOrchestrationService } from './reportOrchestrationService';
export type {
  ReportType,
  ExportFormat,
  ReportPeriod,
  ReportConfig,
  GeneratedReport,
  ReportTemplate,
} from './reportOrchestrationService';
