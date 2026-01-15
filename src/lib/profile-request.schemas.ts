import { z } from 'zod'
import { profileSchema } from './user.schemas'

// Create Profile Update Request Schema
// User sends a partial profile object (only fields they want to change)
export const createProfileUpdateRequestSchema = profileSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  },
)

// Approve Request Schema
export const approveProfileUpdateRequestSchema = z.object({
  requestId: z.number().int().positive(),
})

// Reject Request Schema
export const rejectProfileUpdateRequestSchema = z.object({
  requestId: z.number().int().positive(),
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
})

// Types
export type CreateProfileUpdateRequestInput = z.infer<
  typeof createProfileUpdateRequestSchema
>
export type ApproveProfileUpdateRequestInput = z.infer<
  typeof approveProfileUpdateRequestSchema
>
export type RejectProfileUpdateRequestInput = z.infer<
  typeof rejectProfileUpdateRequestSchema
>
