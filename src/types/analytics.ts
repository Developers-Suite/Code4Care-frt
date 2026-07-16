/**
 * Analytics and data types for Lydia Contact Center admin dashboard
 * Supports informed decision-making based on user behavior and engagement
 */

// User Demographics
export type AgeRange = '10-14' | '15-19' | '20-24' | '25+';
export type GenderIdentity = 'male' | 'female' | 'non-binary' | 'prefer-not-say';
export type Language = 'en' | 'twi' | 'ewe' | 'ga';

export interface DemographicMetrics {
  ageRange: Record<AgeRange, number>;
  gender: Record<GenderIdentity, number>;
  languagePreference: Record<Language, number>;
  regions: Record<string, number>;
  totalActiveUsers: number;
  newUsersToday: number;
  returningUsers: number;
}

// Chat and Engagement Metrics
export type TopicCategory = 
  | 'contraception'
  | 'stis'
  | 'pregnancy'
  | 'menstruation'
  | 'relationships'
  | 'puberty'
  | 'consent'
  | 'mental-health'
  | 'general';

export interface TopicEngagement {
  topic: TopicCategory;
  inquiries: number;
  avgSessionTime: number; // seconds
  satisfactionScore: number; // 1-5
  createdAt: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  topicsDiscussed: TopicCategory[];
  messagesExchanged: number;
  usedCrisisSupport: boolean;
  usedPanicButton: boolean;
  storyModulesCompleted: string[];
  pharmacySearches: number;
  satisfactionRating?: number; // 1-5
  language: Language;
  ageRange: AgeRange;
  gender: GenderIdentity;
}

// Content and Story Mode Metrics
export interface StoryModuleMetrics {
  moduleId: string;
  moduleName: string;
  timesStarted: number;
  timesCompleted: number;
  avgCompletionTime: number; // seconds
  avgScore: number; // percentage
  commonMistakes: string[];
  usefulnessRating: number; // 1-5
  targetAgeGroup: AgeRange;
}

// Safety and Risk Metrics
export interface SafetyMetrics {
  panicExitsTotal: number;
  panicExitsToday: number;
  crisisInterventionsTriggered: number;
  selfHarmMentionsDetected: number;
  suicidalIdeationMentions: number;
  abuseMentionsDetected: number;
  concernedUsersFollowedUp: number;
  risksEscalatedToHuman: number;
}

// Performance and System Metrics
export interface PerformanceMetrics {
  avgResponseTime: number; // milliseconds
  messageProcessingSuccess: number; // percentage
  systemUptime: number; // percentage
  crashesOrErrors: number;
  consecutiveHours: number; // uninterrupted service
}

// Funnel and Retention Metrics
export interface FunnelMetrics {
  totalVisitors: number;
  completedOnboarding: number;
  hadFirstChat: number;
  completedStoryModule: number;
  usedPharmacy: number;
  accessedCrisisSupport: number;
  retentionDay1: number; // percentage
  retentionDay7: number; // percentage
  retentionDay30: number; // percentage;
  churnRate: number; // percentage
}

// Engagement Trend Data
export interface TrendDataPoint {
  date: string; // YYYY-MM-DD
  sessions: number;
  uniqueUsers: number;
  totalMessages: number;
  satisfactionAverage: number;
  panicExits: number;
  crisisInterventions: number;
}

// Content Gap Analysis
export interface ContentGap {
  topic: TopicCategory;
  unmetDemand: number; // in terms of inquiries not fully resolved
  frequentQuestions: string[];
  ageGroupsMostInterested: AgeRange[];
  confidenceLevel: number; // 1-10, admin confidence in current content
  recommendedAction: string;
}

// Overall Dashboard Summary
export interface AnalyticsSummary {
  generatedAt: string;
  period: 'today' | 'week' | 'month';
  demographics: DemographicMetrics;
  topics: TopicEngagement[];
  safety: SafetyMetrics;
  performance: PerformanceMetrics;
  funnel: FunnelMetrics;
  trends: TrendDataPoint[];
  contentGaps: ContentGap[];
  storyModules: StoryModuleMetrics[];
  adminInsights: AdminInsight[];
}

// Admin Actionable Insights
export interface AdminInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction: string;
  impactedUsers: number;
  createdAt: string;
}

// Dashboard filter options
export interface DashboardFilters {
  ageRange?: AgeRange | 'all';
  gender?: GenderIdentity | 'all';
  language?: Language | 'all';
  dateRange: 'today' | 'week' | 'month' | 'year' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
}
