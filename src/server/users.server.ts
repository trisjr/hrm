/**
 * User Management Server Functions
 * Handle CRUD operations for User with Profile
 */
import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import type {
  CreateUserInput,
  ListUsersParams,
  UpdateUserInput,
} from '@/lib/user.schemas'
import {
  createUserSchema,
  listUsersParamsSchema,
  updateUserSchema,
} from '@/lib/user.schemas'
import { db } from '@/db'
import {
  careerBands,
  profiles,
  roles,
  teams,
  users,
  verificationTokens,
} from '@/db/schema'
import { hashPassword, verifyToken } from '@/lib/auth.utils'

/**
 * Get List Roles
 */
export const getRolesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(roles).where(isNull(roles.deletedAt))
  },
)

/**
 * Get List Career Bands
 */
export const getCareerBandsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.select().from(careerBands).orderBy(careerBands.bandName)
  },
)

/**
 * Create User
 * Create new user with profile and verification token
 * Default status is INACTIVE, requires email verification to activate
 */
export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: createUserSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: CreateUserInput }
    }) => {
      const { token, data: userDataInput } = input
      const { password, profile: profileData, ...userData } = userDataInput

      // 0. Permission Check
      // Verify token
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Get requester info
      const requester = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: { role: true },
      })

      if (!requester?.role) {
        throw new Error('Unauthorized: Requester role not found')
      }

      // If assigning role, check permissions
      if (userData.roleId) {
        const targetRole = await db.query.roles.findFirst({
          where: eq(roles.id, userData.roleId),
        })

        if (
          targetRole &&
          (targetRole.roleName === 'ADMIN' || targetRole.roleName === 'HR')
        ) {
          if (requester.role.roleName !== 'ADMIN') {
            throw new Error(
              'Permission denied: Only Admin can create Admin or HR users',
            )
          }
        }
      }

      // Check email uniqueness
      const existingEmail = await db.query.users.findFirst({
        where: and(eq(users.email, userData.email), isNull(users.deletedAt)),
      })
      if (existingEmail) {
        throw new Error('Email already exists in the system')
      }

      // Check employee code uniqueness
      const existingCode = await db.query.users.findFirst({
        where: and(
          eq(users.employeeCode, userData.employeeCode),
          isNull(users.deletedAt),
        ),
      })
      if (existingCode) {
        throw new Error('Employee code already exists in the system')
      }

      // Hash password
      const passwordHash = await hashPassword(password)

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // 1. Create user with INACTIVE status
        const [newUser] = await tx
          .insert(users)
          .values({
            ...userData,
            passwordHash,
            status: 'INACTIVE', // Not active yet, requires email verification
          })
          .returning()

        // 2. Create profile
        const [newProfile] = await tx
          .insert(profiles)
          .values({
            userId: newUser.id,
            ...profileData,
          })
          .returning()

        // 3. Generate verification token
        const verifyTokenStr = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours

        await tx.insert(verificationTokens).values({
          userId: newUser.id,
          token: verifyTokenStr,
          type: 'ACTIVATION',
          expiresAt,
        })

        return {
          user: newUser,
          profile: newProfile,
          verifyToken: verifyTokenStr,
        }
      })

      // 4. Send Welcome Email (Auto-email)
      // Wrap in try-catch to not block user creation if email fails
      try {
        const { emailTemplates, emailLogs } = await import('@/db/schema')
        const { sendEmail, replacePlaceholders } =
          await import('@/lib/email.utils')

        // Fetch WELCOME_NEW_USER template
        const welcomeTemplate = await db.query.emailTemplates.findFirst({
          where: and(
            eq(emailTemplates.code, 'WELCOME_NEW_USER'),
            isNull(emailTemplates.deletedAt),
          ),
        })

        if (welcomeTemplate) {
          // Build verification link
          const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify?token=${result.verifyToken}`

          // Replace placeholders
          const placeholderValues = {
            fullName: result.profile.fullName,
            email: result.user.email,
            verificationLink,
          }

          const finalSubject = replacePlaceholders(
            welcomeTemplate.subject,
            placeholderValues,
          )
          const finalBody = replacePlaceholders(
            welcomeTemplate.body,
            placeholderValues,
          )

          // Send email
          const emailResult = await sendEmail(
            result.user.email,
            finalSubject,
            finalBody,
          )

          // Create log entry
          await db.insert(emailLogs).values({
            templateId: welcomeTemplate.id,
            senderId: null, // System send
            recipientEmail: result.user.email,
            subject: finalSubject,
            body: finalBody,
            status: emailResult.success ? 'SENT' : 'FAILED',
            sentAt: emailResult.success ? new Date() : null,
            errorMessage: emailResult.error || null,
          })
        }
      } catch (emailError) {
        // Log error but don't fail user creation
        console.error('Failed to send welcome email:', emailError)
      }

      // Return user data with profile (không trả passwordHash)
      const { passwordHash: _, ...userWithoutPassword } = result.user

      return {
        user: {
          ...userWithoutPassword,
          profile: {
            fullName: result.profile.fullName,
            dob: result.profile.dob,
            gender: result.profile.gender,
            idCardNumber: result.profile.idCardNumber,
            address: result.profile.address,
            joinDate: result.profile.joinDate,
            unionJoinDate: result.profile.unionJoinDate,
            unionPosition: result.profile.unionPosition,
            avatarUrl: result.profile.avatarUrl,
          },
        },
        verifyToken: result.verifyToken, // Return to allow logging or email sending
      }
    },
  )

/**
 * List Users
 * Get list of users with pagination and filtering
 * Profile data must be included
 */
export const listUsersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    // Convert query params to proper types
    const params = data as Record<string, unknown>
    return listUsersParamsSchema.parse({
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 10,
      status: params.status,
      teamId: params.teamId ? Number(params.teamId) : undefined,
      roleId: params.roleId ? Number(params.roleId) : undefined,
      search: params.search,
    })
  })
  .handler(async ({ data }: { data: ListUsersParams }) => {
    const { page = 1, limit = 10, status, teamId, roleId, search } = data

    // Build where conditions
    const whereConditions = [isNull(users.deletedAt)]

    if (status) {
      whereConditions.push(eq(users.status, status))
    }
    if (teamId) {
      whereConditions.push(eq(users.teamId, teamId))
    }
    if (roleId) {
      whereConditions.push(eq(users.roleId, roleId))
    }
    if (search) {
      whereConditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.employeeCode, `%${search}%`),
          like(profiles.fullName, `%${search}%`),
        )!,
      )
    }

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(...whereConditions))

    // Fetch users with profile using Query Builder to support search across tables
    const usersList = await db
      .select({
        user: users,
        profile: profiles,
        role: roles,
        team: teams,
        careerBand: careerBands,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(teams, eq(users.teamId, teams.id))
      .leftJoin(careerBands, eq(users.careerBandId, careerBands.id))
      .where(and(...whereConditions))
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(users.createdAt))

    // Transform response
    const transformedUsers = usersList.map(
      ({ user, profile, role, team, careerBand }) => {
        const { passwordHash, deletedAt, ...userWithoutPassword } = user

        return {
          ...userWithoutPassword,
          role: role || null,
          team: team || null,
          careerBand: careerBand || null,
          profile: profile
            ? {
                fullName: profile.fullName,
                dob: profile.dob,
                gender: profile.gender,
                idCardNumber: profile.idCardNumber,
                address: profile.address,
                joinDate: profile.joinDate,
                unionJoinDate: profile.unionJoinDate,
                unionPosition: profile.unionPosition,
                avatarUrl: profile.avatarUrl,
              }
            : {
                // Fallback if profile is missing (should not happen given logic)
                fullName: '',
                dob: null,
                gender: null,
                idCardNumber: null,
                address: null,
                joinDate: null,
                unionJoinDate: null,
                unionPosition: null,
                avatarUrl: null,
              },
        }
      },
    )

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    }
  })

/**
 * Get User by ID
 * Get detailed user information with profile
 */
export const getUserByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const { id } = data as { id: string }
    return { id: Number(id) }
  })
  .handler(async ({ data }: { data: { id: number } }) => {
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, data.id), isNull(users.deletedAt)),
      with: {
        profile: true,
        role: true,
        team: true,
        careerBand: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Transform response
    const { passwordHash, deletedAt, ...userWithoutPassword } = user

    return {
      user: {
        ...userWithoutPassword,
        profile: {
          fullName: user.profile.fullName,
          dob: user.profile.dob,
          gender: user.profile.gender,
          idCardNumber: user.profile.idCardNumber,
          address: user.profile.address,
          joinDate: user.profile.joinDate,
          unionJoinDate: user.profile.unionJoinDate,
          unionPosition: user.profile.unionPosition,
          avatarUrl: user.profile.avatarUrl,
        },
      },
    }
  })

/**
 * Update User
 * Update user and profile information
 */
// Update User
export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    // Validate intersection of { token, id, ...updateUserSchema }
    const schema = z.object({
      token: z.string(),
      id: z.number(),
      data: updateUserSchema,
    })
    const parsed = schema.parse({
      token: (data as any).token,
      id: Number((data as any).id),
      data: (data as any).data,
    })
    return parsed
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; id: number; data: UpdateUserInput }
    }) => {
      const { token, id, data: updateDataInput } = input
      const { profile: profileData, ...userData } = updateDataInput

      // 0. Permission Check
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      const requester = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: { role: true },
      })

      // If assigning role, check permissions
      if (userData.roleId) {
        const targetRole = await db.query.roles.findFirst({
          where: eq(roles.id, userData.roleId),
        })

        if (
          targetRole &&
          (targetRole.roleName === 'ADMIN' || targetRole.roleName === 'HR')
        ) {
          if (requester?.role?.roleName !== 'ADMIN') {
            throw new Error(
              'Permission denied: Only Admin can assign Admin or HR roles',
            )
          }
        }
      }

      // Check user exists
      const existingUser = await db.query.users.findFirst({
        where: and(eq(users.id, id), isNull(users.deletedAt)),
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      // Check email uniqueness if updating email
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await db.query.users.findFirst({
          where: and(eq(users.email, userData.email), isNull(users.deletedAt)),
        })
        if (emailExists) {
          throw new Error('Email already exists in the system')
        }
      }

      // Start transaction
      await db.transaction(async (tx) => {
        // Update user
        if (Object.keys(userData).length > 0) {
          await tx
            .update(users)
            .set({
              ...userData,
              updatedAt: new Date(),
            })
            .where(eq(users.id, id))
        }

        // Update profile if provided
        if (profileData) {
          await tx
            .update(profiles)
            .set({
              ...profileData,
              updatedAt: new Date(),
            })
            .where(eq(profiles.userId, id))
        }
      })

      // Fetch full user data with profile
      const fullUser = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          profile: true,
          role: true,
          team: true,
          careerBand: true,
        },
      })

      if (!fullUser) {
        throw new Error('User not found after update')
      }

      // Transform response
      const { passwordHash, deletedAt, ...userWithoutPassword } = fullUser

      return {
        user: {
          ...userWithoutPassword,
          profile: {
            fullName: fullUser.profile.fullName,
            dob: fullUser.profile.dob,
            gender: fullUser.profile.gender,
            idCardNumber: fullUser.profile.idCardNumber,
            address: fullUser.profile.address,
            joinDate: fullUser.profile.joinDate,
            unionJoinDate: fullUser.profile.unionJoinDate,
            unionPosition: fullUser.profile.unionPosition,
            avatarUrl: fullUser.profile.avatarUrl,
          },
        },
      }
    },
  )

/**
 * Delete User
 * Soft delete user (set deletedAt timestamp)
 */
export const deleteUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { id } = data as { id: string }
    return { id: Number(id) }
  })
  .handler(async ({ data }: { data: { id: number } }) => {
    // Check user exists
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, data.id), isNull(users.deletedAt)),
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.id))

    return {
      success: true,
      message: 'User deleted successfully',
    }
  })
