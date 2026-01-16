import { z } from 'zod'

// ============================================================================
// COMPETENCY GROUP SCHEMAS
// ============================================================================

export const competencyGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date().nullable(),
})

export const createCompetencyGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters'),
  description: z.string().trim().optional(),
})

export const updateCompetencyGroupSchema = z.object({
  groupId: z.number().int().positive(),
  data: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Group name is required')
      .max(100, 'Group name must be less than 100 characters')
      .optional(),
    description: z.string().trim().optional(),
  }),
})

export const deleteCompetencyGroupSchema = z.object({
  groupId: z.number().int().positive(),
})

// ============================================================================
// COMPETENCY LEVEL SCHEMAS
// ============================================================================

export const competencyLevelSchema = z.object({
  id: z.number(),
  competencyId: z.number(),
  levelNumber: z.number().int().min(1).max(5),
  behavioralIndicator: z.string().nullable(),
  createdAt: z.date().nullable(),
})

export const createCompetencyLevelInputSchema = z.object({
  levelNumber: z
    .number()
    .int()
    .min(1, 'Level must be between 1 and 5')
    .max(5, 'Level must be between 1 and 5'),
  behavioralIndicator: z
    .string()
    .trim()
    .min(1, 'Behavioral indicator is required')
    .max(2000, 'Behavioral indicator is too long'),
})

// ============================================================================
// COMPETENCY SCHEMAS
// ============================================================================

export const competencySchema = z.object({
  id: z.number(),
  groupId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date().nullable(),
  levels: z.array(competencyLevelSchema).optional(),
})

export const createCompetencySchema = z.object({
  groupId: z.number().int().positive('Group is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Competency name is required')
    .max(200, 'Competency name must be less than 200 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description is too long')
    .optional(),
  levels: z
    .array(createCompetencyLevelInputSchema)
    .length(5, 'Exactly 5 levels are required')
    .refine(
      (levels) => {
        const levelNumbers = levels.map((l) => l.levelNumber)
        const uniqueLevels = new Set(levelNumbers)
        return uniqueLevels.size === 5 && levelNumbers.every((n) => n >= 1 && n <= 5)
      },
      {
        message:
          'Levels must contain exactly one entry for each level (1, 2, 3, 4, 5)',
      },
    ),
})

export const updateCompetencySchema = z.object({
  competencyId: z.number().int().positive(),
  data: z.object({
    groupId: z.number().int().positive().optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Competency name is required')
      .max(200, 'Competency name must be less than 200 characters')
      .optional(),
    description: z.string().trim().max(1000, 'Description is too long').optional(),
    levels: z
      .array(createCompetencyLevelInputSchema)
      .length(5, 'Exactly 5 levels are required')
      .refine(
        (levels) => {
          const levelNumbers = levels.map((l) => l.levelNumber)
          const uniqueLevels = new Set(levelNumbers)
          return uniqueLevels.size === 5 && levelNumbers.every((n) => n >= 1 && n <= 5)
        },
        {
          message:
            'Levels must contain exactly one entry for each level (1, 2, 3, 4, 5)',
        },
      )
      .optional(),
  }),
})

export const deleteCompetencySchema = z.object({
  competencyId: z.number().int().positive(),
})

export const listCompetenciesParamsSchema = z.object({
  groupId: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  includeDeleted: z.boolean().default(false).optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CompetencyGroup = z.infer<typeof competencyGroupSchema>
export type CreateCompetencyGroupInput = z.infer<typeof createCompetencyGroupSchema>
export type UpdateCompetencyGroupInput = z.infer<typeof updateCompetencyGroupSchema>

export type CompetencyLevel = z.infer<typeof competencyLevelSchema>
export type CreateCompetencyLevelInput = z.infer<
  typeof createCompetencyLevelInputSchema
>

export type Competency = z.infer<typeof competencySchema>
export type CreateCompetencyInput = z.infer<typeof createCompetencySchema>
export type UpdateCompetencyInput = z.infer<typeof updateCompetencySchema>
export type ListCompetenciesParams = z.infer<typeof listCompetenciesParamsSchema>
