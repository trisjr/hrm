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
 * Create new IDP
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
 * Get My Active IDP
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
