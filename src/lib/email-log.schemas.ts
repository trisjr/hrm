/**
 * Email Log Validation Schemas
 * Using Zod for input data validation
 */
import { z } from 'zod'

// List Email Logs Params Schema
export const listEmailLogsParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(['SENT', 'FAILED', 'QUEUED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Email Log Response Schema
export const emailLogResponseSchema = z.object({
  id: z.number(),
  templateId: z.number().nullable(),
  senderId: z.number().nullable(),
  recipientEmail: z.string(),
  subject: z.string(),
  body: z.string().nullable(),
  status: z.enum(['SENT', 'FAILED', 'QUEUED']),
  sentAt: z.date().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  // Relations
  template: z
    .object({
      id: z.number(),
      code: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  sender: z
    .object({
      id: z.number(),
      employeeCode: z.string(),
      profile: z
        .object({
          fullName: z.string(),
        })
        .nullable(),
    })
    .nullable()
    .optional(),
})

// Type exports
export type ListEmailLogsParams = z.infer<typeof listEmailLogsParamsSchema>
export type EmailLogResponse = z.infer<typeof emailLogResponseSchema>
