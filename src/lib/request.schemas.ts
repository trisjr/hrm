import { z } from 'zod'

// Request Type Enum
export const requestTypeSchema = z.enum([
  'LEAVE',
  'WFH',
  'LATE',
  'EARLY',
  'OVERTIME',
])

// Request Status Enum
export const requestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

// Create Request Schema
export const createRequestSchema = z
  .object({
    type: requestTypeSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isHalfDay: z.boolean(),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must not exceed 500 characters'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      // If half-day, start and end must be the same day
      if (data.isHalfDay) {
        return data.startDate.toDateString() === data.endDate.toDateString()
      }
      return true
    },
    {
      message: 'Half-day requests must be for a single day',
      path: ['isHalfDay'],
    },
  )

export type CreateRequestInput = z.infer<typeof createRequestSchema>

// Approve Request Schema
export const approveRequestSchema = z.object({
  requestId: z.number().int().positive(),
})

export type ApproveRequestInput = z.infer<typeof approveRequestSchema>

// Reject Request Schema
export const rejectRequestSchema = z.object({
  requestId: z.number().int().positive(),
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
})

export type RejectRequestInput = z.infer<typeof rejectRequestSchema>

// Update Request Schema
export const updateRequestSchema = z.object({
  requestId: z.number().int().positive(),
  data: createRequestSchema,
})

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>

// Cancel Request Schema
export const cancelRequestSchema = z.object({
  requestId: z.number().int().positive(),
})

export type CancelRequestInput = z.infer<typeof cancelRequestSchema>

// Request Response Type (for display)
export const requestResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: requestTypeSchema,
  startDate: z.date(),
  endDate: z.date(),
  isHalfDay: z.boolean(),
  reason: z.string().nullable(),
  approverId: z.number().nullable(),
  status: requestStatusSchema,
  rejectionReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  // Relations
  user: z
    .object({
      id: z.number(),
      employeeCode: z.string(),
      email: z.string(),
      profile: z
        .object({
          fullName: z.string(),
          avatarUrl: z.string().nullable(),
        })
        .nullable(),
      team: z
        .object({
          id: z.number(),
          teamName: z.string(),
        })
        .nullable(),
    })
    .optional(),
  approver: z
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

export type RequestResponse = z.infer<typeof requestResponseSchema>
