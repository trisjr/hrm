/**
 * User Management Server Functions
 * Handle CRUD operations for User with Profile
 */
import crypto from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm'
import type {
  CreateUserInput,
  ListUsersParams,
  UpdateUserInput,
} from '@/lib/user.schemas'
import { db } from '@/db'
import { profiles, users, verificationTokens } from '@/db/schema'
import { hashPassword } from '@/lib/auth.utils'
import {
  createUserSchema,
  listUsersParamsSchema,
  updateUserSchema,
} from '@/lib/user.schemas'

/**
 * Create User
 * Create new user with profile and verification token
 * Default status is INACTIVE, requires email verification to activate
 */
export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data }: { data: CreateUserInput }) => {
    const { password, profile: profileData, ...userData } = data

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
      const verifyToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours

      await tx.insert(verificationTokens).values({
        userId: newUser.id,
        token: verifyToken,
        type: 'ACTIVATION',
        expiresAt,
      })

      return {
        user: newUser,
        profile: newProfile,
        verifyToken,
      }
    })

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
  })

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

    // Fetch users with profile
    const usersList = await db.query.users.findMany({
      where: and(...whereConditions),
      with: {
        profile: true,
        role: true,
        team: true,
        careerBand: true,
      },
      limit,
      offset: (page - 1) * limit,
      orderBy: [desc(users.createdAt)],
    })

    // Transform response
    const transformedUsers = usersList.map((user) => {
      const { passwordHash, deletedAt, ...userWithoutPassword } = user
      return {
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
      }
    })

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
export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { id, ...updateData } = data as { id: string } & UpdateUserInput
    return {
      id: Number(id),
      ...updateUserSchema.parse(updateData),
    }
  })
  .handler(async ({ data }: { data: { id: number } & UpdateUserInput }) => {
    const { id, profile: profileData, ...userData } = data

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
  })

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
