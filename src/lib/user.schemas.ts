/**
 * User Management Validation Schemas
 * Using Zod for input data validation
 */
import { z } from 'zod'

// Profile Schema
export const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  idCardNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  joinDate: z.string().optional().nullable(),
  unionJoinDate: z.string().optional().nullable(),
  unionPosition: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
})

// Create User Schema
export const createUserSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Employee code is required')
    .regex(
      /^[A-Z0-9]+$/,
      'Employee code must contain only uppercase letters and numbers',
    ),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and numbers',
    ),
  roleId: z.number().optional(),
  teamId: z.number().optional(),
  careerBandId: z.number().optional(),
  profile: profileSchema,
})

// Update User Schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  roleId: z.number().optional(),
  teamId: z.number().optional(),
  careerBandId: z.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVED', 'RETIRED']).optional(),
  profile: profileSchema.partial().optional(),
})

// Verify Account Schema
export const verifyAccountSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// List Users Params Schema
export const listUsersParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVED', 'RETIRED']).optional(),
  teamId: z.number().optional(),
  roleId: z.number().optional(),
  search: z.string().optional(),
})

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type VerifyAccountInput = z.infer<typeof verifyAccountSchema>
export type ListUsersParams = z.infer<typeof listUsersParamsSchema>
