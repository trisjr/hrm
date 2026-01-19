import { z } from 'zod'
import { passwordSchema } from './common-validation'

// --- Schemas ---
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(255),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(128),
})

export type LoginInput = z.infer<typeof loginSchema>

// --- Change Password Schema ---
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// --- Request Password Reset Schema ---
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(255),
})

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>

// --- Reset Password Schema ---
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
