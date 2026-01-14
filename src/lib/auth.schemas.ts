import { z } from 'zod'

// --- Schemas ---
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.').max(255),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(128),
})

export type LoginInput = z.infer<typeof loginSchema>
