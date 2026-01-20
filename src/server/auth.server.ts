import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'
import {
  emailLogs,
  emailTemplates,
  users,
  verificationTokens,
} from '../db/schema'
import {
  comparePassword,
  hashPassword,
  signToken,
  verifyToken,
} from '../lib/auth.utils'
import type {
  ChangePasswordInput,
  LoginInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from '../lib/auth.schemas'
import {
  changePasswordSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from '../lib/auth.schemas'
import { db } from '@/db'
import { replacePlaceholders, sendEmail } from '../lib/email.utils'
import crypto from 'crypto' // Or use globalThis.crypto if available, but explicit is safer for Node

// @tanstack/start might abstract cookie setting differently, but standard response is fine.

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }: { data: LoginInput }) => {
    const { email, password } = data

    // 1. Find user by email
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt)),
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

export const requestPasswordResetFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => requestPasswordResetSchema.parse(data))
  .handler(async ({ data }: { data: RequestPasswordResetInput }) => {
    const { email } = data

    // 1. Find user (don't reveal if user exists)
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt)),
      with: {
        profile: true,
      },
    })

    if (!user || user.status !== 'ACTIVE') {
      // Fake success to prevent enumeration
      return {
        success: true,
        message: 'If an account exists, an email has been sent.',
      }
    }

    // 2. Generate Token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // 3. Save Token
    await db.insert(verificationTokens).values({
      userId: user.id,
      token,
      type: 'RESET_PASSWORD',
      expiresAt,
    })

    // 4. Send Email
    // Fetch template
    const template = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'PASSWORD_RESET'),
    })

    if (template) {
      // We assume FRONTEND_URL is available via env or we construct it.
      // Ideally should be in .env. but for now I'll fallback to localhost if missing.
      const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000'
      const resetLink = `${baseUrl}/reset-password?token=${token}`

      const emailBody = replacePlaceholders(template.body, {
        fullName: user.profile?.fullName || user.email,
        resetLink,
      })

      // Send (Mock)
      await sendEmail(user.email, template.subject, emailBody)

      // Log email
      await db.insert(emailLogs).values({
        templateId: template.id,
        recipientEmail: user.email,
        subject: template.subject,
        body: emailBody, // Audit trail
        status: 'SENT',
        sentAt: new Date(),
      })
    } else {
      console.warn('RESET_PASSWORD email template not found.')
    }

    return {
      success: true,
      message: 'If an account exists, an email has been sent.',
    }
  })

export const resetPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => resetPasswordSchema.parse(data))
  .handler(async ({ data }: { data: ResetPasswordInput }) => {
    const { token, newPassword } = data

    // 1. Find valid token
    const storedToken = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, 'RESET_PASSWORD'),
        isNull(verificationTokens.deletedAt),
      ),
    })

    if (!storedToken) {
      throw new Error('Invalid or expired password reset token.')
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired password reset token.')
    }

    // 2. Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // 3. Update User Password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, storedToken.userId))

    // 4. Invalidate Token (Delete or Soft Delete)
    // We'll soft delete to keep history if needed, or just delete.
    // Spec says "Delete the used token".
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, storedToken.id))

    return {
      success: true,
      message: 'Password has been reset successfully.',
    }
  })
