# Human Resource Management System (HRM)

A comprehensive HRM solution built with TanStack Start, React, Drizzle ORM, and Tailwind CSS.

## Features

### 🎯 Competency Management (New!)

- **Competency Framework**: Define competency groups, competencies, and behavioral levels (1-5).
- **Requirements Matrix**: Set required competency levels per Role + Career Band.
- **Assessment Cycles**: Quarterly/bi-annual assessment cycles with workflow (Self → Leader → Discussion → Finalized).
- **Gap Analysis**: Automatic calculation of competency gaps with visual indicators.
- **Individual Development Plans (IDP)**: Create and track personalized development plans based on assessment gaps.
- **Progress Tracking**: Monitor IDP activity completion with due dates and status updates.
- **Assessment Results**: Summary statistics, strengths/weaknesses analysis, and navigation to IDP creation.

### 🏢 Team Management

- **Organization**: Create and manage functional teams.
- **Leadership**: Assign team leaders with automatic role promotion.
- **Analytics**: Track team size, active requests, and attendance trends.
- **Notifications**: Automated emails for member changes (add/remove/leader assignment).
- **Views**: Responsive table and card views for team listings.

### 👤 User Management

- **Profiles**: Detailed employee profiles with personal and professional data.
- **Roles**: RBAC system (Admin, HR, Leader, Developer, etc.).
- **Authentication**: Secure login with JWT and role-based redirect.

### 📝 Request Management

- **Workflow**: Submit and approve leave/work requests.
- **Status**: Track request status (Pending, Approved, Rejected).

---

## Technical Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS v4, shadcn/ui
- **Backend**: TanStack Start (Server Functions), Drizzle ORM, PostgreSQL
- **Tools**: Vite, pnpm, Biome/Prettier

---

## Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

## Database Management

This project uses Drizzle ORM.

```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema changes (dev)
pnpm db:studio    # Open Drizzle Studio
pnpm db:seed      # Seed database with sample data
```

## Documentation

### User Guides

- [Competency Management](docs/user_guides/competency_management.md)
- [Team Management](docs/user_guides/team_management.md)

### Technical Documentation

- [Competency Management Specification](docs/specs/competency_management_spec.md)
- [Team Management Specification](docs/specs/team_management_spec.md)
- [Phase 6 Summary](docs/PHASE_6_SUMMARY.md)
- [API Endpoints](docs/API_ENDPOINTS.md)
- [Changelog](CHANGELOG.md)

---

## Project Status

✅ **Completed Features**:

- Phase 1: Competency Dictionary (Groups, Competencies, Levels)
- Phase 2: Requirements Matrix
- Phase 3: Assessment Cycles Management
- Phase 4: Self & Leader Assessment Workflow
- Phase 5: Individual Development Plans (IDP)
- Phase 6: Polish, Testing & Documentation
- Team Management System
- User Management & Authentication
- Request Management Workflow

🚧 **In Progress**:

- Advanced Reporting & Analytics
- Email Notification Templates
- Radar Chart Visualization

📋 **Planned**:

- 360 Feedback
- IDP Auto-Generation (AI-powered)
- Competency Import/Export
- Mobile App

---

**Last Updated**: January 16, 2026
