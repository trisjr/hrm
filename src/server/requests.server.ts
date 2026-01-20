/**
 * Work Requests Server Functions
 * Handle CRUD operations for Work Requests (Leave, WFH, etc.)
 */
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull, count } from 'drizzle-orm'
import { z } from 'zod'
import type {
  ApproveRequestInput,
  CancelRequestInput,
  CreateRequestInput,
  RejectRequestInput,
  UpdateRequestInput,
} from '@/lib/request.schemas'
import {
  approveRequestSchema,
  cancelRequestSchema,
  createRequestSchema,
  rejectRequestSchema,
  updateRequestSchema,
} from '@/lib/request.schemas'
import { db } from '@/db'
import { users, workRequests } from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

/**
 * Permission Helper: Check if user can approve a request
 */
async function canApproveRequest(
  approverId: number,
  requestId: number,
): Promise<{ canApprove: boolean; reason?: string }> {
  // Get request with user details
  const request = await db.query.workRequests.findFirst({
    where: eq(workRequests.id, requestId),
    with: {
      user: {
        with: {
          team: true,
          role: true,
        },
      },
    },
  })

  if (!request) {
    return { canApprove: false, reason: 'Request not found' }
  }

  // Request must be PENDING
  if (!request.status || request.status !== 'PENDING') {
    const statusMsg = request.status
      ? request.status.toLowerCase()
      : 'processed'
    return {
      canApprove: false,
      reason: `Request is already ${statusMsg}`,
    }
  }

  // Cannot approve own request
  if (request.userId === approverId) {
    return { canApprove: false, reason: 'Cannot approve your own request' }
  }

  // Get approver details
  const approver = await db.query.users.findFirst({
    where: eq(users.id, approverId),
    with: {
      role: true,
      leadingTeam: true,
    },
  })

  if (!approver?.role) {
    return { canApprove: false, reason: 'Approver role not found' }
  }

  // HR/Admin can approve all requests
  if (approver.role.roleName === 'HR' || approver.role.roleName === 'ADMIN') {
    return { canApprove: true }
  }

  // If requester is a Leader, only HR/Admin can approve
  if (request.user.role?.roleName === 'Leader') {
    return {
      canApprove: false,
      reason: 'Only HR or Admin can approve Leader requests',
    }
  }

  // If approver is a Leader, can approve requests from their team members
  if (approver.role.roleName === 'Leader' && approver.leadingTeam) {
    if (request.user.teamId === approver.leadingTeam.id) {
      return { canApprove: true }
    }
    return {
      canApprove: false,
      reason: 'Can only approve requests from your team members',
    }
  }

  return { canApprove: false, reason: 'Insufficient permissions' }
}

/**
 * Create Request
 * User creates a new work request (leave, WFH, etc.)
 */
export const createRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: createRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: CreateRequestInput }
    }) => {
      const { token, data: requestData } = input

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Create request
      const [newRequest] = await db
        .insert(workRequests)
        .values({
          userId: userSession.id,
          type: requestData.type,
          startDate: requestData.startDate,
          endDate: requestData.endDate,
          isHalfDay: requestData.isHalfDay,
          reason: requestData.reason,
          status: 'PENDING',
        })
        .returning()

      return {
        success: true,
        data: newRequest,
      }
    },
  )

/**
 * Get Sent Requests
 * Get all requests created by the current user
 */
export const getRequestsSentFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
      })
      .parse(data)
  })
  .handler(
    async ({
      data,
    }: {
      data: { token: string; page: number; limit: number }
    }) => {
      const { token, page, limit } = data

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      console.log(`[getRequestsSentFn] User: ${userSession.id}, Page: ${page}, Limit: ${limit}`)

      const offset = (page - 1) * limit

      // Count total requests
      const [totalResult] = await db
        .select({ count: count() })
        .from(workRequests)
        .where(
          and(
            eq(workRequests.userId, userSession.id),
            isNull(workRequests.deletedAt),
          ),
        )

      const total = totalResult?.count || 0
      const totalPages = Math.ceil(total / limit)
      
      console.log(`[getRequestsSentFn] Total requests found: ${total}`)

      // Fetch paginated requests
      const requests = await db.query.workRequests.findMany({
        where: and(
          eq(workRequests.userId, userSession.id),
          isNull(workRequests.deletedAt),
        ),
        with: {
          approver: {
            with: {
              profile: true,
            },
          },
        },
        orderBy: [desc(workRequests.createdAt)],
        limit,
        offset,
      })
      
      console.log(`[getRequestsSentFn] Fetched ${requests.length} requests`)

      return {
        success: true,
        data: requests,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      }
    },
  )

/**
 * Get Received Requests
 * Get all pending requests that the current user can approve
 * - HR/Admin: See all pending requests
 * - Leader: See pending requests from team members (excluding other Leaders)
 * - DEV: See nothing (no permission)
 */
export const getRequestsReceivedFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(10),
      })
      .parse(data)
  })
  .handler(
    async ({
      data,
    }: {
      data: { token: string; page: number; limit: number }
    }) => {
      const { token, page, limit } = data

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      const offset = (page - 1) * limit

      // Get current user with role and team info
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: {
          role: true,
          leadingTeam: {
            with: {
              members: true,
            },
          },
        },
      })

      if (!currentUser?.role) {
        throw new Error('User role not found')
      }

      let requests: Array<any> = []
      let total = 0

      // HR/Admin: See all pending requests
      if (
        currentUser.role.roleName === 'HR' ||
        currentUser.role.roleName === 'ADMIN'
      ) {
        // Count total
        const [totalResult] = await db
          .select({ count: count() })
          .from(workRequests)
          .where(
            and(
              eq(workRequests.status, 'PENDING'),
              isNull(workRequests.deletedAt),
            ),
          )
        total = totalResult?.count || 0

        requests = await db.query.workRequests.findMany({
          where: and(
            eq(workRequests.status, 'PENDING'),
            isNull(workRequests.deletedAt),
          ),
          with: {
            user: {
              with: {
                profile: true,
                team: true,
                role: true,
              },
            },
          },
          orderBy: [desc(workRequests.createdAt)],
          limit,
          offset,
        })
      }
      // Leader: See pending requests from team members (exclude Leaders and self)
      else if (
        currentUser.role.roleName === 'Leader' &&
        currentUser.leadingTeam
      ) {
        // Get team member IDs (excluding Leaders)
        const teamMembers = currentUser.leadingTeam.members || []
        const memberIds = teamMembers
          .filter((member) => member.id !== currentUser.id) // Exclude self
          .map((member) => member.id)

        if (memberIds.length > 0) {
          // Count total (approximate, includes Leaders initially)
          // Ideally we filter leaders out in DB query, but Role is joined.
          // For simplicity, we'll fetch ID list first or just apply pagination on fetched list (not ideal for large data).
          // Better approach: Join with Users and Roles to filter in SQL.
          // Given constraint, let's fetch IDs first.

          // Optimization: Since we need to filter by Role 'Leader', we can't easily do it in simple where clause without joining.
          // Let's assume for pagination we count all valid team member requests first.
          // Wait, the original logic filtered `request.user.role?.roleName !== 'Leader'` in JS memory.
          // That breaks SQL pagination.
          // We MUST do this in SQL or accept imperfect pagination.
          // Let's try to query Users first to get non-leader member IDs.


          const validMemberIds = await db.query.users.findMany({
             where: inArray(users.id, memberIds),
             with: { role: true },
             columns: { id: true }
          }).then(users => users.filter(u => u.role?.roleName !== 'Leader').map(u => u.id))
          
          if (validMemberIds.length > 0) {
             const [totalResult] = await db.select({ count: count() })
                .from(workRequests)
                .where(and(eq(workRequests.status, 'PENDING'), inArray(workRequests.userId, validMemberIds), isNull(workRequests.deletedAt)))
             total = totalResult?.count || 0

             requests = await db.query.workRequests.findMany({
                where: and(eq(workRequests.status, 'PENDING'), inArray(workRequests.userId, validMemberIds), isNull(workRequests.deletedAt)),
                with: {
                    user: { with: { profile: true, team: true, role: true } }
                },
                orderBy: [desc(workRequests.createdAt)],
                limit,
                offset
             })
          }
        }
      }
      // DEV: No permission to approve
      else {
        requests = []
        total = 0
      }

      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: requests,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      }
    },
  )

/**
 * Approve Request
 * Approve a pending work request
 */
export const approveRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: approveRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: ApproveRequestInput }
    }) => {
      const { token, data: approvalData } = input

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Permission check
      const permissionCheck = await canApproveRequest(
        userSession.id,
        approvalData.requestId,
      )

      if (!permissionCheck.canApprove) {
        throw new Error(
          `Permission denied: ${permissionCheck.reason || 'Cannot approve this request'}`,
        )
      }

      // Approve request
      await db
        .update(workRequests)
        .set({
          status: 'APPROVED',
          approverId: userSession.id,
          updatedAt: new Date(),
        })
        .where(eq(workRequests.id, approvalData.requestId))

      return {
        success: true,
        message: 'Request approved successfully',
      }
    },
  )

/**
 * Reject Request
 * Reject a pending work request with reason
 */
export const rejectRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: rejectRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: RejectRequestInput }
    }) => {
      const { token, data: rejectionData } = input

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Permission check
      const permissionCheck = await canApproveRequest(
        userSession.id,
        rejectionData.requestId,
      )

      if (!permissionCheck.canApprove) {
        throw new Error(
          `Permission denied: ${permissionCheck.reason || 'Cannot reject this request'}`,
        )
      }

      // Reject request
      await db
        .update(workRequests)
        .set({
          status: 'REJECTED',
          approverId: userSession.id,
          rejectionReason: rejectionData.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(workRequests.id, rejectionData.requestId))

      return {
        success: true,
        message: 'Request rejected successfully',
      }
    },
  )

/**
 * Update Request
 * Update a pending work request (only owner can edit)
 */
export const updateRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: updateRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: UpdateRequestInput }
    }) => {
      const { token, data: updateData } = input

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Get request to check ownership and status
      const request = await db.query.workRequests.findFirst({
        where: and(
          eq(workRequests.id, updateData.requestId),
          isNull(workRequests.deletedAt),
        ),
      })

      if (!request) {
        throw new Error('Request not found')
      }

      // Only owner can edit
      if (request.userId !== userSession.id) {
        throw new Error('Permission denied: Only request owner can edit')
      }

      // Only PENDING requests can be edited
      if (!request.status || request.status !== 'PENDING') {
        const statusMsg = request.status
          ? request.status.toLowerCase()
          : 'processed'
        throw new Error(`Cannot edit request that is already ${statusMsg}`)
      }

      // Update request
      await db
        .update(workRequests)
        .set({
          type: updateData.data.type,
          startDate: updateData.data.startDate,
          endDate: updateData.data.endDate,
          isHalfDay: updateData.data.isHalfDay,
          reason: updateData.data.reason,
          updatedAt: new Date(),
        })
        .where(eq(workRequests.id, updateData.requestId))

      return {
        success: true,
        message: 'Request updated successfully',
      }
    },
  )

/**
 * Cancel Request
 * Soft delete a pending work request (only owner can cancel)
 */
export const cancelRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: cancelRequestSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: CancelRequestInput }
    }) => {
      const { token, data: cancelData } = input

      // Authentication
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Get request to check ownership and status
      const request = await db.query.workRequests.findFirst({
        where: and(
          eq(workRequests.id, cancelData.requestId),
          isNull(workRequests.deletedAt),
        ),
      })

      if (!request) {
        throw new Error('Request not found')
      }

      // Only owner can cancel
      if (request.userId !== userSession.id) {
        throw new Error('Permission denied: Only request owner can cancel')
      }

      // Only PENDING requests can be cancelled
      if (!request.status || request.status !== 'PENDING') {
        const statusMsg = request.status
          ? request.status.toLowerCase()
          : 'processed'
        throw new Error(`Cannot cancel request that is already ${statusMsg}`)
      }

      // Soft delete
      await db
        .update(workRequests)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workRequests.id, cancelData.requestId))

      return {
        success: true,
        message: 'Request cancelled successfully',
      }
    },
  )
