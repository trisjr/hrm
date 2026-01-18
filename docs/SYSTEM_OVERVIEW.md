# System Architecture Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Data Flow](#data-flow)
4. [Security Model](#security-model)
5. [Key Technical Decisions](#key-technical-decisions)

---

## System Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React 19 + TanStack Router + Tailwind CSS + shadcn/ui     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ TanStack Query (React Query)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Backend Layer (Server Functions)          │
│              TanStack Start + Drizzle ORM                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SQL Queries
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Database Layer                          │
│                    PostgreSQL 15+                           │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
src/
├── components/          # React UI components
│   ├── common/         # Reusable components (ErrorBoundary, EmptyState)
│   ├── competencies/   # Competency management components
│   ├── layout/         # App layout (Sidebar, Header)
│   └── ui/             # shadcn/ui components
├── routes/             # TanStack Router pages
│   ├── admin/          # Admin-only pages
│   ├── competencies/   # Competency features
│   └── __root.tsx      # Root layout
├── server/             # Server functions (Backend logic)
│   ├── assessments.server.ts
│   ├── competencies.server.ts
│   ├── idp.server.ts
│   └── ...
├── db/                 # Database
│   ├── schema.ts       # Drizzle schema definitions
│   ├── seed.ts         # Seed data
│   └── index.ts        # Database client
├── lib/                # Utilities
│   ├── competency.schemas.ts  # Zod validation schemas
│   ├── auth.utils.ts          # JWT helpers
│   └── utils.ts               # General utilities
└── store/              # Client state (Zustand)
    └── auth.store.ts
```

---

## Database Schema

### Core Entities Overview

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│    Users     │◄──────┤ User Assessments │──────►│ Assessment      │
│              │       │                  │       │ Cycles          │
└──────┬───────┘       └────────┬─────────┘       └─────────────────┘
       │                        │
       │                        │
       │                        │
       ▼                        ▼
┌──────────────┐       ┌──────────────────┐
│ Career Bands │       │ Assessment       │
│              │       │ Details          │
└──────────────┘       └──────────────────┘
                                │
                                │
                                ▼
                       ┌──────────────────┐
                       │  Competencies    │
                       └──────────────────┘
                                │
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ Competency │  │ Competency │  │ Competency │
       │  Groups    │  │  Levels    │  │Requirements│
       └────────────┘  └────────────┘  └────────────┘
```

### Key Tables

#### 1. Competency Framework

- **competency_groups**: Categories (Core, Technical, Leadership)
- **competencies**: Individual skills/abilities
- **competency_levels**: 5 behavioral levels per competency
- **competency_requirements**: Required levels per Role + Career Band

#### 2. Assessment System

- **assessment_cycles**: Quarterly/annual evaluation periods
- **user_assessments**: Employee assessment records
- **user_assessment_details**: Scores per competency (self, leader, final)

#### 3. Individual Development Plans (IDP)

- **individual_development_plans**: Personal growth plans
- **idp_activities**: Specific improvement activities

### Relationships

```sql
-- User Assessment links to:
user_assessments → users (userId)
user_assessments → assessment_cycles (cycleId)
user_assessments → career_bands (via users.careerBandId)

-- Assessment Details links to:
user_assessment_details → user_assessments (userAssessmentId)
user_assessment_details → competencies (competencyId)

-- IDP links to:
individual_development_plans → users (userId)
individual_development_plans → user_assessments (userAssessmentId, optional)

-- IDP Activities links to:
idp_activities → individual_development_plans (idpId)
idp_activities → competencies (competencyId)
```

---

## Data Flow

### 1. Competency Setup Flow (Admin/HR)

```
1. Create Competency Groups
   └─► Create Competencies within Groups
       └─► Define 5 Behavioral Levels per Competency
           └─► Set Requirements Matrix (Role × Band × Competency)
```

### 2. Assessment Cycle Flow

```
HR Creates Cycle (DRAFT → ACTIVE)
    │
    ├─► PHASE 1: Self-Assessment
    │   Employee rates themselves (1-5) on required competencies
    │   └─► Save scores to user_assessment_details.selfScore
    │
    ├─► PHASE 2: Leader Assessment
    │   Leader reviews self-scores and adds their rating
    │   └─► Save scores to user_assessment_details.leaderScore
    │
    ├─► PHASE 3: Discussion
    │   Leader & Employee meet to agree on final scores
    │   └─► Save final scores to user_assessment_details.finalScore
    │
    └─► PHASE 4: Finalization
        Admin/HR marks assessment as DONE
        └─► Calculate Gap = finalScore - requiredLevel
            └─► Assessment Results available for viewing
```

### 3. Individual Development Plan (IDP) Flow

```
Employee Views Assessment Results
    │
    ├─► Identifies Gaps (competencies below required level)
    │
    └─► Creates IDP
        ├─► Sets development goal
        ├─► Selects timeframe (start/end dates)
        └─► Adds Activities
            ├─► Links to specific competency
            ├─► Chooses activity type (Training, Mentoring, etc.)
            └─► Sets target date

Track Progress
    └─► Mark activities as PENDING → DONE
        └─► Monitor completion percentage
```

### 4. Gap Analysis Calculation

```javascript
// For each competency in assessment:
gap = finalScore - requiredLevel

// Categorization:
if (gap < 0)  → Weakness (needs development)
if (gap === 0) → Meets requirement
if (gap > 0)   → Strength (exceeds requirement)

// Aggregate:
avgGap = sum(gaps) / count(competencies)
```

### 5. Operational Communication Flow (Email System)

```
Event: Assessment Cycle Activation
    └─► Trigger: Admin clicks "Activate"
        └─► System: Finds all cycle participants
            └─► Action: Sends "Cycle Started" email with deep link

Event: Assessment Reminder
    └─► Trigger: Admin clicks "Remind Pending"
        └─► System: Finds users with status != DONE
            └─► Action: Sends "Action Required" email

Event: Self-Assessment Submission
    └─► Trigger: Employee clicks "Submit"
        └─► System: Finds Employee's Team Leader
            └─► Action: Sends "Assessment Submitted" email to Leader
```

---

## Security Model

### Authentication & Authorization

#### 1. **Authentication**

- JWT-based token system
- Token stored in `auth.store` (Zustand)
- Token verified on every server function call via `verifyToken()`

#### 2. **Role-Based Access Control (RBAC)**

```
Role Hierarchy:
ADMIN > HR > LEADER > DEV

Permissions Matrix:
┌────────────────────────┬───────┬────┬────────┬─────┐
│ Action                 │ ADMIN │ HR │ LEADER │ DEV │
├────────────────────────┼───────┼────┼────────┼─────┤
│ Manage Competencies    │   ✓   │ ✓  │   ✗    │  ✗  │
│ Manage Cycles          │   ✓   │ ✓  │   ✗    │  ✗  │
│ View All Assessments   │   ✓   │ ✓  │   ✗    │  ✗  │
│ Assess Team Members    │   ✓   │ ✓  │   ✓    │  ✗  │
│ Self-Assess            │   ✓   │ ✓  │   ✓    │  ✓  │
│ Create IDP             │   ✓   │ ✓  │   ✓    │  ✓  │
│ View Own Assessment    │   ✓   │ ✓  │   ✓    │  ✓  │
└────────────────────────┴───────┴────┴────────┴─────┘
```

#### 3. **Permission Checks**

```typescript
// Example: Only Admin/HR can create competencies
export const verifyAdminOrHR = async (token: string) => {
  const payload = verifyToken(token)
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
  })

  if (!['ADMIN', 'HR'].includes(user.role)) {
    throw new Error('Unauthorized: Admin or HR role required')
  }
}

// Example: Leaders can only assess their team members
export const verifyLeaderAccess = async (
  leaderId: number,
  assessmentId: number,
) => {
  // Check if assessment.user.teamId === leader.teamId
  // AND leader.role === 'LEADER'
}
```

### Data Security

#### 1. **SQL Injection Prevention**

- All queries use Drizzle ORM parameterized queries
- No string concatenation for SQL
- Example:

```typescript
// ✅ SAFE
db.select().from(users).where(eq(users.id, userId))

// ❌ UNSAFE (NOT USED)
db.execute(`SELECT * FROM users WHERE id = ${userId}`)
```

#### 2. **Input Validation**

- All inputs validated with Zod schemas before processing
- Server-side validation (never trust client input)
- Example:

```typescript
const schema = z.object({
  email: z.string().email(),
  score: z.number().int().min(1).max(5),
})
const validated = schema.parse(input) // Throws if invalid
```

#### 3. **Soft Deletes**

- Critical data is never hard-deleted
- `deletedAt` timestamp marks inactive records
- Allows data recovery and audit trails

---

## Key Technical Decisions

### 1. **TanStack Start over Next.js**

**Why**: Better type safety with server functions, simpler data fetching, no API routes boilerplate.

### 2. **Drizzle ORM over Prisma**

**Why**: Lighter weight, SQL-like queries, better PostgreSQL support, easier debugging.

### 3. **Server Functions over REST API**

**Why**:

- Type-safe end-to-end
- No need for separate API layer
- Automatic serialization
- Better dev experience with TanStack Query

### 4. **Zod for Validation**

**Why**:

- Type inference from schemas
- Reusable across client & server
- Better error messages
- Schema-driven development

### 5. **Real vs Integer for Scores**

**Decision**: Use `real` (float) type for average scores
**Reason**: Calculation of averages requires decimal precision (e.g., 3.5, 2.7)

### 6. **Enum Synchronization**

**Challenge**: Keep DB enums and Zod enums in sync
**Solution**:

- Single source of truth in `db/schema.ts`
- Import and reference in Zod schemas where possible
- Document deviations clearly

### 7. **Assessment Workflow States**

```
SELF_ASSESSING → LEADER_ASSESSING → DISCUSSION → DONE
```

**Why**: Clear progression, prevents skipping steps, enforces workflow.

### 8. **IDP Activity Types**

```typescript
;['TRAINING', 'MENTORING', 'PROJECT_CHALLENGE', 'SELF_STUDY']
```

**Why**: Covers major development pathways, generic enough for flexibility.

---

## Performance Considerations

### 1. **Database Indexing**

```sql
-- Primary indexes on foreign keys
CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_cycle_id ON user_assessments(cycle_id);
CREATE INDEX idx_assessment_details_assessment_id ON user_assessment_details(user_assessment_id);
```

### 2. **Query Optimization**

- Use `db.query.table.findFirst()` instead of `findMany()[0]`
- Fetch only required columns with `.select()`
- Eager load relations with `.with()` to avoid N+1 queries

### 3. **Client-Side Caching**

- TanStack Query caches all server function responses
- Stale-while-revalidate strategy
- Optimistic updates for mutations

### 4. **Lazy Loading**

- Routes are code-split automatically by TanStack Router
- Components are lazy-loaded where appropriate

---

## Monitoring & Debugging

### 1. **Error Logging**

- All server functions wrapped in try-catch
- Errors logged with context (userId, action, timestamp)
- User-friendly error messages (no stack traces exposed)

### 2. **Audit Trail**

- Key actions logged: assessment submission, IDP creation, score changes
- `createdAt`, `updatedAt` timestamps on all entities
- Soft deletes preserve historical data

### 3. **Development Tools**

- Drizzle Studio for database inspection
- TanStack Router DevTools for routing debug
- TanStack Query DevTools for cache inspection

---

## Future Scalability

### Potential Bottlenecks & Solutions

1. **Large Competency Lists**
   - Current: Load all in memory
   - Future: Implement virtual scrolling or pagination

2. **Many Concurrent Assessments**
   - Current: Individual queries
   - Future: Batch processing, background jobs

3. **Complex Gap Analysis Reports**
   - Current: Calculate on-demand
   - Future: Pre-compute and cache aggregations

4. **File Attachments for IDP Evidence**
   - Current: Not implemented
   - Future: S3/Cloudflare R2 integration

---

## Deployment Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel / Cloudflare                     │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │         │    Server    │                 │
│  │  (Static)    │◄───────►│  Functions   │                 │
│  └──────────────┘         └──────┬───────┘                 │
└─────────────────────────────────────┼───────────────────────┘
                                      │
                                      │ SSL/TLS
                                      │
                         ┌────────────▼────────────┐
                         │  PostgreSQL Database    │
                         │  (Neon / Supabase /     │
                         │   Railway)              │
                         └─────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: January 16, 2026  
**Maintained By**: Development Team
