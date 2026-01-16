# Human Resource Management System (HRM)

A comprehensive HRM solution built with TanStack Start, React, Drizzle ORM, and Tailwind CSS.

## Features

### 🏢 Team Management (New!)

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
pnpm db:studio    # Open Drizzle Studio
```

## Documentation

- [User Guide: Team Management](docs/user_guides/team_management.md)
- [Feature Specification](docs/specs/team_management_spec.md)
