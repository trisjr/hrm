# Changelog

## [Unreleased]

## [2026-01-19] - User Skills, CV & Dashboard

### Added

- **Skills Management**:
  - Add/Edit/Delete user skills with proficiency levels.
  - Interactive Radar Chart visualization.
  - Database seeding for master skills and levels.
- **CV Builder**:
  - Auto-generate professional CV from profile data.
  - PDF Export functionality using `@react-pdf/renderer`.
  - Live Preview and Edit Summary.
- **Personalized Dashboard**:
  - Role-based views (Employee, Leader, Admin).
  - Widgets: Leave Stats, WFH Stats, Team Status, Pending Approvals.
  - Welcome banner with dynamic date.

### Changed

- Updated `profiles` table: Added `summary` field.
- Improved Navigation: Added "My Skills" and "My CV" menu items.
- Upgraded Dashboard UI with `shadcn/ui` components.

### Fixed

- Corrected field mapping for Education/Experience in CV (organizationName/positionMajor).
- Fixed PDF export layout issues.
