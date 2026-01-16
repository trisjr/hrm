/**
 * User Assessment Server Functions
 * Handle individual competency assessments workflow
 */
import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import {
  createUserAssessmentSchema,
  finalizeAssessmentSchema,
  submitLeaderAssessmentSchema,
  submitSelfAssessmentSchema,
} from '@/lib/competency.schemas'
import { db } from '@/db'
import {
  assessmentCycles,
  competencies,
  competencyGroups,
  competencyRequirements,
  userAssessmentDetails,
  userAssessments,
  users,
} from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify user authentication
 */
async function verifyUser(token: string) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
    with: {
      role: true,
      team: true,
      careerBand: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

/**
 * Verify Admin or HR role
 */
async function verifyAdminOrHR(token: string) {
  const user = await verifyUser(token)

  if (!user.role || !['ADMIN', 'HR'].includes(user.role.roleName)) {
    throw new Error('Insufficient permissions. Admin or HR role required.')
  }

  return user
}

// ==================== USER ASSESSMENT FUNCTIONS ====================

/**
 * Create assessment for a user (Admin/HR only)
 */
export const createUserAssessmentFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: createUserAssessmentSchema,
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  const { userId, cycleId } = data.data

  // Check if user exists
  const targetUser = await db.query.users.findFirst({
    where: and(eq(users.id, userId), isNull(users.deletedAt)),
    with: { careerBand: true },
  })

  if (!targetUser) {
    throw new Error('User not found')
  }

  if (!targetUser.careerBandId) {
    throw new Error('User does not have a career band assigned')
  }

  // Check if cycle exists
  const cycle = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.id, cycleId),
  })

  if (!cycle) {
    throw new Error('Assessment cycle not found')
  }

  // Check if assessment already exists
  const existing = await db.query.userAssessments.findFirst({
    where: and(
      eq(userAssessments.userId, userId),
      eq(userAssessments.cycleId, cycleId),
    ),
  })

  if (existing) {
    throw new Error('Assessment already exists for this user in this cycle')
  }

  // Create assessment
  const [newAssessment] = await db
    .insert(userAssessments)
    .values({
      userId,
      cycleId,
      status: 'SELF_ASSESSING',
    })
    .returning()

  // Get all competencies required for user's career band
  const requirements = await db
    .select({
      competencyId: competencyRequirements.competencyId,
      requiredLevel: competencyRequirements.requiredLevel,
    })
    .from(competencyRequirements)
    .where(eq(competencyRequirements.careerBandId, targetUser.careerBandId))

  // Create assessment details for each competency
  if (requirements.length > 0) {
    const detailsValues = requirements.map((req) => ({
      userAssessmentId: newAssessment.id,
      competencyId: req.competencyId,
    }))

    await db.insert(userAssessmentDetails).values(detailsValues)
  }

  return {
    success: true,
    data: newAssessment,
  }
})

/**
 * Get my assessment (for current user)
 */
export const getMyAssessmentFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      params: z
        .object({
          cycleId: z.number().int().positive().optional(),
        })
        .optional(),
    })
    const data = schema.parse(ctx.data)

    const user = await verifyUser(data.token)

    // Find assessment
    const filters: any[] = [eq(userAssessments.userId, user.id)]
    if (data.params?.cycleId) {
      filters.push(eq(userAssessments.cycleId, data.params.cycleId))
    }

    const assessment = await db.query.userAssessments.findFirst({
      where: and(...filters),
      with: {
        cycle: true,
      },
      orderBy: (userAssessments, { desc }) => [desc(userAssessments.createdAt)],
    })

    if (!assessment) {
      return {
        success: true,
        data: null,
      }
    }

    // Get assessment details with competency info
    const details = await db
      .select({
        id: userAssessmentDetails.id,
        competencyId: userAssessmentDetails.competencyId,
        selfScore: userAssessmentDetails.selfScore,
        leaderScore: userAssessmentDetails.leaderScore,
        finalScore: userAssessmentDetails.finalScore,
        note: userAssessmentDetails.note,
        competency: competencies,
        group: competencyGroups,
        requiredLevel: competencyRequirements.requiredLevel,
      })
      .from(userAssessmentDetails)
      .leftJoin(
        competencies,
        eq(userAssessmentDetails.competencyId, competencies.id),
      )
      .leftJoin(competencyGroups, eq(competencies.groupId, competencyGroups.id))
      .leftJoin(
        competencyRequirements,
        and(
          eq(
            competencyRequirements.competencyId,
            userAssessmentDetails.competencyId,
          ),
          eq(competencyRequirements.careerBandId, user.careerBandId!),
        ),
      )
      .where(eq(userAssessmentDetails.userAssessmentId, assessment.id))

    // Get levels for all competencies involved
    const competencyIds = details.map((d) => d.competencyId)
    const levels = await db.query.competencyLevels.findMany({
      where: (levels, { inArray }) =>
        inArray(levels.competencyId, competencyIds),
      orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
    })

    // Attach levels to details
    const detailsWithLevels = details.map((d) => ({
      ...d,
      competency: {
        ...d.competency,
        competencyLevels: levels.filter(
          (l) => l.competencyId === d.competencyId,
        ),
      },
    }))

    // Calculate stats
    const selfScores = details
      .filter((d) => d.selfScore !== null)
      .map((d) => d.selfScore!)
    const leaderScores = details
      .filter((d) => d.leaderScore !== null)
      .map((d) => d.leaderScore!)
    const finalScores = details
      .filter((d) => d.finalScore !== null)
      .map((d) => d.finalScore!)

    const stats = {
      avgSelf:
        selfScores.length > 0
          ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length
          : null,
      avgLeader:
        leaderScores.length > 0
          ? leaderScores.reduce((a, b) => a + b, 0) / leaderScores.length
          : null,
      avgFinal:
        finalScores.length > 0
          ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length
          : null,
      avgGap: null as number | null,
    }

    // Calculate average gap
    if (stats.avgFinal !== null) {
      const gaps = details
        .filter((d) => d.finalScore !== null && d.requiredLevel !== null)
        .map((d) => d.finalScore! - d.requiredLevel!)
      stats.avgGap =
        gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null
    }

    return {
      success: true,
      data: {
        assessment,
        details: detailsWithLevels,
        stats,
      },
    }
  },
)

/**
 * Submit self-assessment scores
 */
export const submitSelfAssessmentFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: submitSelfAssessmentSchema,
  })
  const data = schema.parse(ctx.data)

  const user = await verifyUser(data.token)

  const { assessmentId, scores } = data.data

  // Verify assessment belongs to user
  const assessment = await db.query.userAssessments.findFirst({
    where: eq(userAssessments.id, assessmentId),
  })

  if (!assessment) {
    throw new Error('Assessment not found')
  }

  if (assessment.userId !== user.id) {
    throw new Error('You can only submit your own assessment')
  }

  if (assessment.status !== 'SELF_ASSESSING') {
    throw new Error('Self-assessment has already been submitted')
  }

  // Update scores
  for (const score of scores) {
    await db
      .update(userAssessmentDetails)
      .set({
        selfScore: score.score,
        note: score.note || null,
      })
      .where(
        and(
          eq(userAssessmentDetails.userAssessmentId, assessmentId),
          eq(userAssessmentDetails.competencyId, score.competencyId),
        ),
      )
  }

  // Calculate average self score
  const allDetails = await db
    .select({ selfScore: userAssessmentDetails.selfScore })
    .from(userAssessmentDetails)
    .where(eq(userAssessmentDetails.userAssessmentId, assessmentId))

  const selfScores = allDetails
    .filter((d) => d.selfScore !== null)
    .map((d) => d.selfScore!)
  const avgSelf =
    selfScores.length > 0
      ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length
      : null

  // Update assessment status
  await db
    .update(userAssessments)
    .set({
      status: 'LEADER_ASSESSING',
      selfScoreAvg: avgSelf,
    })
    .where(eq(userAssessments.id, assessmentId))

  // TODO: Notify leader

  return {
    success: true,
    message: 'Self-assessment submitted successfully',
  }
})

/**
 * Submit leader assessment scores
 */
export const submitLeaderAssessmentFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: submitLeaderAssessmentSchema,
  })
  const data = schema.parse(ctx.data)

  const user = await verifyUser(data.token)

  const { assessmentId, scores } = data.data

  // Verify assessment exists
  const assessment = await db.query.userAssessments.findFirst({
    where: eq(userAssessments.id, assessmentId),
    with: {
      user: {
        with: {
          team: true,
        },
      },
    },
  })

  if (!assessment) {
    throw new Error('Assessment not found')
  }

  // Verify user is the team leader
  if (!assessment.user.team || assessment.user.team.leaderId !== user.id) {
    throw new Error('Only the team leader can submit leader assessment')
  }

  if (assessment.status !== 'LEADER_ASSESSING') {
    throw new Error('Assessment is not ready for leader review')
  }

  // Update scores
  for (const score of scores) {
    await db
      .update(userAssessmentDetails)
      .set({
        leaderScore: score.score,
        note: score.note || null,
      })
      .where(
        and(
          eq(userAssessmentDetails.userAssessmentId, assessmentId),
          eq(userAssessmentDetails.competencyId, score.competencyId),
        ),
      )
  }

  // Calculate average leader score
  const allDetails = await db
    .select({ leaderScore: userAssessmentDetails.leaderScore })
    .from(userAssessmentDetails)
    .where(eq(userAssessmentDetails.userAssessmentId, assessmentId))

  const leaderScores = allDetails
    .filter((d) => d.leaderScore !== null)
    .map((d) => d.leaderScore!)
  const avgLeader =
    leaderScores.length > 0
      ? leaderScores.reduce((a, b) => a + b, 0) / leaderScores.length
      : null

  // Update assessment status
  await db
    .update(userAssessments)
    .set({
      status: 'DISCUSSION',
      leaderScoreAvg: avgLeader,
    })
    .where(eq(userAssessments.id, assessmentId))

  return {
    success: true,
    message: 'Leader assessment submitted successfully',
  }
})

/**
 * Finalize assessment (Admin/HR only)
 */
export const finalizeAssessmentFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: finalizeAssessmentSchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { assessmentId, finalScores, feedback } = data.data

    // Verify assessment exists
    const assessment = await db.query.userAssessments.findFirst({
      where: eq(userAssessments.id, assessmentId),
      with: {
        user: {
          with: {
            careerBand: true,
          },
        },
      },
    })

    if (!assessment) {
      throw new Error('Assessment not found')
    }

    if (assessment.status === 'DONE') {
      throw new Error('Assessment has already been finalized')
    }

    // Update final scores
    for (const score of finalScores) {
      await db
        .update(userAssessmentDetails)
        .set({
          finalScore: score.finalScore,
        })
        .where(
          and(
            eq(userAssessmentDetails.userAssessmentId, assessmentId),
            eq(userAssessmentDetails.competencyId, score.competencyId),
          ),
        )
    }

    // Calculate average final score and gap
    const details = await db
      .select({
        finalScore: userAssessmentDetails.finalScore,
        requiredLevel: competencyRequirements.requiredLevel,
      })
      .from(userAssessmentDetails)
      .leftJoin(
        competencyRequirements,
        and(
          eq(
            competencyRequirements.competencyId,
            userAssessmentDetails.competencyId,
          ),
          eq(
            competencyRequirements.careerBandId,
            assessment.user.careerBandId!,
          ),
        ),
      )
      .where(eq(userAssessmentDetails.userAssessmentId, assessmentId))

    const finalScoresArr = details
      .filter((d) => d.finalScore !== null)
      .map((d) => d.finalScore!)
    const avgFinal =
      finalScoresArr.length > 0
        ? finalScoresArr.reduce((a, b) => a + b, 0) / finalScoresArr.length
        : null

    const gaps = details
      .filter((d) => d.finalScore !== null && d.requiredLevel !== null)
      .map((d) => d.finalScore! - d.requiredLevel!)
    const avgGap =
      gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null

    // Update assessment
    await db
      .update(userAssessments)
      .set({
        status: 'DONE',
        finalScoreAvg: avgFinal,
        feedback: feedback || null,
      })
      .where(eq(userAssessments.id, assessmentId))

    return {
      success: true,
      message: 'Assessment finalized successfully',
      data: {
        avgFinal,
        avgGap,
      },
    }
  },
)

/**
 * Get all assessments for a cycle (Admin/HR only)
 */
export const getAssessmentsByCycleFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    params: z.object({
      cycleId: z.number().int().positive(),
    }),
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  const assessments = await db.query.userAssessments.findMany({
    where: eq(userAssessments.cycleId, data.params.cycleId),
    with: {
      user: {
        with: {
          profile: true,
          careerBand: true,
          team: true,
        },
      },
      cycle: true,
    },
    orderBy: (userAssessments, { desc }) => [desc(userAssessments.createdAt)],
  })

  return {
    success: true,
    data: assessments,
  }
})

/**
 * Get assessment by ID (for Admin/HR/Leader)
 */
export const getAssessmentByIdFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      params: z.object({
        assessmentId: z.number().int().positive(),
      }),
    })
    const data = schema.parse(ctx.data)

    const user = await verifyUser(data.token)
    const { assessmentId } = data.params

    // Find assessment
    const assessment = await db.query.userAssessments.findFirst({
      where: eq(userAssessments.id, assessmentId),
      with: {
        cycle: true,
        user: {
          with: {
            profile: true,
            team: true,
            careerBand: true,
          },
        },
      },
    })

    if (!assessment) {
      throw new Error('Assessment not found')
    }

    // Check permissions
    const isAdminOrHR =
      user.role?.roleName === 'ADMIN' || user.role?.roleName === 'HR'
    const isOwner = assessment.userId === user.id
    const isLeader =
      assessment.user.team?.leaderId === user.id &&
      assessment.user.id !== user.id

    if (!isAdminOrHR && !isOwner && !isLeader) {
      throw new Error('You do not have permission to view this assessment')
    }

    // Get assessment details with competency info
    const details = await db
      .select({
        id: userAssessmentDetails.id,
        competencyId: userAssessmentDetails.competencyId,
        selfScore: userAssessmentDetails.selfScore,
        leaderScore: userAssessmentDetails.leaderScore,
        finalScore: userAssessmentDetails.finalScore,
        note: userAssessmentDetails.note,
        competency: competencies,
        group: competencyGroups,
        requiredLevel: competencyRequirements.requiredLevel,
      })
      .from(userAssessmentDetails)
      .leftJoin(
        competencies,
        eq(userAssessmentDetails.competencyId, competencies.id),
      )
      .leftJoin(competencyGroups, eq(competencies.groupId, competencyGroups.id))
      .leftJoin(
        competencyRequirements,
        and(
          eq(
            competencyRequirements.competencyId,
            userAssessmentDetails.competencyId,
          ),
          eq(
            competencyRequirements.careerBandId,
            assessment.user.careerBandId!,
          ),
        ),
      )
      .where(eq(userAssessmentDetails.userAssessmentId, assessment.id))

    // Get levels for all competencies involved
    const competencyIds = details.map((d) => d.competencyId)
    const levels = await db.query.competencyLevels.findMany({
      where: (levels, { inArray }) =>
        inArray(levels.competencyId, competencyIds),
      orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
    })

    // Attach levels to details
    const detailsWithLevels = details.map((d) => ({
      ...d,
      competency: {
        ...d.competency,
        competencyLevels: levels.filter(
          (l) => l.competencyId === d.competencyId,
        ),
      },
    }))

    // Calculate stats
    const selfScores = details
      .filter((d) => d.selfScore !== null)
      .map((d) => d.selfScore!)
    const leaderScores = details
      .filter((d) => d.leaderScore !== null)
      .map((d) => d.leaderScore!)
    const finalScores = details
      .filter((d) => d.finalScore !== null)
      .map((d) => d.finalScore!)

    const stats = {
      avgSelf:
        selfScores.length > 0
          ? selfScores.reduce((a, b) => a + b, 0) / selfScores.length
          : null,
      avgLeader:
        leaderScores.length > 0
          ? leaderScores.reduce((a, b) => a + b, 0) / leaderScores.length
          : null,
      avgFinal:
        finalScores.length > 0
          ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length
          : null,
      avgGap: null as number | null,
    }

    if (stats.avgFinal !== null) {
      const gaps = details
        .filter((d) => d.finalScore !== null && d.requiredLevel !== null)
        .map((d) => d.finalScore! - d.requiredLevel!)
      stats.avgGap =
        gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null
    }

    return {
      success: true,
      data: {
        assessment,
        details: detailsWithLevels,
        stats,
        meta: {
          isLeader,
          isAdminOrHR,
          isOwner,
        },
      },
    }
  },
)
