# Changelog

All notable changes to this project will be documented in this file.

## [2026-01-19]

### Added

- **Competency Operations - Phase 8: Cycle & Team Management**:
  - **Assessment Cycle Operations**:
    - **Lifecycle Management**: Admin can now Activate and Close cycles via UI.
    - **Automated Emails**: System sends 'Cycle Started' emails to all participants upon activation.
    - **Reminder System**: 'Remind All Pending' action sends nudge emails to employees who haven't completed assessments.
  - **Leader Dashboard (Team IDP)**:
    - **Team Development Plans**: New dashboard for Leaders to monitor team member's IDP progress.
    - **Progress Tracking**: Visual progress bars and status indicators for team development activities.
    - **Detail View**: Read-only view for Leaders to inspect specific IDP contents and evidence.
    - **Notifications**: Leaders receive email alerts when employees submit Self-Assessments.
  - **Assessment History**:
    - **History Page**: User-facing page listing all past assessments with scores and status.
    - **Smart Navigation**: 'My Assessment' page now intelligently redirects users to history or active tasks, avoiding "looping" on completed tasks.
  - **System & Security**:
    - **Email Seeder**: Script (`src/scripts/seed-assessment-templates.ts`) to populate essential email templates.
    - **Permission Hardening**: Strict RBAC checks update for Cycle and IDP access (Leader/Owner only).

## [2026-01-16]

### Added

- **Competency Management - Phase 5: Individual Development Plan (IDP)**:
  - Backend server functions for IDP management (`src/server/idp.server.ts`):
    - `createIDPFn`: Create new IDP with multiple activities
    - `getMyActiveIDPFn`: Fetch user's active IDP with activities
    - `updateActivityStatusFn`: Mark activities as DONE/PENDING
  - IDP Schemas with validation (`src/lib/competency.schemas.ts`):
    - `createIDPSchema`: Goal, dates, and activities array
    - `createIDPActivitySchema`: Competency, type, description, target date
    - `updateIDPActivitySchema`: Status and result updates
  - Assessment Results Page (`/competencies/results/$assessmentId`):
    - Summary statistics (Self, Leader, Final scores, Gap average)
    - Gap Analysis with Strengths vs Weaknesses tables
    - Visual progress indicators
    - Navigation to Create IDP or View existing IDP
  - Create IDP Page (`/competencies/idp/create`):
    - Dynamic form with activity management (add/remove)
    - Auto-suggest competencies from assessment gaps
    - Competency selection with weakness indicators
    - Activity type selection with human-readable labels
  - My IDP Dashboard (`/competencies/idp`):
    - Progress tracking with completion percentage
    - Activity list with status indicators
    - Mark activities as complete functionality
    - Due date tracking with overdue warnings
  - Navigation: Added "My IDP" menu item for all roles

- **Team Management System**:
  - Full CRUD for teams (Create, Read, Update, Soft-delete).
  - Team Detail page with integrated analytics (Recharts).
  - Leader assignment logic (limited to existing team members).
  - Member management (Add/Remove) with automatic role updates for leaders.
  - Reassignment warning when adding users who are already in another team.
  - Keyboard shortcut `Cmd+K` / `Ctrl+K` for global team search.
  - Responsive UI: Card view for mobile, Table view for desktop.
  - Email notifications for team-related events (added, removed, leader assigned, team deleted).
  - Skeleton loading states for Team Detail page to improve perceived performance.
  - Accessibility enhancements (ARIA labels).

- **Competency Management - Phase 4: Assessment Assignment & Self-Service**:
  - **Admin Features**:
    - Bulk Assignment Action: Admin/HR can now bulk assign assessments to all eligible users (with Career Band) for an active cycle.
    - Updated `Assessment Cycles` UI with "Assign Users" dropdown action.
    - Server logic (`assignUsersToCycleFn`) to handle bulk creation, skipping existing assignments.
    - Conflict resolution strategy (skip duplicates).
  - **User Features**:
    - Self-Service Start: Users can now start their own assessment via "My Assessment" dashboard if an active cycle exists.
    - Empty State UI: Provides clear call-to-action ("Start Assessment") when no assessment is found but a cycle is active.
    - Automatic Requirement Mapping: System automatically generates assessment details based on User's Career Band requirements.
  - **Technical Improvements**:
    - Fixed critical bug in schema mapping `level` vs `requiredLevel` in competency requirements.
    - Standardized Server Function payload structure (Flat vs Nested) to resolve TanStack Start RPC issues.
    - Enhanced error handling and debug logging for assessment initiation.

- **Documentation**:
  - Comprehensive [User Guide for Team Management](docs/user_guides/team_management.md).
  - Updated project [README.md](README.md) with new feature overview.
  - Feature specification updated to reflect implementation status.

### Fixed

- **Database Schema**: Changed `selfScoreAvg`, `leaderScoreAvg`, `finalScoreAvg` from `integer` to `real` type to support decimal values for accurate score calculations.
- **Assessment Cycles**:
  - Fixed date format issue in `createAssessmentCycleFn`: Convert Date objects to YYYY-MM-DD strings before SQL queries to prevent PostgreSQL type errors.
  - Fixed date format issue in `updateAssessmentCycleFn`: Proper date string conversion for overlap checks and database updates.
  - Implemented validation in `deleteAssessmentCycleFn`: Prevent deletion of cycles with existing assessments, show user-friendly error message.
  - Fixed duplicate import of `assessmentCycles` and consolidated schema imports at file top.
- **IDP Activity Types**: Synchronized `activityTypeEnum` between app schema and database enum:
  - Updated from `['READING', 'TRAINING', 'MENTORING', 'PROJECT', 'OTHER']`
  - To match DB: `['TRAINING', 'MENTORING', 'PROJECT_CHALLENGE', 'SELF_STUDY']`
  - Added human-readable formatting in UI (e.g., "Project Challenge" instead of "PROJECT_CHALLENGE").
- **Code Quality**:
  - Fixed syntax error in `src/routes/admin/teams/$teamId.tsx` where an import was incorrectly placed inside the component body.
  - Improved loading state feedback by replacing simple text with polished Skeletons.
  - Cleaned up redundant imports and organized import statements.

### Changed

- Finalized assessment seed script to support IDP testing workflow.
- Enhanced error messages for better user experience across competency management features.

### Documentation & Code Quality (Phase 7)

- **System Architecture Documentation** (`docs/SYSTEM_OVERVIEW.md`):
  - Complete system architecture with visual diagrams
  - Database schema and relationships documentation
  - Data flow workflows for all major features
  - Security model and RBAC implementation details
  - Performance optimization strategies
  - Deployment architecture recommendations
- **Inline Code Documentation**:
  - Added comprehensive JSDoc comments to 20+ server functions
  - Documented business logic, workflows, and error cases
  - Explained complex algorithms and data transformations
  - Improved code maintainability for future developers

- **Deployment Guide** (`docs/DEPLOYMENT_GUIDE.md`):
  - Pre-deployment checklist (security, performance, data)
  - Environment setup for production
  - Database migration procedures
  - Step-by-step deployment for Vercel and Cloudflare
  - Rollback procedures and disaster recovery
  - Monitoring and maintenance guidelines
  - Troubleshooting common issues

- **Code Cleanup**:
  - Removed debug console.log statements from production code
  - Organized imports and removed unused dependencies
  - Verified TypeScript strict mode compliance
  - Maintained intentional logging for production monitoring

- **Phase Summaries**:
  - Phase 6 Summary: Testing and polish work documentation
  - Phase 7 Summary: Documentation and deployment readiness
