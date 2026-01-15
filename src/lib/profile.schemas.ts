import { z } from 'zod'

export const educationExperienceTypeSchema = z.enum(['Education', 'Experience'])

export const createEducationExperienceSchema = z.object({
  type: educationExperienceTypeSchema,
  organizationName: z.string().min(1, 'Organization name is required'),
  positionMajor: z.string().min(1, 'Position / Major is required'),
  startDate: z.string().min(1, 'Start date is required'), // ISO Date string
  endDate: z.string().nullable().optional(), // ISO Date string
  description: z.string().nullable().optional(),
})

export const updateEducationExperienceSchema =
  createEducationExperienceSchema.partial()

export type CreateEducationExperienceInput = z.infer<
  typeof createEducationExperienceSchema
>
export type UpdateEducationExperienceInput = z.infer<
  typeof updateEducationExperienceSchema
>
