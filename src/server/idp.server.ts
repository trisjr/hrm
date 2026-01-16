import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import {
  createIDPSchema,
  updateIDPActivitySchema,
} from '@/lib/competency.schemas'
import { db } from '@/db'
import {
  idpActivities,
  individualDevelopmentPlans,
  userAssessments,
  users,
} from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

/**
 * Helper: Verify User
 */
async function verifyUser(token: string) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
  })
  if (!user) throw new Error('User not found')
  return user
}

/**
 * Create a new Individual Development Plan (IDP)
 * 
 * @description Creates an IDP with multiple development activities linked to competencies.
 * Typically created after reviewing assessment results to address skill gaps.
 * 
 * **Workflow**:
 * 1. Verify user authentication
 * 2. Validate optional assessment linkage (if assessmentId provided)
 * 3. Create main IDP record with goal and timeframe
 * 4. Create activity records for each development action
 * 5. Link activities to specific competencies to improve
 * 
 * **Business Rules**:
 * - User can create IDP independently or from assessment results
 * - Assessment link is optional but recommended for tracking
 * - Each activity must target a specific competency
 * - Activities support 4 types: TRAINING, MENTORING, PROJECT_CHALLENGE, SELF_STUDY
 * - Only one IN_PROGRESS IDP per user at a time (UI enforced)
 * 
 * @param token - JWT authentication token
 * @param data.assessmentId - Optional assessment ID to link (for gap-based IDPs)
 * @param data.goal - Overall development goal statement
 * @param data.startDate - Plan start date (YYYY-MM-DD)
 * @param data.endDate - Plan target completion date (YYYY-MM-DD)
 * @param data.activities - Array of development activities
 * 
 * @throws {Error} Invalid assessment ID (not found or not owned)
 * @throws {Error} Validation errors (Zod schema)
 * 
 * @returns Created IDP record
 */
export const createIDPFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: createIDPSchema,
    })
    const data = schema.parse(ctx.data)
    const user = await verifyUser(data.token)

    const { assessmentId, goal, startDate, endDate, activities } = data.data

    // If assessmentId is provided, verify it belongs to user
    if (assessmentId) {
      const assessment = await db.query.userAssessments.findFirst({
        where: eq(userAssessments.id, assessmentId),
      })
      if (!assessment || assessment.userId !== user.id) {
        throw new Error('Invalid assessment ID')
      }
    }

    // Insert IDP
    const [newIDP] = await db
      .insert(individualDevelopmentPlans)
      .values({
        userId: user.id,
        userAssessmentId: assessmentId,
        goal,
        startDate,
        endDate,
        status: 'IN_PROGRESS',
      })
      .returning()

    // Insert Activities
    if (activities.length > 0) {
      const activityValues = activities.map((act) => ({
        idpId: newIDP.id,
        competencyId: act.competencyId,
        activityType: act.activityType,
        description: act.description,
        evidence: act.successCriteria || null,
        dueDate: act.targetDate || null,
        status: 'PENDING' as const,
      }))

      await db.insert(idpActivities).values(activityValues)
    }

    return {
      success: true,
      message: 'IDP created successfully',
      data: newIDP,
    }
  },
)

/**
 * Get user's active Individual Development Plan
 * 
 * @description Fetches the most recent IN_PROGRESS IDP for the current user,
 * including all activities and their completion status.
 * 
 * **Use Cases**:
 * - Display IDP dashboard with progress tracking
 * - Check if user has active IDP before allowing new creation
 * - Monitor activity completion rates
 * 
 * @param token - JWT authentication token
 * 
 * @returns IDP with activities array, or null if no active IDP
 */
export const getMyActiveIDPFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({ token: z.string() })
    const { token } = schema.parse(ctx.data)
    const user = await verifyUser(token)

    // Find latest active IDP
    const idp = await db.query.individualDevelopmentPlans.findFirst({
      where: and(
        eq(individualDevelopmentPlans.userId, user.id),
        eq(individualDevelopmentPlans.status, 'IN_PROGRESS'),
      ),
      orderBy: [desc(individualDevelopmentPlans.createdAt)],
      with: {
        assessment: {
          with: { cycle: true },
        },
      },
    })

    if (!idp) {
      return { success: true, data: null }
    }

    // Get activities
    const activities = await db.query.idpActivities.findMany({
      where: eq(idpActivities.idpId, idp.id),
      with: {
        competency: true,
      },
      orderBy: [desc(idpActivities.dueDate)],
    })

    return {
      success: true,
      data: {
        idp,
        activities,
      },
    }
  },
)

/**
 * Update Activity Status
 */
export const updateActivityStatusFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: updateIDPActivitySchema,
  })
  const { token, data } = schema.parse(ctx.data)
  const user = await verifyUser(token)

  // Verify activity belongs to user's IDP
  const activity = await db.query.idpActivities.findFirst({
    where: eq(idpActivities.id, data.activityId),
    with: {
      idp: true,
    },
  })

  if (!activity || !activity.idp) {
    throw new Error('Activity not found')
  }

  // Check IDP ownership (using loose check via idp relation if defined, else manual query)
  // Since idp relation is defined in schema (we assume), we check userId
  // Need to query IDP to check user ID if relation is not auto-fetched with id?
  // Wait, db.query...with idp fetches the relation.
  // But we need to ensure typescript types.
  // Let's double check relation in schema.ts

  // Assuming relation exists. If NOT, query IDP manually.
  // Safe way:
  const idp = await db.query.individualDevelopmentPlans.findFirst({
    where: eq(individualDevelopmentPlans.id, activity.idpId),
  })

  if (!idp || idp.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  await db
    .update(idpActivities)
    .set({
      status: data.status,
      evidence: data.result || activity.evidence, // Update evidence/result
    })
    .where(eq(idpActivities.id, data.activityId))

  return { success: true, message: 'Activity updated' }
})
