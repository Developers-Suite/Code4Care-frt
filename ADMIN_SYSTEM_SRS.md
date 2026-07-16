# Lydia Contact Center Admin System Software Requirements Specification

## 1. Document Control
- **Product**: Lydia Contact Center Admin System
- **Version**: 1.0
- **Status**: Draft SRS aligned to the current shipped admin implementation
- **Audience**: Product owners, developers, QA, operations, and administrators

## 2. Purpose
The Lydia Contact Center admin system provides a separate, secure administrative interface for monitoring platform activity, managing users and staff access, reviewing safety incidents, checking system health, and exporting reports.

This SRS defines the functional and non-functional requirements for the current admin system as implemented in the codebase.

## 3. Scope
The admin system is available at `/dashboard` and is isolated from the main user application.

In scope:
- Analytics dashboard
- User and staff management
- Safety and crisis management
- System health monitoring
- System logs for user-to-system and admin/system events
- Report generation and export
- Separate admin login and logout flow

Out of scope:
- Content library management
- Configuration page for administrative settings
- Public user app features such as chat, story mode, pharmacy, and settings
- Real production authentication backend

## 4. System Overview
The admin system is composed of a dedicated admin route, a login gate, a sidebar navigation shell, and modular management screens.

### 4.1 Entry Points
- `/dashboard` opens the admin login or the admin panel if authenticated
- Admin authentication uses a stored session token in local storage
- Logout clears the admin session and returns the user to the login page

### 4.2 Core Modules
- Analytics Dashboard
- User Management
- Safety & Crisis
- System Health
- Reports

## 5. Stakeholders and User Classes

### 5.1 Stakeholders
- Product owner
- Admin operators
- Safety and crisis staff
- Technical operations staff
- QA and support teams

### 5.2 User Classes
- **Admin**: Full access to all admin modules
- **Consultant/Staff**: Operational access based on staff role and permissions
- **Supervisor**: Staff oversight and escalation support
- **Coordinator**: Administrative coordination role

## 6. Operating Environment
- Frontend: React + TypeScript
- Build tooling: Vite
- UI stack: Tailwind CSS, Radix-based UI components, motion animations
- Charts: Recharts
- Persistent client storage: localStorage for admin session and seeded demo data

## 7. Functional Requirements

### 7.1 Authentication and Session Handling
**FR-1** The system shall present an admin login screen at `/dashboard` when the admin session token is absent.

**FR-2** The system shall allow access to the admin panel only when a valid admin session token exists.

**FR-3** The system shall provide a logout action that clears the admin session and ends access to the panel.

**FR-4** The admin session shall be independent from the user application session.

### 7.2 Navigation and Layout
**FR-5** The system shall provide a sidebar navigation layout for the admin modules.

**FR-6** The system shall include the following navigation items:
- Analytics Dashboard
- User Management
- Safety & Crisis
- Reports
- System Health

**FR-7** The system shall support responsive behavior for desktop and mobile access.

**FR-8** The system shall allow module switching without leaving the admin route.

### 7.3 Analytics Dashboard
**FR-9** The system shall display high-level analytics KPIs for active users, engagements, satisfaction, and system/safety trends.

**FR-10** The system shall visualize demographic data by age and by region.

**FR-11** The system shall show engagement trend charts over time.

**FR-12** The system shall show a user journey funnel for onboarding and feature adoption.

**FR-13** The system shall show safety-related summary metrics and recent incident data.

**FR-14** The system shall show generated admin insights and recommended actions.

### 7.4 User Management
**FR-15** The system shall display a searchable and filterable user list.

**FR-16** The system shall allow filtering users by status.

**FR-17** The system shall display engagement information using an engagement count and engagement intensity representation.

**FR-18** The system shall display staff access information for admin personnel.

**FR-19** The system shall allow creation and editing of staff accounts.

**FR-20** The system shall allow deletion of staff accounts.

**FR-21** The system shall support staff training and status indicators in the staff list.

### 7.5 Safety and Crisis Management
**FR-22** The system shall display recent safety incidents.

**FR-23** The system shall classify incidents by type, severity, and status.

**FR-24** The system shall support escalation and resolution workflows for incident records.

**FR-25** The system shall provide follow-up tracking for incidents requiring support.

**FR-26** The system shall display trend metrics for safety events.

### 7.6 System Health and Logs
**FR-27** The system shall display core system metrics including response time, uptime, error rate, active engagements, memory usage, and database query volume.

**FR-28** The system shall support time-range selection for system health data.

**FR-29** The system shall display charts for response time, error rate, uptime, and resource utilization.

**FR-30** The system shall display system logs for user-to-system and admin/system events.

**FR-31** The system shall include log metadata such as action, actor, status, and timestamp.

### 7.7 Reports and Export
**FR-32** The system shall provide a report builder with report type selection.

**FR-33** The system shall support the following report types:
- Overview
- Activity
- Demographics
- Safety
- Performance
- Full data

**FR-34** The system shall allow selection of a year range for exports.

**FR-35** The system shall generate JSON exports for the selected report type and date window.

**FR-36** The system shall generate CSV exports for the selected report type and date window.

**FR-37** The system shall include a preview of the chosen report sections prior to export.

**FR-38** The system shall package full report exports with included sections and summary data.

## 8. Data Requirements

### 8.1 Demographic Data
The system shall maintain the following demographic groupings:
- Age ranges
- Gender identities
- Language preferences
- Regions

### 8.2 Engagement Data
The system shall track engagement trends using:
- Engagement count
- Total messages
- Unique users
- Satisfaction average

### 8.3 Safety Data
The system shall track:
- Panic exits
- Crisis interventions
- Self-harm mentions
- Suicidal ideation mentions
- Abuse mentions
- Human escalations
- Follow-ups

### 8.4 Performance Data
The system shall track:
- Average response time
- Message processing success
- System uptime
- Crash or error counts
- Stability duration

### 8.5 Report Data
The system shall be able to export:
- Summary analytics
- Trend tables
- Demographic breakdowns
- Safety summaries
- Performance summaries
- Full report payloads

## 9. External Interface Requirements

### 9.1 User Interface
- The admin UI shall use a sidebar shell with a main content region.
- The UI shall present cards, tables, badges, charts, and action buttons.
- The UI shall be responsive on desktop and mobile layouts.

### 9.2 Data Storage Interface
- The system shall use localStorage for demo admin sessions.
- The system shall use localStorage-backed demo data for staff accounts and support requests.

### 9.3 Export Interface
- The system shall create downloadable CSV and JSON files in the browser.

## 10. Business Rules
- Admin features shall not be visible in the public user application.
- Content management is removed from the current system and shall not reappear in navigation.
- The system health page shall present operational metrics and logs, not configuration controls.
- User metrics should use terminology that is easy to understand, such as engagement rather than internal session jargon.

## 11. Non-Functional Requirements

### 11.1 Security
**NFR-1** Admin access shall require a valid admin session token.

**NFR-2** The admin system shall remain separated from the user-facing application routes.

**NFR-3** Sensitive admin data shall not be exposed in the public user interface.

### 11.2 Usability
**NFR-4** Navigation labels shall be simple, clear, and non-technical.

**NFR-5** Reports and health metrics shall be readable by non-engineering admin staff.

**NFR-6** Visual indicators shall use consistent colors and iconography for status and severity.

### 11.3 Performance
**NFR-7** The admin app shall load and switch sections without excessive delay.

**NFR-8** Charts and tables shall render within acceptable browser performance constraints for a typical admin workstation.

### 11.4 Reliability
**NFR-9** The system shall gracefully handle missing demo data by seeding defaults.

**NFR-10** Export generation shall not require external network calls in the current implementation.

### 11.5 Maintainability
**NFR-11** The admin system shall remain modular by feature area.

**NFR-12** Shared analytics data types shall be defined centrally in TypeScript.

## 12. Acceptance Criteria
The admin system is considered compliant when:
- `/dashboard` opens the admin login flow or admin panel correctly
- The sidebar shows only the current live admin modules
- The analytics dashboard includes demographics by age and region
- User management uses engagement terminology instead of session jargon
- Safety management supports incident tracking and escalation
- System health shows metrics and system logs
- Reports can be generated for overview, activity, demographics, safety, performance, and full data
- Reports support selectable year ranges and JSON/CSV export
- The build completes without errors

## 13. Traceability Summary

| Requirement Area | Current Implementation |
|---|---|
| Authentication | `src/AdminDashboardApp.tsx`, `src/components/AdminDashboardLogin.tsx` |
| Navigation | `src/components/AdminPanel.tsx`, `src/components/AdminSidebar.tsx` |
| Analytics | `src/components/EnhancedAdminDashboard.tsx` |
| User Management | `src/components/AdminUserManagement.tsx` |
| Safety Management | `src/components/AdminSafetyManagement.tsx` |
| System Health | `src/components/AdminSystemHealth.tsx` |
| Reports | `src/components/AdminReports.tsx` |
| Data Models | `src/types/analytics.ts` |
| Data Services | `src/services/analyticsService.ts`, `src/services/staffAccessService.ts` |

## 14. Assumptions and Dependencies
- The current admin experience uses seeded demo data.
- Report exports are generated client-side.
- The dashboard is intended for internal admin use only.
- Future production authentication and backend integration may replace the current demo token and localStorage model.

## 15. Future Enhancements
- Real authentication and RBAC
- Backend-backed audit logging
- Persistent report archive
- Export scheduling and saved report templates
- Configurable alert thresholds for system health and safety
