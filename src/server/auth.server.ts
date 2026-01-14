import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import {
  comparePassword,
  hashPassword,
  signToken,
  verifyToken,
} from '../lib/auth.utils'
import { changePasswordSchema, loginSchema } from '../lib/auth.schemas'
import type { ChangePasswordInput, LoginInput } from '../lib/auth.schemas'
import { db } from '@/db'

// @tanstack/start might abstract cookie setting differently, but standard response is fine.

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }: { data: LoginInput }) => {
    const { email, password } = data

    // 1. Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        profile: true,
        role: true,
      },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // 2. Check if user is active (verify email first)
    if (user.status === 'INACTIVE') {
      throw new Error(
        'Account is not verified. Please check your email to activate your account.',
      )
    }

    if (user.status !== 'ACTIVE') {
      throw new Error(
        `Account status is ${user.status}. Please contact support.`,
      )
    }

    // 3. Verify password
    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // 4. Create session object
    const userSession = {
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

    // 5. Sign token
    const token = signToken(userSession)

    // Optional: Set cookie if needed for SSR context
    // setCookie("auth-token", token, { httpOnly: true, secure: true, sameSite: 'lax' })

    // 6. Return response
    return {
      user: userSession,
      token,
    }
  })

export const changePasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid input')
    }
    const { token, ...passwordData } = data as any
    if (!token || typeof token !== 'string') {
      throw new Error('Unauthorized: No authentication token provided')
    }
    // Validate password data with schema
    const validatedData = changePasswordSchema.parse(passwordData)
    return { token, ...validatedData }
  })
  .handler(
    async ({ data }: { data: ChangePasswordInput & { token: string } }) => {
      const { currentPassword, newPassword, token } = data

      // 1. Verify token and get user session
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // 2. Find user in database
      const user = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 3. Verify current password
      const isValidPassword = await comparePassword(
        currentPassword,
        user.passwordHash,
      )
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      // 4. Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      // 5. Update password in database
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))

      // 6. Return success response
      return {
        success: true,
        message: 'Password changed successfully',
      }
    },
  )
