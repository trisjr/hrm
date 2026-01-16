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
  typeof createCompetencyLevelInputSchema>

export type Competency = z.infer<typeof competencySchema>
export type CreateCompetencyInput = z.infer<typeof createCompetencySchema>
export type UpdateCompetencyInput = z.infer<typeof updateCompetencySchema>
export type ListCompetenciesParams = z.infer<typeof listCompetenciesParamsSchema>

// ============================================================================
// COMPETENCY REQUIREMENTS SCHEMAS (Phase 2)
// ============================================================================

export const setCompetencyRequirementSchema = z.object({
  careerBandId: z.number().int().positive('Career Band is required'),
  competencyId: z.number().int().positive('Competency is required'),
  requiredLevel: z
    .number()
    .int()
    .min(1, 'Required level must be between 1 and 5')
    .max(5, 'Required level must be between 1 and 5')
    .nullable(),
})

export const bulkSetRequirementsSchema = z.object({
  requirements: z.array(
    z.object({
      careerBandId: z.number().int().positive(),
      competencyId: z.number().int().positive(),
      requiredLevel: z.number().int().min(1).max(5).nullable(),
    }),
  ),
})

export type SetCompetencyRequirementInput = z.infer<
  typeof setCompetencyRequirementSchema
>
export type BulkSetRequirementsInput = z.infer<typeof bulkSetRequirementsSchema>

// ============================================================================
// ASSESSMENT CYCLES SCHEMAS (Phase 3)
// ============================================================================

export const createAssessmentCycleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Cycle name is required')
    .max(200, 'Cycle name must be less than 200 characters'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

export const updateAssessmentCycleSchema = z.object({
  cycleId: z.number().int().positive(),
  data: z.object({
    name: z.string().trim().min(1).max(200).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional(),
  }),
})

export const listAssessmentCyclesParamsSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
})

export type CreateAssessmentCycleInput = z.infer<
  typeof createAssessmentCycleSchema
>
export type UpdateAssessmentCycleInput = z.infer<
  typeof updateAssessmentCycleSchema
>
export type ListAssessmentCyclesParams = z.infer<
  typeof listAssessmentCyclesParamsSchema
>

// ============================================================================
// USER ASSESSMENTS SCHEMAS (Phase 4)
// ============================================================================

export const submitSelfAssessmentSchema = z.object({
  assessmentId: z.number().int().positive(),
  scores: z.array(
    z.object({
      competencyId: z.number().int().positive(),
      score: z.number().int().min(1).max(5),
      note: z.string().trim().max(500).optional(),
    }),
  ),
})

export const submitLeaderAssessmentSchema = z.object({
  assessmentId: z.number().int().positive(),
  scores: z.array(
    z.object({
      competencyId: z.number().int().positive(),
      score: z.number().int().min(1).max(5),
      note: z.string().trim().max(500).optional(),
    }),
  ),
})

export const finalizeAssessmentSchema = z.object({
  assessmentId: z.number().int().positive(),
  finalScores: z.array(
    z.object({
      competencyId: z.number().int().positive(),
      finalScore: z.number().int().min(1).max(5),
    }),
  ),
  feedback: z.string().trim().max(2000).optional(),
})

export const createUserAssessmentSchema = z.object({
  userId: z.number().int().positive(),
  cycleId: z.number().int().positive(),
})

export type SubmitSelfAssessmentInput = z.infer<typeof submitSelfAssessmentSchema>
export type SubmitLeaderAssessmentInput = z.infer<
  typeof submitLeaderAssessmentSchema
>

// ============================================================================
// IDP SCHEMAS (Phase 5)
// ============================================================================

export const activityTypeEnum = z.enum([
  'READING',
  'TRAINING',
  'MENTORING',
  'PROJECT',
  'OTHER',
])

export const idpActivityStatusEnum = z.enum(['PENDING', 'DONE'])

export const createIDPActivitySchema = z.object({
  competencyId: z.number().int().positive(),
  activityType: activityTypeEnum,
  description: z.string().trim().min(3).max(500),
  successCriteria: z.string().trim().max(500).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional(),
})

export const createIDPSchema = z.object({
  assessmentId: z.number().int().positive().optional(),
  goal: z.string().trim().min(3).max(1000),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  activities: z.array(createIDPActivitySchema).min(1),
})

export const updateIDPActivitySchema = z.object({
  activityId: z.number().int().positive(),
  status: idpActivityStatusEnum,
  result: z.string().trim().optional(),
})

export type CreateIDPInput = z.infer<typeof createIDPSchema>
export type CreateIDPActivityInput = z.infer<typeof createIDPActivitySchema>
export type UpdateIDPActivityInput = z.infer<typeof updateIDPActivitySchema>
