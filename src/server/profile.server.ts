/**
 * Profile Server Functions
 * Handle data fetching for User Profile screen
 */
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { educationExperience, users } from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

/**
 * Get My Profile
 * Fetches the specific profile information for the authenticated user
 */
export const getMyProfileFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z.object({ token: z.string() }).parse(data)
  })
  .handler(async ({ data }) => {
    const { token } = data

    // 1. Verify User
    const userSession = verifyToken(token)
    if (!userSession || !userSession.id) {
      throw new Error('Unauthorized: Invalid authentication token')
    }

    // 2. Fetch User with Profile & Relations
    const user = await db.query.users.findFirst({
      where: eq(users.id, userSession.id),
      with: {
        profile: true,
        role: true,
        team: true,
        careerBand: true,
        // Add other relations as needed for sidebar
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // 3. Transform/Return
    const { passwordHash, deletedAt, ...secureUser } = user
    return {
      user: secureUser,
    }
  })

/**
 * Get My Education & Experience
 * Fetches the education and experience list for the authenticated user
 */
export const getMyEducationExperienceFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z.object({ token: z.string() }).parse(data)
  })
  .handler(async ({ data }) => {
    const { token } = data

    // 1. Verify User
    const userSession = verifyToken(token)
    if (!userSession || !userSession.id) {
      throw new Error('Unauthorized: Invalid authentication token')
    }

    // 2. Fetch Education & Experience
    const items = await db.query.educationExperience.findMany({
      where: eq(educationExperience.userId, userSession.id),
      orderBy: [desc(educationExperience.startDate)],
    })

    return {
      items,
    }
  })
