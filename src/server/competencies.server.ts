/**
 * Competency Management Server Functions
 * Handle CRUD operations for Competency Framework with proper validation and permissions
 */
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, ilike, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  createCompetencyGroupSchema,
  updateCompetencyGroupSchema,
  deleteCompetencyGroupSchema,
  createCompetencySchema,
  updateCompetencySchema,
  deleteCompetencySchema,
  listCompetenciesParamsSchema,
  createAssessmentCycleSchema,
  updateAssessmentCycleSchema,
  listAssessmentCyclesParamsSchema,
} from '@/lib/competency.schemas'
import { db } from '@/db'
import { competencyGroups, competencies, competencyLevels, users, assessmentCycles, userAssessments, emailTemplates, emailLogs, profiles } from '@/db/schema'
import { replacePlaceholders, sendEmail } from '@/lib/email.utils'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify user has Admin or HR role
 */
async function verifyAdminOrHR(token: string) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
    with: {
      role: true,
    },
  })

  if (!user || !user.role) {
    throw new Error('User not found or has no role')
  }

  if (!['ADMIN', 'HR'].includes(user.role.roleName)) {
    throw new Error('Insufficient permissions. Admin or HR role required.')
  }

  return user
}

/**
 * Check if group name already exists (case-insensitive)
 */
async function isGroupNameUnique(
  name: string,
  excludeGroupId?: number,
): Promise<boolean> {
  const existing = await db.query.competencyGroups.findFirst({
    where: and(
      ilike(competencyGroups.name, name),
      excludeGroupId ? sql`${competencyGroups.id} != ${excludeGroupId}` : undefined,
    ),
  })

  return !existing
}

/**
 * Check if competency name already exists within group (case-insensitive)
 */
async function isCompetencyNameUnique(
  name: string,
  groupId: number,
  excludeCompetencyId?: number,
): Promise<boolean> {
  const existing = await db.query.competencies.findFirst({
    where: and(
      eq(competencies.groupId, groupId),
      ilike(competencies.name, name),
      excludeCompetencyId
        ? sql`${competencies.id} != ${excludeCompetencyId}`
        : undefined,
    ),
  })

  return !existing
}

// ==================== COMPETENCY GROUP FUNCTIONS ====================

/**
 * Get all competency groups with count of competencies
 */
export const getCompetencyGroupsFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({ token: z.string() })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const groups = await db
      .select({
        id: competencyGroups.id,
        name: competencyGroups.name,
        description: competencyGroups.description,
        createdAt: competencyGroups.createdAt,
        competencyCount: count(competencies.id),
      })
      .from(competencyGroups)
      .leftJoin(competencies, eq(competencies.groupId, competencyGroups.id))
      .groupBy(competencyGroups.id)
      .orderBy(competencyGroups.name)

    return {
      success: true,
      data: groups,
    }
  },
)

/**
 * Create a new competency group
 */
export const createCompetencyGroupFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: createCompetencyGroupSchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    // Check name uniqueness
    const isUnique = await isGroupNameUnique(data.data.name)
    if (!isUnique) {
      throw new Error(
        `Competency group "${data.data.name}" already exists. Please use a different name.`,
      )
    }

    const [newGroup] = await db
      .insert(competencyGroups)
      .values({
        name: data.data.name,
        description: data.data.description || null,
      })
      .returning()

    return {
      success: true,
      data: newGroup,
    }
  },
)

/**
 * Update an existing competency group
 */
export const updateCompetencyGroupFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: updateCompetencyGroupSchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { groupId, data: updates } = data.data

    // Check if group exists
    const existingGroup = await db.query.competencyGroups.findFirst({
      where: eq(competencyGroups.id, groupId),
    })

    if (!existingGroup) {
      throw new Error('Competency group not found')
    }

    // Check name uniqueness if name is being updated
    if (updates.name) {
      const isUnique = await isGroupNameUnique(updates.name, groupId)
      if (!isUnique) {
        throw new Error(
          `Competency group "${updates.name}" already exists. Please use a different name.`,
        )
      }
    }

    const [updatedGroup] = await db
      .update(competencyGroups)
      .set({
        name: updates.name || existingGroup.name,
        description:
          updates.description !== undefined
            ? updates.description
            : existingGroup.description,
      })
      .where(eq(competencyGroups.id, groupId))
      .returning()

    return {
      success: true,
      data: updatedGroup,
    }
  },
)

/**
 * Delete a competency group (only if it has no competencies)
 */
export const deleteCompetencyGroupFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: deleteCompetencyGroupSchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { groupId } = data.data

    // Check if group exists
    const existingGroup = await db.query.competencyGroups.findFirst({
      where: eq(competencyGroups.id, groupId),
    })

    if (!existingGroup) {
      throw new Error('Competency group not found')
    }

    // Check if group has any competencies
    const competenciesInGroup = await db
      .select({ count: count() })
      .from(competencies)
      .where(eq(competencies.groupId, groupId))

    if (competenciesInGroup[0].count > 0) {
      throw new Error(
        `Cannot delete group "${existingGroup.name}". It contains ${competenciesInGroup[0].count} competenc${competenciesInGroup[0].count === 1 ? 'y' : 'ies'}. Please delete or move the competencies first.`,
      )
    }

    await db.delete(competencyGroups).where(eq(competencyGroups.id, groupId))

    return {
      success: true,
      message: `Competency group "${existingGroup.name}" deleted successfully`,
    }
  },
)

// ==================== COMPETENCY FUNCTIONS ====================

/**
 * Get competencies with their levels and group info
 */
export const getCompetenciesFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      params: listCompetenciesParamsSchema.optional(),
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const params = data.params || {}

    // Apply filters
    const filters: any[] = []

    if (params.groupId) {
      filters.push(eq(competencies.groupId, params.groupId))
    }

    if (params.search) {
      filters.push(ilike(competencies.name, `%${params.search}%`))
    }

    // Execute with filters
    const allCompetencies = await db.query.competencies.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      with: {
        group: true,
        levels: {
          orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
        },
      },
      orderBy: (competencies, { asc }) => [asc(competencies.name)],
    })

    return {
      success: true,
      data: allCompetencies,
    }
  },
)

/**
 * Create a new competency with all 5 levels
 */
export const createCompetencyFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: createCompetencySchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { groupId, name, description, levels } = data.data

    // Check if group exists
    const group = await db.query.competencyGroups.findFirst({
      where: eq(competencyGroups.id, groupId),
    })

    if (!group) {
      throw new Error('Competency group not found')
    }

    // Check name uniqueness within group
    const isUnique = await isCompetencyNameUnique(name, groupId)
    if (!isUnique) {
      throw new Error(
        `Competency "${name}" already exists in group "${group.name}". Please use a different name.`,
      )
    }

    // Create competency
    const [newCompetency] = await db
      .insert(competencies)
      .values({
        groupId,
        name,
        description: description || null,
      })
      .returning()

    // Create all 5 levels
    const levelValues = levels.map(
      (level: { levelNumber: number; behavioralIndicator: string }) => ({
        competencyId: newCompetency.id,
        levelNumber: level.levelNumber,
        behavioralIndicator: level.behavioralIndicator,
      }),
    )

    const createdLevels = await db
      .insert(competencyLevels)
      .values(levelValues)
      .returning()

    return {
      success: true,
      data: {
        ...newCompetency,
        group,
        levels: createdLevels,
      },
    }
  },
)

/**
 * Update an existing competency and its levels
 */
export const updateCompetencyFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: updateCompetencySchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { competencyId, data: updates } = data.data

    // Check if competency exists
    const existingCompetency = await db.query.competencies.findFirst({
      where: eq(competencies.id, competencyId),
      with: {
        levels: {
          orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
        },
      },
    })

    if (!existingCompetency) {
      throw new Error('Competency not found')
    }

    // Check group exists if being updated
    if (updates.groupId) {
      const group = await db.query.competencyGroups.findFirst({
        where: eq(competencyGroups.id, updates.groupId),
      })
      if (!group) {
        throw new Error('Competency group not found')
      }
    }

    // Check name uniqueness if being updated
    if (updates.name) {
      const targetGroupId = updates.groupId || existingCompetency.groupId
      const isUnique = await isCompetencyNameUnique(
        updates.name,
        targetGroupId,
        competencyId,
      )
      if (!isUnique) {
        throw new Error(
          `Competency "${updates.name}" already exists in this group. Please use a different name.`,
        )
      }
    }

    // Update competency
    await db
      .update(competencies)
      .set({
        groupId: updates.groupId || existingCompetency.groupId,
        name: updates.name || existingCompetency.name,
        description:
          updates.description !== undefined
            ? updates.description
            : existingCompetency.description,
      })
      .where(eq(competencies.id, competencyId))

    // Update levels if provided
    if (updates.levels) {
      // Delete existing levels
      await db
        .delete(competencyLevels)
        .where(eq(competencyLevels.competencyId, competencyId))

      // Insert new levels
      const levelValues = updates.levels.map(
        (level: { levelNumber: number; behavioralIndicator: string }) => ({
          competencyId,
          levelNumber: level.levelNumber,
          behavioralIndicator: level.behavioralIndicator,
        }),
      )

      await db.insert(competencyLevels).values(levelValues)
    }

    // Fetch updated competency with levels and group
    const result = await db.query.competencies.findFirst({
      where: eq(competencies.id, competencyId),
      with: {
        group: true,
        levels: {
          orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
        },
      },
    })

    return {
      success: true,
      data: result,
    }
  },
)

/**
 * Soft delete a competency (cascade to levels)
 */
export const deleteCompetencyFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: deleteCompetencySchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { competencyId } = data.data

    // Check if competency exists
    const existingCompetency = await db.query.competencies.findFirst({
      where: eq(competencies.id, competencyId),
    })

    if (!existingCompetency) {
      throw new Error('Competency not found')
    }

    // Delete competency (cascade will handle levels due to DB constraints)
    await db.delete(competencies).where(eq(competencies.id, competencyId))

    return {
      success: true,
      message: `Competency "${existingCompetency.name}" deleted successfully`,
    }
  },
)

// ==================== REQUIREMENTS MATRIX FUNCTIONS (Phase 2) ====================

import {
  setCompetencyRequirementSchema,
  bulkSetRequirementsSchema,
} from '@/lib/competency.schemas'
import { careerBands, competencyRequirements } from '@/db/schema'

/**
 * Get requirements matrix data
 * Returns all career bands, competency groups with competencies,
 * and existing requirements mapped by careerBandId -> competencyId -> requiredLevel
 */
export const getRequirementsMatrixFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({ token: z.string() })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    // Fetch all career bands
    const allCareerBands = await db.query.careerBands.findMany({
      orderBy: (careerBands, { asc }) => [asc(careerBands.bandName)],
    })

    // Fetch all competency groups with competencies and levels
    const groups = await db.query.competencyGroups.findMany({
      with: {
        competencies: {
          with: {
            levels: {
              orderBy: (levels, { asc }) => [asc(levels.levelNumber)],
            },
          },
          orderBy: (competencies, { asc }) => [asc(competencies.name)],
        },
      },
      orderBy: (competencyGroups, { asc }) => [asc(competencyGroups.name)],
    })

    // Fetch all existing requirements
    const allRequirements = await db.query.competencyRequirements.findMany()

    // Build requirements map: { [careerBandId]: { [competencyId]: requiredLevel } }
    const requirementsMap: Record<number, Record<number, number | null>> = {}

    for (const req of allRequirements) {
      if (!requirementsMap[req.careerBandId]) {
        requirementsMap[req.careerBandId] = {}
      }
      requirementsMap[req.careerBandId][req.competencyId] = req.requiredLevel
    }

    return {
      success: true,
      data: {
        careerBands: allCareerBands,
        groups: groups.map((group) => ({
          group: {
            id: group.id,
            name: group.name,
            description: group.description,
          },
          competencies: group.competencies.map((comp) => ({
            competency: {
              id: comp.id,
              name: comp.name,
              description: comp.description,
            },
            requirements: requirementsMap,
          })),
        })),
      },
    }
  },
)

/**
 * Set a single competency requirement
 * Upserts the requirement (creates if not exists, updates if exists)
 */
export const setCompetencyRequirementFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: setCompetencyRequirementSchema,
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  const { careerBandId, competencyId, requiredLevel } = data.data

  // Verify career band exists
  const band = await db.query.careerBands.findFirst({
    where: eq(careerBands.id, careerBandId),
  })
  if (!band) {
    throw new Error('Career band not found')
  }

  // Verify competency exists
  const competency = await db.query.competencies.findFirst({
    where: eq(competencies.id, competencyId),
  })
  if (!competency) {
    throw new Error('Competency not found')
  }

  // If requiredLevel is null, delete the requirement
  if (requiredLevel === null) {
    await db
      .delete(competencyRequirements)
      .where(
        and(
          eq(competencyRequirements.careerBandId, careerBandId),
          eq(competencyRequirements.competencyId, competencyId),
        ),
      )

    return {
      success: true,
      message: 'Requirement removed',
    }
  }

  // Check if requirement already exists
  const existing = await db.query.competencyRequirements.findFirst({
    where: and(
      eq(competencyRequirements.careerBandId, careerBandId),
      eq(competencyRequirements.competencyId, competencyId),
    ),
  })

  if (existing) {
    // Update existing
    await db
      .update(competencyRequirements)
      .set({ requiredLevel })
      .where(
        and(
          eq(competencyRequirements.careerBandId, careerBandId),
          eq(competencyRequirements.competencyId, competencyId),
        ),
      )
  } else {
    // Insert new
    await db.insert(competencyRequirements).values({
      careerBandId,
      competencyId,
      requiredLevel,
      roleId: 1, // Default roleId (schema still requires it, will be removed in future migration)
    })
  }

  return {
    success: true,
    message: 'Requirement updated successfully',
  }
})

/**
 * Bulk set multiple requirements at once
 * Useful for saving entire matrix or row/column
 */
export const bulkSetRequirementsFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: bulkSetRequirementsSchema,
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const { requirements } = data.data

    let updated = 0

    for (const req of requirements) {
      const { careerBandId, competencyId, requiredLevel } = req

      // If requiredLevel is null, delete
      if (requiredLevel === null) {
        await db
          .delete(competencyRequirements)
          .where(
            and(
              eq(competencyRequirements.careerBandId, careerBandId),
              eq(competencyRequirements.competencyId, competencyId),
            ),
          )
        updated++
        continue
      }

      // Check if exists
      const existing = await db.query.competencyRequirements.findFirst({
        where: and(
          eq(competencyRequirements.careerBandId, careerBandId),
          eq(competencyRequirements.competencyId, competencyId),
        ),
      })

      if (existing) {
        // Update
        await db
          .update(competencyRequirements)
          .set({ requiredLevel })
          .where(
            and(
              eq(competencyRequirements.careerBandId, careerBandId),
              eq(competencyRequirements.competencyId, competencyId),
            ),
          )
      } else {
        // Insert
        await db.insert(competencyRequirements).values({
          careerBandId,
          competencyId,
          requiredLevel,
          roleId: 1, // Default roleId
        })
      }

      updated++
    }

    return {
      success: true,
      updated,
      message: `${updated} requirement(s) updated successfully`,
    }
  },
)

// ==================== ASSESSMENT CYCLES FUNCTIONS (Phase 3) ====================



/**
 * Get all assessment cycles with optional filtering
 */
export const getAssessmentCyclesFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      params: listAssessmentCyclesParamsSchema.optional(),
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const params = data.params || {}
    const filters: any[] = []

    if (params.status) {
      filters.push(eq(assessmentCycles.status, params.status))
    }

    if (params.year) {
      filters.push(
        sql`EXTRACT(YEAR FROM ${assessmentCycles.startDate}) = ${params.year}`,
      )
    }

    const cycles = await db.query.assessmentCycles.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: (assessmentCycles, { desc }) => [
        desc(assessmentCycles.startDate),
      ],
    })

    return {
      success: true,
      data: cycles,
    }
  },
)

/**
 * Get assessment cycle by ID
 */
export const getAssessmentCycleByIdFn = createServerFn({ method: 'POST' }).handler(
  async (ctx) => {
    const schema = z.object({
      token: z.string(),
      data: z.object({ cycleId: z.number() }),
    })
    const data = schema.parse(ctx.data)

    await verifyAdminOrHR(data.token)

    const cycle = await db.query.assessmentCycles.findFirst({
      where: eq(assessmentCycles.id, data.data.cycleId),
    })

    if (!cycle) {
      throw new Error('Assessment cycle not found')
    }

    return {
      success: true,
      data: cycle,
    }
  },
)

/**
 * Create a new assessment cycle
 * Validates that dates don't overlap with existing ACTIVE cycles
 */
export const createAssessmentCycleFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: createAssessmentCycleSchema,
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  const { name, startDate, endDate } = data.data

  // Validate dates
  const startDateStr = startDate.toISOString().split('T')[0]
  const endDateStr = endDate.toISOString().split('T')[0]

  // Validate dates
  if (endDate <= startDate) {
    throw new Error('End date must be after start date')
  }

  // Check for overlapping ACTIVE cycles
  const overlapping = await db.query.assessmentCycles.findFirst({
    where: and(
      eq(assessmentCycles.status, 'ACTIVE'),
      sql`${assessmentCycles.startDate} <= ${endDateStr} AND ${assessmentCycles.endDate} >= ${startDateStr}`,
    ),
  })

  if (overlapping) {
    throw new Error(
      `Date range overlaps with existing active cycle "${overlapping.name}" (${new Date(overlapping.startDate).toLocaleDateString()} - ${new Date(overlapping.endDate).toLocaleDateString()})`,
    )
  }

  const [newCycle] = await db
    .insert(assessmentCycles)
    .values({
      name,
      startDate: startDateStr,
      endDate: endDateStr,
      status: 'ACTIVE' as const,
    } as any)
    .returning()

  return {
    success: true,
    data: newCycle,
  }
})

/**
 * Update an existing assessment cycle
 */
export const updateAssessmentCycleFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: updateAssessmentCycleSchema,
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  const { cycleId, data: updates } = data.data

  // Check if cycle exists
  const existing = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.id, cycleId),
  })

  if (!existing) {
    throw new Error('Assessment cycle not found')
  }

  // Validate dates if being updated
  const dateStart = updates.startDate
    ? new Date(updates.startDate)
    : new Date(existing.startDate)
  const dateEnd = updates.endDate
    ? new Date(updates.endDate)
    : new Date(existing.endDate)

  if (dateEnd <= dateStart) {
    throw new Error('End date must be after start date')
  }

  const startDateStr = dateStart.toISOString().split('T')[0]
  const endDateStr = dateEnd.toISOString().split('T')[0]

  // Check for overlapping if dates changed and status is ACTIVE
  const newStatus = updates.status || existing.status
  if (
    newStatus === 'ACTIVE' &&
    (updates.startDate || updates.endDate || updates.status === 'ACTIVE')
  ) {
    const overlapping = await db.query.assessmentCycles.findFirst({
      where: and(
        eq(assessmentCycles.status, 'ACTIVE'),
        sql`${assessmentCycles.id} != ${cycleId}`,
        sql`${assessmentCycles.startDate} <= ${endDateStr} AND ${assessmentCycles.endDate} >= ${startDateStr}`,
      ),
    })

    if (overlapping) {
      throw new Error(
        `Date range overlaps with existing active cycle "${overlapping.name}"`,
      )
    }
  }

  const updateData: any = {
    name: updates.name || existing.name,
  }

  if (updates.startDate) {
    updateData.startDate = startDateStr
  }
  if (updates.endDate) {
    updateData.endDate = endDateStr
  }
  if (updates.status) {
    updateData.status = newStatus
  }

  const [updated] = await db
    .update(assessmentCycles)
    .set(updateData)
    .where(eq(assessmentCycles.id, cycleId))
    .returning()

  return {
    success: true,
    data: updated,
  }
})

/**
 * Delete an assessment cycle
 * Only allowed if no assessments exist for this cycle
 */
export const deleteAssessmentCycleFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: z.object({ cycleId: z.number().int().positive() }),
  })
  const data = schema.parse(ctx.data)

  await verifyAdminOrHR(data.token)

  const { cycleId } = data.data

  // Check if cycle exists
  const existing = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.id, cycleId),
  })

  if (!existing) {
    throw new Error('Assessment cycle not found')
  }

  // Check if any assessments exist for this cycle
  const hasAssessments = await db.query.userAssessments.findFirst({
    where: eq(userAssessments.cycleId, cycleId),
  })

  if (hasAssessments) {
    throw new Error(
      'Cannot delete cycle: Assessments have already been created for this cycle. Please delete the assessments first or archive the cycle.',
    )
  }

  await db.delete(assessmentCycles).where(eq(assessmentCycles.id, cycleId))

  return {
    success: true,
    message: `Assessment cycle "${existing.name}" deleted successfully`,
  }
})

/**
 * Get the currently active assessment cycle
 */
export const getActiveAssessmentCycleFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const activeCycle = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.status, 'ACTIVE'),
    orderBy: [desc(assessmentCycles.startDate)], 
  })
  return { success: true, data: activeCycle || null }
})

/**
 * Update Assessment Cycle Status
 * - ACTIVE: Sends welcome emails to all participants
 * - COMPLETED: Closes the cycle
 */
export const updateAssessmentCycleStatusFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    data: z.object({
      cycleId: z.number(),
      status: z.enum(['ACTIVE', 'COMPLETED', 'DRAFT']), // Added DRAFT just in case rollback
    }),
  })
  const input = schema.parse(ctx.data)
  const requester = await verifyAdminOrHR(input.token)

  const { cycleId, status } = input.data

  const cycle = await db.query.assessmentCycles.findFirst({
    where: eq(assessmentCycles.id, cycleId),
  })

  if (!cycle) {
    throw new Error('AssessmentCycle not found')
  }

  // Update Status
  await db
    .update(assessmentCycles)
    .set({ status })
    .where(eq(assessmentCycles.id, cycleId))

  // If activating, send emails
  let emailsSent = 0
  if (status === 'ACTIVE') {
    // Fetch participants
    const participants = await db.query.userAssessments.findMany({
        where: eq(userAssessments.cycleId, cycleId),
        with: {
            user: {
                with: { profile: true }
            }
        }
    })

    // Fetch Template
    const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.code, 'ASSESSMENT_CYCLE_STARTED')
    })
    
    if (template) {
        // Send emails sequentially to avoid overwhelming SMTP
        for (const p of participants) {
             const recipientEmail = p.user.email
             const recipientName = p.user.profile?.fullName || 'Employee'
             
             const subject = replacePlaceholders(template.subject, { 
                 cycleName: cycle.name,
                 fullName: recipientName
             })
             const body = replacePlaceholders(template.body, {
                 cycleName: cycle.name,
                 endDate: new Date(cycle.endDate).toLocaleDateString(),
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
  }

  return {
    success: true,
    message: `Cycle updated to ${status}. ${emailsSent > 0 ? `Sent ${emailsSent} emails.` : ''}`,
  }
})
