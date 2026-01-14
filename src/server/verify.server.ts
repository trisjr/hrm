/**
 * Account Verification Server Functions
 * Handle account verification via email token
 */
import { createServerFn } from '@tanstack/react-start'
import { and, eq, gt, isNull } from 'drizzle-orm'
import type { VerifyAccountInput } from '@/lib/user.schemas'
import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema'
import { verifyAccountSchema } from '@/lib/user.schemas'

/**
 * Verify Account
 * Verify user account via token from email
 * - Validate token is still valid
 * - Update user status from INACTIVE → ACTIVE
 * - Mark token as used
 */
export const verifyAccountFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => verifyAccountSchema.parse(data))
  .handler(async ({ data }: { data: VerifyAccountInput }) => {
    const { token } = data

    // 1. Find verification token
    const verifyToken = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, 'ACTIVATION'),
        isNull(verificationTokens.deletedAt),
        gt(verificationTokens.expiresAt, new Date()), // Token not expired yet
      ),
      with: {
        user: true,
      },
    })

    // 2. Validate token exists
    if (!verifyToken) {
      throw new Error('Token is invalid or has expired')
    }

    // 3. Check if user exists
    if (!verifyToken.user) {
      throw new Error('Account does not exist')
    }

    // 4. Check if user is already active
    if (verifyToken.user.status === 'ACTIVE') {
      return {
        success: true,
        message: 'Account was already verified previously',
        alreadyVerified: true,
      }
    }

    // 5. Activate user account in transaction
    await db.transaction(async (tx) => {
      // Update user status to ACTIVE
      await tx
        .update(users)
        .set({
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(users.id, verifyToken.userId))

      // Mark token as used (soft delete)
      await tx
        .update(verificationTokens)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(verificationTokens.id, verifyToken.id))
    })

    return {
      success: true,
      message: 'Account verified successfully. You can log in now.',
      alreadyVerified: false,
    }
  })

/**
 * Resend Verification Email
 * Resend verification email (create new token)
 * Useful when old token has expired
 */
export const resendVerificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { email } = data as { email: string }
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email')
    }
    return { email }
  })
  .handler(async ({ data }: { data: { email: string } }) => {
    const { email } = data

    // 1. Find user by email
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt)),
    })

    if (!user) {
      // Don't reveal if user exists (security)
      return {
        success: true,
        message: 'If the email exists, we have resent the verification email',
      }
    }

    // 2. Check if user is already active
    if (user.status === 'ACTIVE') {
      throw new Error('Account is already verified, please log in')
    }

    // 3. Invalidate old tokens and create new token
    await db.transaction(async (tx) => {
      // Soft delete all old ACTIVATION tokens for this user
      await tx
        .update(verificationTokens)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(verificationTokens.userId, user.id),
            eq(verificationTokens.type, 'ACTIVATION'),
            isNull(verificationTokens.deletedAt),
          ),
        )

      // Create new token
      const crypto = await import('node:crypto')
      const newToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      await tx.insert(verificationTokens).values({
        userId: user.id,
        token: newToken,
        type: 'ACTIVATION',
        expiresAt,
      })
    })

    return {
      success: true,
      message: 'Verification email has been resent, please check your inbox',
    }
  })
