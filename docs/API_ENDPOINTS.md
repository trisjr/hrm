# API Documentation - Team Management

## Overview

This document describes the server functions (APIs) available for managing teams in the HRM system. All functions are defined in `src/server/teams.server.ts` and require a valid Admin or HR token.

---

## 1. Team CRUD

### `createTeamFn` (POST)

- **Description:** Creates a new team.
- **Input:**
  - `token`: string
  - `data`: `{ teamName: string, description?: string, leaderId?: number }`
- **Validation:** `teamName` must be unique (case-insensitive).
- **Response:** `{ success: true, data: TeamResponse }`

### `getTeamsFn` (POST)

- **Description:** Retrieves a paginated list of teams with filters.
- **Input:**
  - `token`: string
  - `params?`: `{ page, limit, search, filterHasLeader, includeDeleted }`
- **Response:** `PaginatedTeams` (data, total, page, limit, totalPages)

### `getTeamByIdFn` (POST)

- **Description:** Gets detailed information about a specific team, its leader, members, and performance stats.
- **Input:**
  - `token`: string
  - `params`: `{ teamId: number }`
- **Response:** `TeamDetail` (includes members array and stats object)

### `updateTeamFn` (POST)

- **Description:** Updates team information or changes the leader.
- **Input:**
  - `token`: string
  - `data`: `{ teamId, data: { teamName?, description?, leaderId? } }`
- **Validation:** `leaderId` must refer to an existing team member.
- **Response:** `{ success: true, data: TeamResponse }`

### `deleteTeamFn` (POST)

- **Description:** Soft-deletes a team and unassigns all members.
- **Input:**
  - `token`: string
  - `data`: `{ teamId: number }`
- **Logic:** Sets `deletedAt` for the team, sets `teamId = null` for all members, and sends notifications.
- **Response:** `{ success: true, affectedMembers: number }`

---

## 2. Member & Leadership

### `addMemberToTeamFn` (POST)

- **Description:** Assigns a user to a team.
- **Input:**
  - `token`: string
  - `data`: `{ teamId, userId }`
- **Logic:** Updates `user.teamId`, moves user from previous team if applicable, and sends a welcome email.
- **Response:** `{ success: true, newMemberCount }`

### `removeMemberFromTeamFn` (POST)

- **Description:** Removes a user from a team.
- **Input:**
  - `token`: string
  - `data`: `{ teamId, userId }`
- **Logic:** Clears `user.teamId`. If the user was the leader, `teams.leaderId` is also cleared.
- **Response:** `{ success: true }`

### `assignLeaderFn` (POST)

- **Description:** Assigns a specific member as the team leader.
- **Input:**
  - `token`: string
  - `data`: `{ teamId, leaderId: number | null }`
- **Logic:** Verifies membership, updates `teams.leaderId`, and updates the user's role to `LEADER`.
- **Response:** `{ success: true }`

---

## 3. Analytics

### `getTeamAnalyticsFn` (POST)

- **Description:** Aggregates performance data for teams.
- **Input:**
  - `token`: string
  - `params?`: `{ startDate, endDate }`
- **Response:** `{ totalTeams, avgTeamSize, teamsWithoutLeader, teamSizeDistribution[], requestApprovalRates[] }`

---

## 4. Competency Operations

### `updateAssessmentCycleStatusFn` (POST)

- **Description:** Updates cycle status (ACTIVE/COMPLETED/DRAFT) and triggers automated emails.
- **Input:**
  - `token`: string
  - `data`: `{ cycleId, status: 'ACTIVE'|'COMPLETED'|'DRAFT' }`
- **Logic:**
  - If status becomes `ACTIVE`: Sends `ASSESSMENT_CYCLE_STARTED` emails to all participants.
- **Response:** `{ success: true, message: string }`

### `remindPendingAssessmentsFn` (POST)

- **Description:** Sends reminder emails to participants with incomplete assessments.
- **Input:**
  - `token`: string
  - `data`: `{ cycleId }`
- **Logic:** filters `userAssessments` where status != 'DONE' and sends `ASSESSMENT_REMINDER` email.
- **Response:** `{ success: true, sentCount: number }`

### `getTeamIDPsFn` (POST)

- **Description:** (Leader) Retrieves list of Team Members' IDPs with progress stats.
- **Input:**
  - `token`: string
- **Response:** `{ success: true, data: IDP[] }`

### `getIDPByIdFn` (POST)

- **Description:** Retrieves detailed IDP information. Enforces Ownership or Leader access.
- **Input:**
  - `token`: string
  - `data`: `{ idpId }`
- **Validation:** Throws if requester is NOT owner AND NOT leader.
- **Response:** `{ success: true, data: IDP }`

### `getMyAssessmentsHistoryFn` (POST)

- **Description:** Retrieves all historical assessments for the current user.
- **Input:**
  - `token`: string
- **Response:** `{ success: true, data: Assessment[] }`

---

## 5. Skills Management

### `searchMasterSkillsFn` (POST)

- **Description:** Search for master skills.
- **Input:** `{ token: string, query: string, type?: 'HARD_SKILL' | 'SOFT_SKILL' }`

### `upsertUserSkillFn` (POST)

- **Description:** Add or update a user skill.
- **Input:** `{ token: string, skillId: number, levelId: number, note?: string }`

### `deleteUserSkillFn` (POST)

- **Description:** Remove a skill from user profile.
- **Input:** `{ token: string, userSkillId: number }`

---

## 6. CV Builder

### `getCVDataFn` (POST)

- **Description:** Retrieve all data needed for CV generation.
- **Input:** `{ token: string, userId?: number }`

### `updateProfileSummaryFn` (POST)

- **Description:** Update user's professional summary.
- **Input:** `{ token: string, summary: string }`

---

## 7. Dashboard

### `getDashboardStatsFn` (POST)

- **Description:** Get aggregated statistics for the personalized dashboard.
- **Input:** `{ token: string }`
