# API Documentation - Competency Management System

## Overview

This document describes the server functions (APIs) available for managing the Competency Framework, Assessments, and IDPs.

**Base Location:** `src/server/`

- Competency Dictionary: `competencies.server.ts`
- Assessments & Assignments: `assessments.server.ts`
- IDP & Development: `idp.server.ts`

---

## 1. Assessments & Assignments

### `startMyAssessmentFn` (POST)

- **File:** `assessments.server.ts`
- **Description:** Allows a user (`DEV` or `LEADER`) to self-initiate their assessment for the currently active cycle.
- **Input:**
  - `token`: string (User authentication)
  - `cycleId`: number (ID of the active cycle)
- **Logic:**
  1. Verifies user has a `careerBandId`.
  2. Checks if `cycleId` corresponds to an ACTIVE cycle.
  3. Checks if an assessment already exists/started.
  4. Fetches `competencyRequirements` based on user's Career Band.
  5. Creates `UserAssessment` and populates `UserAssessmentDetails` (scores initialized to null).
- **Response:** `{ success: true, data: UserAssessment }`

### `assignUsersToCycleFn` (POST)

- **File:** `assessments.server.ts`
- **Description:** Bulk assigns assessments to all eligible users for a specific cycle. (Admin/HR only).
- **Input:**
  - `token`: string (Admin/HR authentication)
  - `cycleId`: number
- **Logic:**
  1. Finds all ACTIVE users who have a `careerBandId`.
  2. Filters out users who already have an assessment in this cycle.
  3. Iterates and creates assessments + details for each target user.
- **Response:** `{ success: true, count: number, message: string }`

### `getActiveAssessmentCycleFn` (POST)

- **File:** `competencies.server.ts`
- **Description:** Retrieves the single currently ACTIVE assessment cycle (if any).
- **Input:**
  - `token`: string
- **Response:** `{ success: true, data: AssessmentCycle | undefined }`

---

## 2. Competency Dictionary (Admin)

### `getCompetencyGroupsFn` (POST)

- **Description:** List all groups.

### `getCompetenciesFn` (POST)

- **Description:** List all competencies with levels & group info. `params` supports filtering by `groupId` and `search`.

### `createCompetencyFn` / `updateCompetencyFn`

- **Description:** Full CRUD for competencies, including their 5 proficiency levels.

---

## 3. Requirements Matrix

### `getRequirementsMatrixFn` (POST)

- **Description:** Fetches the entire matrix of Career Bands x Competencies -> Required Level.
- **Response:** `{ careerBands, groups, requirementsMap: { [bandId]: { [compId]: level } } }`

### `setCompetencyRequirementFn` (POST)

- **Description:** Sets or updates a single cell in the matrix.

---

## 4. Assessment Execution

### `getMyAssessmentFn` (GET)

- **Description:** Fetches current user's assessment data, including self/leader scores and feedback.

### `saveSelfAssessmentFn` (POST)

- **Description:** Saves user's self-ratings. Supports draft saving (partial) or submit (final).

### `submitLeaderAssessmentFn` (POST)

- _Pending Implementation (Phase 8)_
