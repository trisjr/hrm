import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import type { UserSession } from '@/types/auth.types'
import { verifyToken } from '@/lib/auth.utils'
import { db } from '@/db'
import { users } from '@/db/schema'

interface ValidateTokenResponse {
  valid: boolean
  user?: UserSession
}

/**
 * Server function to validate JWT token
 * Verifies token signature and checks if user still exists and is active
 */
export const validateTokenFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    if (typeof data !== 'object' || data === null || !('token' in data)) {
      throw new Error('Invalid input: token is required')
    }
    return data as { token: string }
  })
  .handler(async ({ data }): Promise<ValidateTokenResponse> => {
    const { token } = data

    try {
      // 1. Verify JWT token
      const decoded = verifyToken(token)

      if (!decoded) {
        return { valid: false }
      }

      // 2. Fetch user from database to ensure they still exist and are active
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
        with: {
          role: true,
          profile: true,
        },
      })

      if (!user) {
        return { valid: false }
      }

      // 3. Check if user is still active
      if (user.status !== 'ACTIVE') {
        return { valid: false }
      }

      // 4. Construct user session with role name
      const userSession: UserSession = {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role?.roleName,
        teamId: user.teamId,
        careerBandId: user.careerBandId,
        status: user.status,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
      }

      return {
        valid: true,
        user: userSession,
      }
    } catch (error) {
      console.error('Token validation error:', error)
      return { valid: false }
    }
  })
