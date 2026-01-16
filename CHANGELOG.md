# Changelog

All notable changes to this project will be documented in this file.

## [2026-01-16]

### Added

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

- **Documentation**:
  - Comprehensive [User Guide for Team Management](docs/user_guides/team_management.md).
  - Updated project [README.md](README.md) with new feature overview.
  - Feature specification updated to reflect implementation status.

### Fixed

- Fixed syntax error in `src/routes/admin/teams/$teamId.tsx` where an import was incorrectly placed inside the component body.
- Improved loading state feedback by replacing simple text with polished Skeletons.
