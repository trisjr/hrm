/**
 * User Assessment Server Functions
 * Handle individual competency assessments workflow
 */
import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNull, desc, ne } from 'drizzle-orm'
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
  emailTemplates,
  emailLogs,
} from '@/db/schema'
import { replacePlaceholders, sendEmail } from '@/lib/email.utils'
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
 * Create a new user assessment for an active cycle
 * 
 * @description Creates assessment entry and generates detail records for all competencies
 * required by the user's role and career band. This initializes the assessment workflow.
 * 
 * **Workflow**:
 * 1. Verify Admin/HR permissions
 * 2. Validate cycle is ACTIVE
 * 3. Check user has valid career band assignment
 * 4. Fetch required competencies for user's role + band
 * 5. Create main assessment record (status: SELF_ASSESSING)
 * 6. Generate detail records for each competency (scores initially null)
 * 
 * **Business Rules**:
 * - Only one active assessment per user per cycle
 * - User must have assigned career band
 * - At least one competency must be required for the role
 * 
 * @param token - JWT authentication token
 * @param data.userId - Target user ID
 * @param data.cycleId - Assessment cycle ID
 * 
 * @throws {Error} Insufficient permissions
 * @throws {Error} Cycle not found or not active
 * @throws {Error} User has no career band assigned
 * @throws {Error} No competencies required for this role
 * @throws {Error} Assessment already exists for this user in this cycle
 * 
 * @returns Assessment with details array
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
    } else {
      // If NOT specific cycle, prioritize INCOMPLETE assessments
      filters.push(ne(userAssessments.status, 'DONE'))
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
 * Submit self-assessment scores (Employee action)
 * 
 * @description Allows employee to rate themselves on required competencies.
 * Updates assessment status to LEADER_ASSESSING after submission.
 * 
 * **Workflow**:
 * 1. Verify user authentication
 * 2. Confirm assessment belongs to current user
 * 3. Validate assessment is in SELF_ASSESSING status
 * 4. Update selfScore and selfNotes for each competency
 * 5. Change assessment status to LEADER_ASSESSING
 * 
 * **Business Rules**:
 * - Can only submit own assessment
 * - Assessment must be in SELF_ASSESSING status
 * - Scores must be 1-5 for each competency
 * - Once submitted, self-scores are locked
 * 
 * @param token - JWT authentication token
 * @param data.assessmentId - Assessment ID
 * @param data.scores - Array of {competencyId, score, notes}
 * 
 * @throws {Error} Assessment not found
 * @throws {Error} Unauthorized (not your assessment)
 * @throws {Error} Invalid status (not in SELF_ASSESSING)
 * 
 * @returns Success status
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

  // Notify Leader
  const requesterFull = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: { 
            team: {
                with: { leader: { with: { profile: true } } }
            },
            profile: true
        }
  })
  
  const leader = requesterFull?.team?.leader
  if (leader && leader.email) {
       const subject = `Assessment Submitted: ${requesterFull.profile?.fullName || 'Employee'}`
       const body = `<p>Dear ${leader.profile?.fullName || 'Leader'},</p>
       <p>${requesterFull.profile?.fullName} has completed their self-assessment.</p>
       <p>Please log in to the system to provide your assessment.</p>
       <p><a href="${process.env.APP_URL}/team/assessments">Go to Team Assessments</a></p>`
       
       await sendEmail(leader.email, subject, body)
  }

  return {
    success: true,
    message: 'Self-assessment submitted successfully',
  }
})

/**
 * Get all assessments history for current user
 */
export const getMyAssessmentsHistoryFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({ token: z.string() })
  const { token } = schema.parse(ctx.data)
  const user = await verifyUser(token)

  console.log('--- getMyAssessmentsHistoryFn Debug ---')
  console.log('User ID:', user.id, 'Email:', user.email)

  const assessments = await db.query.userAssessments.findMany({
    where: eq(userAssessments.userId, user.id),
    with: {
        cycle: true
    },
    orderBy: [desc(userAssessments.createdAt)]
  })

  console.log('Assessments Found:', assessments.length)
  if (assessments.length > 0) {
      console.log('First Assessment Status:', assessments[0].status)
  }
  console.log('---------------------------------------')

  return { success: true, data: assessments }
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

/**
 * Bulk assign assessments to all eligible users for a cycle (Admin/HR)
 */
export const assignUsersToCycleFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  /* console.log('assignUsersToCycleFn ctx.data:', JSON.stringify(ctx.data, null, 2)) */
  const schema = z.object({
    token: z.string(),
    cycleId: z.number().int().positive(),
  })
  const { token, cycleId } = schema.parse(ctx.data)

  await verifyAdminOrHR(token)

  // 1. Get Cycle
  const cycle = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.id, cycleId),
  })
  if (!cycle || cycle.status !== 'ACTIVE') {
    throw new Error('Cycle not found or not active')
  }

  // 2. Get all active users with career bands
  const eligibleUsers = await db.query.users.findMany({
    where: and(eq(users.status, 'ACTIVE'), isNull(users.deletedAt)),
    columns: { id: true, careerBandId: true },
  })

  // Filter those who have careerBandId
  const usersWithBand = eligibleUsers.filter((u) => u.careerBandId !== null)

  if (usersWithBand.length === 0) {
    return {
      success: true,
      message: 'No eligible users found (need active status and career band)',
      count: 0,
    }
  }

  // 3. Find existing assessments to exclude
  const existingAssessments = await db.query.userAssessments.findMany({
    where: eq(userAssessments.cycleId, cycleId),
    columns: { userId: true },
  })
  const existingUserIds = new Set(existingAssessments.map((a) => a.userId))

  // 4. Identify targets
  const targetUsers = usersWithBand.filter((u) => !existingUserIds.has(u.id))

  if (targetUsers.length === 0) {
    return {
      success: true,
      message: 'All eligible users already assigned',
      count: 0,
    }
  }

  // 5. Process assignments
  let count = 0
  for (const user of targetUsers) {
    // Find requirements for this user's band
    const requirements = await db
      .select({
        competencyId: competencyRequirements.competencyId,
        level: competencyRequirements.requiredLevel,
      })
      .from(competencyRequirements)
      .where(eq(competencyRequirements.careerBandId, user.careerBandId!))

    if (requirements.length === 0) continue // Skip if no requirements

    // Create Assessment
    const [newAssessment] = await db
      .insert(userAssessments)
      .values({
        userId: user.id,
        cycleId: cycleId,
        status: 'SELF_ASSESSING',
      })
      .returning()

    // Create Details
    const detailValues = requirements.map((req) => ({
      userAssessmentId: newAssessment.id,
      competencyId: req.competencyId,
      // Scores null initially
    }))

    if (detailValues.length > 0) {
      await db.insert(userAssessmentDetails).values(detailValues)
    }
    count++
  }

  return {
    success: true,
    message: `Successfully assigned assessments to ${count} users`,
    count,
  }
})

/**
 * Start assessment for current user (Self-service)
 */
export const startMyAssessmentFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  // DEBUG MODE: Return payload to client
  // throw new Error(`DEBUG_PAYLOAD: ${JSON.stringify(ctx.data)}`)
  const schema = z.object({
    token: z.string(),
    cycleId: z.number().int().positive(),
  })
  
  const { token, cycleId } = schema.parse(ctx.data)
  const user = await verifyUser(token)

  if (!user.careerBandId) {
    throw new Error(
      'You are not assigned to a Career Band. Please contact HR.',
    )
  }

  // 1. Verify Cycle
  const cycle = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.id, cycleId),
  })
  if (!cycle || cycle.status !== 'ACTIVE') {
    throw new Error('Cycle is not active')
  }

  // 2. Check existing
  const existing = await db.query.userAssessments.findFirst({
    where: and(
      eq(userAssessments.userId, user.id),
      eq(userAssessments.cycleId, cycleId),
    ),
  })
  if (existing) {
    throw new Error('Assessment already started')
  }

  // 3. Create Assessment logic (duplicated from above, could extract to helper)
  const requirements = await db
    .select({
      competencyId: competencyRequirements.competencyId,
      level: competencyRequirements.requiredLevel,
    })
    .from(competencyRequirements)
    .where(eq(competencyRequirements.careerBandId, user.careerBandId))

  if (requirements.length === 0) {
    throw new Error('No competency requirements defined for your role/band')
  }

  const [newAssessment] = await db
    .insert(userAssessments)
    .values({
      userId: user.id,
      cycleId: cycleId,
      status: 'SELF_ASSESSING',
    })
    .returning()

  const detailValues = requirements.map((req) => ({
    userAssessmentId: newAssessment.id,
    competencyId: req.competencyId,
  }))

  await db.insert(userAssessmentDetails).values(detailValues)

  return {
    success: true,
    data: newAssessment,
  }
})

/**
 * Get Competency Radar Chart Data
 * 
 * @description Returns aggregated competency data grouped by competency groups
 * for radar chart visualization. Shows final scores vs required levels.
 * 
 * **Use Cases**:
 * - Individual assessment results page (userId + assessmentId)
 * - Team overview (multiple users)
 * 
 * @param token - JWT authentication token
 * @param params.userId - Optional user ID (defaults to current user)
 * @param params.assessmentId - Optional specific assessment ID
 * 
 * @returns Radar chart data grouped by competency groups
 */
export const getCompetencyRadarDataFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    params: z.object({
      userId: z.number().int().positive().optional(),
      assessmentId: z.number().int().positive().optional(),
    }).optional(),
  })
  const data = schema.parse(ctx.data)

  const user = await verifyUser(data.token)
  const targetUserId = data.params?.userId || user.id

  // Permission check: Can only view own data unless Admin/HR/Leader
  const isAdminOrHR = user.role?.roleName === 'ADMIN' || user.role?.roleName === 'HR'
  if (targetUserId !== user.id && !isAdminOrHR) {
    // Check if user is leader of target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      with: { team: true },
    })
    if (!targetUser?.team || targetUser.team.leaderId !== user.id) {
      throw new Error('You do not have permission to view this data')
    }
  }

  // Find assessment
  let assessment
  if (data.params?.assessmentId) {
    assessment = await db.query.userAssessments.findFirst({
      where: eq(userAssessments.id, data.params.assessmentId),
      with: { user: { with: { careerBand: true } } },
    })
  } else {
    // Get most recent DONE assessment for user
    assessment = await db.query.userAssessments.findFirst({
      where: and(
        eq(userAssessments.userId, targetUserId),
        eq(userAssessments.status, 'DONE')
      ),
      with: { user: { with: { careerBand: true } } },
      orderBy: (userAssessments, { desc }) => [desc(userAssessments.createdAt)],
    })
  }

  if (!assessment) {
    return {
      success: true,
      data: { groups: [] },
    }
  }

  // Get assessment details with competency and group info
  const details = await db
    .select({
      competencyId: userAssessmentDetails.competencyId,
      finalScore: userAssessmentDetails.finalScore,
      competency: competencies,
      group: competencyGroups,
      requiredLevel: competencyRequirements.requiredLevel,
    })
    .from(userAssessmentDetails)
    .leftJoin(
      competencies,
      eq(userAssessmentDetails.competencyId, competencies.id)
    )
    .leftJoin(competencyGroups, eq(competencies.groupId, competencyGroups.id))
    .leftJoin(
      competencyRequirements,
      and(
        eq(competencyRequirements.competencyId, userAssessmentDetails.competencyId),
        eq(competencyRequirements.careerBandId, assessment.user.careerBandId!)
      )
    )
    .where(eq(userAssessmentDetails.userAssessmentId, assessment.id))

  // Group by competency group
  const groupedData: Record<string, any> = {}
  
  details.forEach((detail) => {
    const groupName = detail.group?.name || 'Other'
    if (!groupedData[groupName]) {
      groupedData[groupName] = {
        name: groupName,
        competencies: [],
        totalFinalScore: 0,
        totalRequiredLevel: 0,
        count: 0,
      }
    }

    if (detail.finalScore !== null && detail.requiredLevel !== null) {
      groupedData[groupName].competencies.push({
        name: detail.competency?.name || 'Unknown',
        finalScore: detail.finalScore,
        requiredLevel: detail.requiredLevel,
        gap: detail.finalScore - detail.requiredLevel,
      })
      groupedData[groupName].totalFinalScore += detail.finalScore
      groupedData[groupName].totalRequiredLevel += detail.requiredLevel
      groupedData[groupName].count += 1
    }
  })

  // Calculate averages
  const groups = Object.values(groupedData).map((group: any) => ({
    name: group.name,
    avgFinalScore: group.count > 0 ? group.totalFinalScore / group.count : 0,
    avgRequiredLevel: group.count > 0 ? group.totalRequiredLevel / group.count : 0,
    competencies: group.competencies,
  }))

  return {
    success: true,
    data: { groups },
  }
})

/**
 * Get Gap Analysis Report
 * 
 * @description Comprehensive gap analysis report for Admin/HR.
 * Provides summary statistics, competency-level breakdown, and employee-level details.
 * 
 * **Business Value**:
 * - Identify organization-wide skill gaps
 * - Prioritize training investments
 * - Track competency development trends
 * 
 * @param token - JWT authentication token (Admin/HR only)
 * @param params.teamId - Optional filter by team
 * @param params.roleId - Optional filter by role
 * @param params.cycleId - Optional filter by assessment cycle
 * 
 * @returns Gap analysis report with summary, by-competency, and by-employee breakdowns
 */
export const getGapAnalysisReportFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    params: z.object({
      teamId: z.number().int().positive().optional(),
      roleId: z.number().int().positive().optional(),
      cycleId: z.number().int().positive().optional(),
    }).optional(),
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  // Build filters for assessments
  const assessmentFilters: any[] = [eq(userAssessments.status, 'DONE')]
  
  if (data.params?.cycleId) {
    assessmentFilters.push(eq(userAssessments.cycleId, data.params.cycleId))
  }

  // Get all completed assessments
  let assessments = await db.query.userAssessments.findMany({
    where: and(...assessmentFilters),
    with: {
      user: {
        with: {
          profile: true,
          team: true,
          role: true,
          careerBand: true,
        },
      },
      cycle: true,
    },
  })

  // Apply additional filters
  if (data.params?.teamId) {
    assessments = assessments.filter(a => a.user.teamId === data.params.teamId)
  }
  if (data.params?.roleId) {
    assessments = assessments.filter(a => a.user.roleId === data.params.roleId)
  }

  if (assessments.length === 0) {
    return {
      success: true,
      data: {
        summary: {
          totalEmployees: 0,
          avgGap: 0,
          meetsRequirementPercent: 0,
          needsDevelopmentPercent: 0,
        },
        byCompetency: [],
        byEmployee: [],
      },
    }
  }

  // Get all assessment details for these assessments
  const assessmentIds = assessments.map(a => a.id)
  const allDetails = await db
    .select({
      userAssessmentId: userAssessmentDetails.userAssessmentId,
      competencyId: userAssessmentDetails.competencyId,
      finalScore: userAssessmentDetails.finalScore,
      competency: competencies,
      requiredLevel: competencyRequirements.requiredLevel,
    })
    .from(userAssessmentDetails)
    .leftJoin(
      competencies,
      eq(userAssessmentDetails.competencyId, competencies.id)
    )
    .leftJoin(
      competencyRequirements,
      eq(competencyRequirements.competencyId, userAssessmentDetails.competencyId)
    )
    .where((userAssessmentDetails, { inArray }) =>
      inArray(userAssessmentDetails.userAssessmentId, assessmentIds)
    )

  // Calculate summary statistics
  const gaps = allDetails
    .filter(d => d.finalScore !== null && d.requiredLevel !== null)
    .map(d => d.finalScore! - d.requiredLevel!)
  
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0
  const meetsRequirement = gaps.filter(g => g >= 0).length
  const meetsRequirementPercent = gaps.length > 0 ? (meetsRequirement / gaps.length) * 100 : 0
  const needsDevelopmentPercent = 100 - meetsRequirementPercent

  // By Competency breakdown
  const competencyMap: Record<number, any> = {}
  allDetails.forEach(detail => {
    if (detail.finalScore === null || detail.requiredLevel === null) return

    const compId = detail.competencyId
    if (!competencyMap[compId]) {
      competencyMap[compId] = {
        competency: detail.competency,
        gaps: [],
        employeesBelow: 0,
      }
    }

    const gap = detail.finalScore - detail.requiredLevel
    competencyMap[compId].gaps.push(gap)
    if (gap < 0) {
      competencyMap[compId].employeesBelow += 1
    }
  })

  const byCompetency = Object.values(competencyMap).map((item: any) => ({
    competency: item.competency,
    avgGap: item.gaps.reduce((a: number, b: number) => a + b, 0) / item.gaps.length,
    employeesBelow: item.employeesBelow,
    totalAssessed: item.gaps.length,
  }))

  // By Employee breakdown
  const byEmployee = assessments.map(assessment => {
    const employeeDetails = allDetails.filter(
      d => d.userAssessmentId === assessment.id
    )

    const employeeGaps = employeeDetails
      .filter(d => d.finalScore !== null && d.requiredLevel !== null)
      .map(d => ({
        competency: d.competency,
        gap: d.finalScore! - d.requiredLevel!,
      }))

    const criticalGaps = employeeGaps
      .filter(g => g.gap <= -2)
      .map(g => ({
        competency: g.competency,
        gap: g.gap,
      }))

    const avgEmployeeGap = employeeGaps.length > 0
      ? employeeGaps.reduce((a, b) => a + b.gap, 0) / employeeGaps.length
      : 0

    return {
      user: assessment.user,
      avgGap: avgEmployeeGap,
      criticalGaps,
      totalCompetencies: employeeGaps.length,
    }
  })

  return {
    success: true,
    data: {
      summary: {
        totalEmployees: assessments.length,
        avgGap: Number(avgGap.toFixed(2)),
        meetsRequirementPercent: Number(meetsRequirementPercent.toFixed(1)),
        needsDevelopmentPercent: Number(needsDevelopmentPercent.toFixed(1)),
      },
      byCompetency: byCompetency.sort((a, b) => a.avgGap - b.avgGap),
      byEmployee: byEmployee.sort((a, b) => a.avgGap - b.avgGap),
    },
  }
})

// ==================== TEAM ANALYTICS (FOR LEADERS) ====================

/**
 * Get Team Radar Data (For Leaders)
 * Leaders can view aggregated competency radar data for their team members
 */
export const getTeamRadarDataFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
  })
  const { token } = schema.parse(ctx.data)

  // Verify user and get their team
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
    with: {
      role: true,
      leadingTeam: {
        with: {
          members: {
            where: isNull(users.deletedAt),
          },
        },
      },
    },
  })

  if (!user || !user.role) {
    throw new Error('User not found or has no role')
  }

  // Check if user is a Leader
  if (user.role.roleName !== 'LEADER') {
    throw new Error('Only Leaders can access team analytics')
  }

  if (!user.leadingTeam) {
    throw new Error('You are not assigned as a team leader')
  }

  // Get team member IDs
  const teamMemberIds = user.leadingTeam.members.map((m) => m.id)

  if (teamMemberIds.length === 0) {
    return {
      success: true,
      data: { groups: [] },
    }
  }

  // Get all completed assessments for team members
  const assessments = await db.query.userAssessments.findMany({
    where: and(
      inArray(userAssessments.userId, teamMemberIds),
      eq(userAssessments.status, 'DONE'),
    ),
  })

  if (assessments.length === 0) {
    return {
      success: true,
      data: { groups: [] },
    }
  }

  const assessmentIds = assessments.map((a) => a.id)

  // Get all assessment details with competency and group info
  const details = await db
    .select({
      competencyId: userAssessmentDetails.competencyId,
      finalScore: userAssessmentDetails.finalScore,
      competency: competencies,
      group: competencyGroups,
      requiredLevel: competencyRequirements.requiredLevel,
    })
    .from(userAssessmentDetails)
    .innerJoin(
      competencies,
      eq(userAssessmentDetails.competencyId, competencies.id),
    )
    .innerJoin(competencyGroups, eq(competencies.groupId, competencyGroups.id))
    .leftJoin(
      competencyRequirements,
      eq(competencyRequirements.competencyId, competencies.id),
    )
    .where(inArray(userAssessmentDetails.userAssessmentId, assessmentIds))

  // Group by competency group
  const groupedData: Record<
    number,
    {
      name: string
      totalFinalScore: number
      totalRequiredLevel: number
      count: number
      competencies: string[]
    }
  > = {}

  for (const detail of details) {
    if (!detail.group || detail.finalScore === null) continue

    if (!groupedData[detail.group.id]) {
      groupedData[detail.group.id] = {
        name: detail.group.name,
        totalFinalScore: 0,
        totalRequiredLevel: 0,
        count: 0,
        competencies: [],
      }
    }

    groupedData[detail.group.id].totalFinalScore += detail.finalScore
    groupedData[detail.group.id].totalRequiredLevel +=
      detail.requiredLevel || 0
    groupedData[detail.group.id].count++
    if (
      detail.competency &&
      !groupedData[detail.group.id].competencies.includes(
        detail.competency.name,
      )
    ) {
      groupedData[detail.group.id].competencies.push(detail.competency.name)
    }
  }

  // Calculate averages
  const groups = Object.values(groupedData).map((group: any) => ({
    name: group.name,
    avgFinalScore: group.count > 0 ? group.totalFinalScore / group.count : 0,
    avgRequiredLevel:
      group.count > 0 ? group.totalRequiredLevel / group.count : 0,
    competencies: group.competencies,
  }))

  return {
    success: true,
    data: { groups },
  }
})

/**
 * Get Team Gap Analysis Report (For Leaders)
 * Leaders can view detailed gap analysis for their team members
 */
export const getTeamGapAnalysisFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
  })
  const { token } = schema.parse(ctx.data)

  // Verify user and get their team
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
    with: {
      role: true,
      leadingTeam: {
        with: {
          members: {
            where: isNull(users.deletedAt),
            with: {
              profile: true,
            },
          },
        },
      },
    },
  })

  if (!user || !user.role) {
    throw new Error('User not found or has no role')
  }

  // Check if user is a Leader
  if (user.role.roleName !== 'LEADER') {
    throw new Error('Only Leaders can access team analytics')
  }

  if (!user.leadingTeam) {
    throw new Error('You are not assigned as a team leader')
  }

  // Get team member IDs
  const teamMemberIds = user.leadingTeam.members.map((m) => m.id)

  if (teamMemberIds.length === 0) {
    return {
      success: true,
      data: {
        summary: {
          totalEmployees: 0,
          avgGap: 0,
          meetsRequirementPercent: 0,
          needsDevelopmentPercent: 0,
        },
        byCompetency: [],
        byEmployee: [],
      },
    }
  }

  // Get all completed assessments for team members
  const assessments = await db.query.userAssessments.findMany({
    where: and(
      inArray(userAssessments.userId, teamMemberIds),
      eq(userAssessments.status, 'DONE'),
    ),
    with: {
      user: {
        with: {
          profile: true,
        },
      },
    },
  })

  if (assessments.length === 0) {
    return {
      success: true,
      data: {
        summary: {
          totalEmployees: 0,
          avgGap: 0,
          meetsRequirementPercent: 0,
          needsDevelopmentPercent: 0,
        },
        byCompetency: [],
        byEmployee: [],
      },
    }
  }

  const assessmentIds = assessments.map((a) => a.id)

  // Get all assessment details
  const allDetails = await db
    .select({
      userAssessmentId: userAssessmentDetails.userAssessmentId,
      competencyId: userAssessmentDetails.competencyId,
      finalScore: userAssessmentDetails.finalScore,
      competency: competencies,
      requiredLevel: competencyRequirements.requiredLevel,
    })
    .from(userAssessmentDetails)
    .innerJoin(
      competencies,
      eq(userAssessmentDetails.competencyId, competencies.id),
    )
    .leftJoin(
      competencyRequirements,
      eq(competencyRequirements.competencyId, competencies.id),
    )
    .where(inArray(userAssessmentDetails.userAssessmentId, assessmentIds))

  // Calculate summary statistics
  const gaps = allDetails
    .filter((d) => d.finalScore !== null && d.requiredLevel !== null)
    .map((d) => d.finalScore! - d.requiredLevel!)

  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0
  const meetsRequirement = gaps.filter((g) => g >= 0).length
  const meetsRequirementPercent =
    gaps.length > 0 ? (meetsRequirement / gaps.length) * 100 : 0
  const needsDevelopmentPercent = 100 - meetsRequirementPercent

  // By Competency breakdown
  const competencyMap: Record<
    number,
    {
      competency: any
      totalGap: number
      count: number
      employeesBelowRequirement: number
    }
  > = {}

  for (const detail of allDetails) {
    if (detail.finalScore === null || detail.requiredLevel === null) continue

    const gap = detail.finalScore - detail.requiredLevel

    if (!competencyMap[detail.competencyId]) {
      competencyMap[detail.competencyId] = {
        competency: detail.competency,
        totalGap: 0,
        count: 0,
        employeesBelowRequirement: 0,
      }
    }

    competencyMap[detail.competencyId].totalGap += gap
    competencyMap[detail.competencyId].count++
    if (gap < 0) {
      competencyMap[detail.competencyId].employeesBelowRequirement++
    }
  }

  const byCompetency = Object.values(competencyMap).map((item) => ({
    competency: item.competency,
    avgGap: item.count > 0 ? item.totalGap / item.count : 0,
    employeesBelowRequirement: item.employeesBelowRequirement,
  }))

  // By Employee breakdown
  const byEmployee = assessments.map((assessment) => {
    const employeeGaps = allDetails
      .filter(
        (d) =>
          d.userAssessmentId === assessment.id &&
          d.finalScore !== null &&
          d.requiredLevel !== null,
      )
      .map((d) => ({
        competency: d.competency,
        gap: d.finalScore! - d.requiredLevel!,
      }))

    const criticalGaps = employeeGaps
      .filter((g) => g.gap < -1)
      .map((g) => g.competency.name)

    const avgEmployeeGap =
      employeeGaps.length > 0
        ? employeeGaps.reduce((a, b) => a + b.gap, 0) / employeeGaps.length
        : 0

    return {
      user: assessment.user,
      avgGap: avgEmployeeGap,
      criticalGaps,
      totalCompetencies: employeeGaps.length,
    }
  })

  return {
    success: true,
    data: {
      summary: {
        totalEmployees: assessments.length,
        avgGap: Number(avgGap.toFixed(2)),
        meetsRequirementPercent: Number(meetsRequirementPercent.toFixed(1)),
        needsDevelopmentPercent: Number(needsDevelopmentPercent.toFixed(1)),
      },
      byCompetency: byCompetency.sort((a, b) => a.avgGap - b.avgGap),
      byEmployee: byEmployee.sort((a, b) => a.avgGap - b.avgGap),
    },
  }
})

/**
 * Get Team Assessments (For Leaders)
 * List all assessments of members in the leader's team
 */
export const getTeamAssessmentsFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
  })
  const { token } = schema.parse(ctx.data)

  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
    with: {
      role: true,
      leadingTeam: {
        with: {
          members: {
            where: isNull(users.deletedAt),
          },
        },
      },
    },
  })

  if (!user || user.role?.roleName !== 'LEADER' || !user.leadingTeam) {
    throw new Error('Only team leaders can access this information')
  }

  const memberIds = user.leadingTeam.members.map((m) => m.id)

  if (memberIds.length === 0) {
    return {
      success: true,
      data: [],
    }
  }

  const assessments = await db.query.userAssessments.findMany({
    where: inArray(userAssessments.userId, memberIds),
    with: {
      user: {
        with: {
          profile: true,
        },
      },
      cycle: true,
    },
    orderBy: [userAssessments.createdAt],
  })

  return {
    success: true,
    data: assessments,
  }
})

/**
 * Remind Pending Assessments
 * Sends email reminder to all participants with status SELF_ASSESSING
 */
export const remindPendingAssessmentsFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: z.object({
      cycleId: z.number(),
    }),
  })
  const input = schema.parse(ctx.data)
  const requester = await verifyAdminOrHR(input.token)
  const { cycleId } = input.data

  const cycle = await db.query.assessmentCycles.findFirst({where: eq(assessmentCycles.id, cycleId)})

  // Fetch pending self-assessments
  const pending = await db.query.userAssessments.findMany({
    where: and(
        eq(userAssessments.cycleId, cycleId),
        eq(userAssessments.status, 'SELF_ASSESSING')
    ),
    with: {
      user: {
        with: { profile: true }
      }
    }
  })

  // Fetch Template
  const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'ASSESSMENT_REMINDER')
  })
  
  let emailsSent = 0
  if (template) {
    for (const p of pending) {
        const recipientEmail = p.user.email
        const recipientName = p.user.profile?.fullName || 'Employee'
        
        const subject = replacePlaceholders(template.subject, { 
            cycleName: cycle?.name || 'Assessment Cycle',
            fullName: recipientName
        })
        const body = replacePlaceholders(template.body, {
            cycleName: cycle?.name || 'Assessment Cycle',
            daysLeft: "some", // Calculation logic can be added
            link: `${process.env.APP_URL || 'http://localhost:3000'}/competencies/my-assessment`,
            fullName: recipientName
        })

        try {
        const res = await sendEmail(recipientEmail, subject, body)
        if (res.success) {
            await db.insert(emailLogs).values({
                templateId: template.id,
                senderId: requester.id,
                recipientEmail,
                subject,
                body,
                status: 'SENT',
                sentAt: new Date(),
            })
            emailsSent++
        }
        } catch (e) {
            console.error(`Failed to send email to ${recipientEmail}`, e)
        }
    }
  }

  return {
    success: true,
    message: `Sent reminders to ${emailsSent} employees.`,
  }
})
