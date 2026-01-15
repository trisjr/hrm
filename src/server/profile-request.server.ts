/**
 * Profile Update Request Server Functions
 * Handle creation, approval, and rejection of profile updates
 */
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { profileUpdateRequests, profiles, users } from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'
import {
  approveProfileUpdateRequestSchema,
  createProfileUpdateRequestSchema,
  rejectProfileUpdateRequestSchema,
} from '@/lib/profile-request.schemas'
import type {
  ApproveProfileUpdateRequestInput,
  CreateProfileUpdateRequestInput,
  RejectProfileUpdateRequestInput,
} from '@/lib/profile-request.schemas'

/**
 * Helper: Check if Approver has permission
 */
async function canReviewProfileRequest(reviewerId: number) {
  const reviewer = await db.query.users.findFirst({
    where: eq(users.id, reviewerId),
    with: { role: true },
  })

  if (
    !reviewer?.role ||
    (reviewer.role.roleName !== 'ADMIN' && reviewer.role.roleName !== 'HR')
  ) {
    return false
  }
  return true
}

/**
 * 1. Create Profile Update Request
 */
export const createProfileUpdateRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: createProfileUpdateRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: CreateProfileUpdateRequestInput }
    }) => {
      const { token, data: updateData } = input

      // Verify User
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Fetch User Role to check permissions
      const user = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: { role: true },
      })

      if (!user) throw new Error('User not found')

      // Allow ADMIN and HR to update directly without approval
      if (user.role?.roleName === 'ADMIN' || user.role?.roleName === 'HR') {
        await db
          .update(profiles)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(profiles.userId, userSession.id))

        return { success: true, message: 'Profile updated successfully' }
      }

      // Check for PENDING request
      const existingPending = await db.query.profileUpdateRequests.findFirst({
        where: and(
          eq(profileUpdateRequests.userId, userSession.id),
          eq(profileUpdateRequests.status, 'PENDING'),
          isNull(profileUpdateRequests.deletedAt),
        ),
      })

      if (existingPending) {
        throw new Error(
          'You already have a pending profile update request. Please wait for approval.',
        )
      }

      // Create Request
      await db.insert(profileUpdateRequests).values({
        userId: userSession.id,
        dataChanges: updateData,
        status: 'PENDING',
      })

      return { success: true, message: 'Profile update request submitted' }
    },
  )

/**
 * 2. Get My Pending Request
 * Used to show banner on Profile page
 */
export const getMyPendingProfileRequestFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z.object({ token: z.string() }).parse(data)
  })
  .handler(async ({ data }) => {
    const { token } = data
    const userSession = verifyToken(token)
    if (!userSession?.id) {
      throw new Error('Unauthorized')
    }

    const request = await db.query.profileUpdateRequests.findFirst({
      where: and(
        eq(profileUpdateRequests.userId, userSession.id),
        eq(profileUpdateRequests.status, 'PENDING'),
        isNull(profileUpdateRequests.deletedAt),
      ),
    })

    return {
      request: request
        ? { ...request, dataChanges: request.dataChanges as Record<string, any> }
        : undefined,
    }
  })

/**
 * 3. List Profile Requests (Admin/HR)
 */
export const listProfileRequestsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      })
      .parse(data)
  })
  .handler(async ({ data }) => {
    const { token, status } = data
    const userSession = verifyToken(token)
    if (!userSession?.id) {
      throw new Error('Unauthorized')
    }

    if (!(await canReviewProfileRequest(userSession.id))) {
      throw new Error('Permission denied')
    }

    const whereConditions = [isNull(profileUpdateRequests.deletedAt)]
    if (status) {
      whereConditions.push(eq(profileUpdateRequests.status, status))
    }

    const requests = await db.query.profileUpdateRequests.findMany({
      where: and(...whereConditions),
      with: {
        user: {
          with: {
            profile: true,
            role: true,
            team: true,
          },
        },
      },
      orderBy: [desc(profileUpdateRequests.createdAt)],
    })

    return {
      requests: requests.map((req) => ({
        ...req,
        dataChanges: req.dataChanges as Record<string, any>,
      })),
    }
  })

/**
 * 4. Approve Request
 */
export const approveProfileUpdateRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: approveProfileUpdateRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: ApproveProfileUpdateRequestInput }
    }) => {
      const { token, data: approvalData } = input
      const userSession = verifyToken(token)
      if (!userSession?.id) {
        throw new Error('Unauthorized')
      }

      if (!(await canReviewProfileRequest(userSession.id))) {
        throw new Error('Permission denied')
      }

      const request = await db.query.profileUpdateRequests.findFirst({
        where: eq(profileUpdateRequests.id, approvalData.requestId),
      })

      if (!request) {
        throw new Error('Request not found')
      }

      if (request.status !== 'PENDING') {
        throw new Error('Request is not pending')
      }

      // Transaction: Update Request -> Update Profile
      await db.transaction(async (tx) => {
        // 1. Update Profile
        const changes = request.dataChanges as Record<string, any>
        await tx
          .update(profiles)
          .set({ ...changes, updatedAt: new Date() })
          .where(eq(profiles.userId, request.userId))

        // 2. Update Request Status
        await tx
          .update(profileUpdateRequests)
          .set({
            status: 'APPROVED',
            reviewerId: userSession.id,
            updatedAt: new Date(),
          })
          .where(eq(profileUpdateRequests.id, request.id))
      })

      return { success: true, message: 'Request approved and profile updated' }
    },
  )

/**
 * 5. Reject Request
 */
export const rejectProfileUpdateRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: rejectProfileUpdateRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: RejectProfileUpdateRequestInput }
    }) => {
      const { token, data: rejectionData } = input
      const userSession = verifyToken(token)
      if (!userSession?.id) {
        throw new Error('Unauthorized')
      }

      if (!(await canReviewProfileRequest(userSession.id))) {
        throw new Error('Permission denied')
      }

      const request = await db.query.profileUpdateRequests.findFirst({
        where: eq(profileUpdateRequests.id, rejectionData.requestId),
      })

      if (!request) {
        throw new Error('Request not found')
      }

      if (request.status !== 'PENDING') {
        throw new Error('Request is not pending')
      }

      // Update Request Status
      await db
        .update(profileUpdateRequests)
        .set({
          status: 'REJECTED',
          reviewerId: userSession.id,
          rejectionReason: rejectionData.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(profileUpdateRequests.id, request.id))

      return { success: true, message: 'Request rejected' }
    },
  )
