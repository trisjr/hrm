# System Architecture Overview - HRM System

## Core Architecture

The system is built on **TanStack Start**, providing a full-stack React framework with Server-Side Rendering (SSR) and powerful data management via **TanStack Router** and **TanStack Query**.

### Frontend Layer

- **Framework:** React 19 (Beta/RC features like `useTransition`, `useOptimistic`).
- **Routing:** File-based routing in `src/routes/`.
- **Styling:** Tailwind CSS v4 for utility-first styling, with **shadcn/ui** for accessible components.
- **State Management:**
  - **Server State:** TanStack Query for global data fetching and caching.
  - **Client State:** Zustand for lightweight stores (e.g., Auth state).
- **Design Principles:**
  - **Skeleton Loading:** Used for Team Detail and profile pages to maintain high perceived performance.
  - **Mobile-First:** All components are responsive, switching from tables (desktop) to cards (mobile) where appropriate.

### Backend Layer (Runtime)

- **TanStack Start Server Functions:** The bridge between frontend and database. Located in `src/server/`.
- **Security:**
  - Role-Based Access Control (RBAC) validated on the server for all critical actions (Admin, HR, Leader, Dev).
  - JWT tokens for authentication.
- **Utils:** Centralized utilities in `src/lib/` for auth, email, and schema validation (Zod).

### Data Layer

- **Database:** PostgreSQL.
- **ORM:** Drizzle ORM for type-safe database interactions and migrations.
- **Schema:** Defined in `src/db/schema.ts` and documented in `docs/DB_SCHEMA.md`.

## Key Modules

### 1. Authentication & RBAC

Handles login, token verification, and role-based redirects. Users are restricted to certain UI elements and API actions based on their assigned role.

### 2. Team Management (Newly Added)

Allows organization of employees into functional units.

- **Teams Table:** Global search and quick filters.
- **Team Detail:** Deep dive into members, leadership, and performance analytics.
- **Notifications:** Integrated email system (via `email_templates`) for real-time updates on team membership changes.

### 3. User & Profile Management

Comprehensive employee profiles including education, experience, and attachments (CVs). Features an approval workflow for profile updates.

### 4. Attendance & Requests

Tracks employee clock-ins and manages workflow requests (Leave, WFH, OT).
