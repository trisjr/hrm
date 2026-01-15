/**
 * Profile Server Functions
 * Handle data fetching for User Profile screen
 */
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { educationExperience, users } from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'
import {
  createEducationExperienceSchema,
  updateEducationExperienceSchema,
} from '@/lib/profile.schemas'

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

/**
 * Create Education/Experience
 */
export const createEducationExperienceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: createEducationExperienceSchema,
      })
      .parse(data)
  })
  .handler(async ({ data: input }) => {
    const { token, data } = input
    const userSession = verifyToken(token)
    if (!userSession?.id) {
      throw new Error('Unauthorized')
    }

    await db.insert(educationExperience).values({
      userId: userSession.id,
      ...data,
      startDate: data.startDate ? data.startDate : null, // Ensure string is passed if valid, or null. Schema allows string.
      endDate: data.endDate ? data.endDate : null,
    })

    return { success: true }
  })

/**
 * Update Education/Experience
 */
export const updateEducationExperienceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        id: z.number(),
        data: updateEducationExperienceSchema,
      })
      .parse(data)
  })
  .handler(async ({ data: input }) => {
    const { token, id, data } = input
    const userSession = verifyToken(token)
    if (!userSession?.id) {
      throw new Error('Unauthorized')
    }

    // Check ownership
    const item = await db.query.educationExperience.findFirst({
      where: and(
        eq(educationExperience.id, id),
        eq(educationExperience.userId, userSession.id),
      ),
    })

    if (!item) {
      throw new Error('Item not found or unauthorized')
    }

    await db
      .update(educationExperience)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(educationExperience.id, id))

    return { success: true }
  })

/**
 * Delete Education/Experience
 */
export const deleteEducationExperienceFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        id: z.number(),
      })
      .parse(data)
  })
  .handler(async ({ data: input }) => {
    const { token, id } = input
    const userSession = verifyToken(token)
    if (!userSession?.id) {
      throw new Error('Unauthorized')
    }

    // Check ownership
    const item = await db.query.educationExperience.findFirst({
      where: and(
        eq(educationExperience.id, id),
        eq(educationExperience.userId, userSession.id),
      ),
    })

    if (!item) {
      throw new Error('Item not found or unauthorized')
    }

    await db.delete(educationExperience).where(eq(educationExperience.id, id))

    return { success: true }
  })
