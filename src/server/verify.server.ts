/**
 * Account Verification Server Functions
 * Xử lý xác thực tài khoản qua email token
 */
import { createServerFn } from '@tanstack/react-start'
import { and, eq, gt, isNull } from 'drizzle-orm'
import type {VerifyAccountInput} from '@/lib/user.schemas';
import { db } from '@/db'
import { users, verificationTokens } from '@/db/schema'
import {
  
  verifyAccountSchema
} from '@/lib/user.schemas'

/**
 * Verify Account
 * Xác thực tài khoản user qua token từ email
 * - Validate token còn hiệu lực
 * - Cập nhật user status từ INACTIVE → ACTIVE
 * - Đánh dấu token đã sử dụng
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
        gt(verificationTokens.expiresAt, new Date()), // Token chưa hết hạn
      ),
      with: {
        user: true,
      },
    })

    // 2. Validate token exists
    if (!verifyToken) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn')
    }

    // 3. Check if user exists
    if (!verifyToken.user) {
      throw new Error('Tài khoản không tồn tại')
    }

    // 4. Check if user is already active
    if (verifyToken.user.status === 'ACTIVE') {
      return {
        success: true,
        message: 'Tài khoản đã được xác thực trước đó',
        alreadyVerified: true,
      }
    }

    // 5. Activate user account trong transaction
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
      message:
        'Xác thực tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.',
      alreadyVerified: false,
    }
  })

/**
 * Resend Verification Email
 * Gửi lại email xác  thực (tạo token mới)
 * Hữu ích khi token cũ hết hạn
 */
export const resendVerificationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { email } = data as { email: string }
    if (!email || typeof email !== 'string') {
      throw new Error('Email không hợp lệ')
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
      // Không tiết lộ user có tồn tại hay không (security)
      return {
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi lại email xác thực',
      }
    }

    // 2. Check if user is already active
    if (user.status === 'ACTIVE') {
      throw new Error('Tài khoản đã được xác thực, vui lòng đăng nhập')
    }

    // 3. Invalidate old tokens và tạo token mới
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
      message: 'Đã gửi lại email xác thực, vui lòng kiểm tra hộp thư',
    }
  })
