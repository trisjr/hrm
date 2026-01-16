/**
 * Team Management Server Functions
 * Handle CRUD operations for Teams with proper validation and permissions
 */
import { createServerFn } from '@tanstack/react-start'
import { and, count, eq, ilike, inArray, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import {
  attendanceLogs,
  profiles,
  roles,
  teams,
  users,
  workRequests,
} from '@/db/schema'
import {
  type AddMemberToTeamInput,
  addMemberToTeamSchema,
  type AssignLeaderInput,
  assignLeaderSchema,
  type CreateTeamInput,
  createTeamSchema,
  type DeleteTeamInput,
  type DeleteTeamResponse,
  deleteTeamSchema,
  type GetTeamByIdInput,
  getTeamByIdSchema,
  type GetTeamsInput,
  getTeamsSchema,
  type PaginatedTeams,
  type RemoveMemberFromTeamInput,
  removeMemberFromTeamSchema,
  type TeamDetail,
  type TeamResponse,
  type TeamWithStats,
  type UpdateTeamInput,
  updateTeamSchema,
} from '@/lib/team.schemas'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify user has Admin or HR role
 */
async function verifyAdminOrHR(token: string) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid or expired token')
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, payload.id), isNull(users.deletedAt)),
    with: {
      role: true,
    },
  })

  if (!user || !user.role) {
    throw new Error('User not found or has no role')
  }

  if (!['ADMIN', 'HR'].includes(user.role.roleName)) {
    throw new Error('Insufficient permissions. Admin or HR role required.')
  }

  return user
}

/**
 * Check if team name already exists (case-insensitive)
 */
async function isTeamNameUnique(
  teamName: string,
  excludeTeamId?: number,
): Promise<boolean> {
  const existing = await db.query.teams.findFirst({
    where: and(
      ilike(teams.teamName, teamName),
      isNull(teams.deletedAt),
      excludeTeamId ? sql`${teams.id} != ${excludeTeamId}` : undefined,
    ),
  })

  return !existing
}

/**
 * Verify user is a member of the team
 */
async function isUserInTeam(userId: number, teamId: number): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, userId),
      eq(users.teamId, teamId),
      isNull(users.deletedAt),
    ),
  })

  return !!user
}

// ==================== SERVER FUNCTIONS ====================

/**
 * Create a new team
 */
export const createTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: createTeamSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: CreateTeamInput }
    }) => {
      const { token, data } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      // Check team name uniqueness
      const isUnique = await isTeamNameUnique(data.teamName)
      if (!isUnique) {
        throw new Error(
          `Team name "${data.teamName}" already exists. Please choose a different name.`,
        )
      }

      // If leaderId provided, verify user exists
      if (data.leaderId) {
        const leader = await db.query.users.findFirst({
          where: and(eq(users.id, data.leaderId), isNull(users.deletedAt)),
        })

        if (!leader) {
          throw new Error('Selected leader does not exist')
        }
      }

      // Create team
      const [newTeam] = await db
        .insert(teams)
        .values({
          teamName: data.teamName,
          description: data.description || null,
          leaderId: data.leaderId || null,
        })
        .returning()

      return {
        success: true,
        data: newTeam as TeamResponse,
      }
    },
  )

/**
 * Get teams with pagination and filters
 */
export const getTeamsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        params: getTeamsSchema.optional(),
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; params?: GetTeamsInput }
    }) => {
      const { token, params = {} } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      // Validate and set defaults
      const {
        page = 1,
        limit = 10,
        search,
        filterHasLeader,
        includeDeleted = false,
      } = params

      // Build where conditions
      const conditions = []

      // Exclude deleted teams unless requested
      if (!includeDeleted) {
        conditions.push(isNull(teams.deletedAt))
      }

      // Search by team name
      if (search) {
        conditions.push(ilike(teams.teamName, `%${search}%`))
      }

      // Filter by leader existence
      if (filterHasLeader !== undefined) {
        conditions.push(
          filterHasLeader
            ? sql`${teams.leaderId} IS NOT NULL`
            : isNull(teams.leaderId),
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(teams)
        .where(whereClause)

      // Get paginated teams with leader and member count
      const offset = (page - 1) * limit

      const teamsData = await db
        .select({
          id: teams.id,
          teamName: teams.teamName,
          description: teams.description,
          leaderId: teams.leaderId,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
          deletedAt: teams.deletedAt,
          leader: {
            id: users.id,
            employeeCode: users.employeeCode,
            email: users.email,
            fullName: profiles.fullName,
            avatarUrl: profiles.avatarUrl,
          },
        })
        .from(teams)
        .leftJoin(users, eq(teams.leaderId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(whereClause)
        .orderBy(teams.createdAt)
        .limit(limit)
        .offset(offset)

      // Get member counts for each team
      const teamIds = teamsData.map((t) => t.id)
      const memberCounts = await db
        .select({
          teamId: users.teamId,
          count: count(),
        })
        .from(users)
        .where(
          and(inArray(users.teamId, teamIds), isNull(users.deletedAt)),
        )
        .groupBy(users.teamId)

      const memberCountMap = new Map(
        memberCounts.map((mc) => [mc.teamId!, mc.count]),
      )

      // Combine data with proper null handling
      const teamsWithStats: TeamWithStats[] = teamsData.map((team) => ({
        ...team,
        createdAt: team.createdAt!,
        updatedAt: team.updatedAt!,
        leader: team.leader.id
          ? {
              id: team.leader.id!,
              employeeCode: team.leader.employeeCode!,
              email: team.leader.email!,
              fullName: team.leader.fullName!,
              avatarUrl: team.leader.avatarUrl,
            }
          : null,
        memberCount: memberCountMap.get(team.id) || 0,
      }))

      const result: PaginatedTeams = {
        data: teamsWithStats,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }

      return result
    },
  )

/**
 * Get team by ID with details
 */
export const getTeamByIdFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        params: getTeamByIdSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; params: GetTeamByIdInput }
    }) => {
      const { token, params } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      const { teamId } = params

      // Fetch team with leader
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, teamId), isNull(teams.deletedAt)),
        with: {
          leader: {
            with: {
              profile: true,
            },
          },
        },
      })

      if (!team) {
        throw new Error('Team not found')
      }

      // Fetch team members
      const members = await db
        .select({
          id: users.id,
          employeeCode: users.employeeCode,
          email: users.email,
          phone: users.phone,
          roleName: roles.roleName,
          status: users.status,
          fullName: profiles.fullName,
          avatarUrl: profiles.avatarUrl,
          joinDate: profiles.joinDate,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(and(eq(users.teamId, teamId), isNull(users.deletedAt)))
        .orderBy(profiles.fullName)

      // Calculate statistics
      const totalMembers = members.length

      // Active requests count
      const [{ count: activeRequestsCount }] = await db
        .select({ count: count() })
        .from(workRequests)
        .innerJoin(users, eq(workRequests.userId, users.id))
        .where(
          and(
            eq(users.teamId, teamId),
            eq(workRequests.status, 'PENDING'),
            isNull(workRequests.deletedAt),
          ),
        )

      // Average attendance (simplified - last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const attendanceData = await db
        .select({
          total: count(),
          onTime: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'ON_TIME' THEN 1 ELSE 0 END)`,
        })
        .from(attendanceLogs)
        .innerJoin(users, eq(attendanceLogs.userId, users.id))
        .where(
          and(
            eq(users.teamId, teamId),
            sql`${attendanceLogs.date} >= ${thirtyDaysAgo.toISOString().split('T')[0]}`,
          ),
        )

      const avgAttendance =
        attendanceData[0].total > 0
          ? (Number(attendanceData[0].onTime) / attendanceData[0].total) * 100
          : null

      const result: TeamDetail = {
        id: team.id,
        teamName: team.teamName,
        description: team.description,
        leaderId: team.leaderId,
        createdAt: team.createdAt!,
        updatedAt: team.updatedAt!,
        deletedAt: team.deletedAt,
        leader: team.leader
          ? {
              id: team.leader.id,
              employeeCode: team.leader.employeeCode,
              email: team.leader.email,
              fullName: team.leader.profile?.fullName || '',
              avatarUrl: team.leader.profile?.avatarUrl || null,
            }
          : null,
        members: members.map((m) => ({
          id: m.id,
          employeeCode: m.employeeCode,
          email: m.email,
          phone: m.phone,
          roleName: m.roleName,
          status: m.status || 'INACTIVE', // Provide default
          fullName: m.fullName || '',
          avatarUrl: m.avatarUrl,
          joinDate: m.joinDate || null,
        })),
        stats: {
          totalMembers,
          activeRequests: activeRequestsCount,
          avgAttendance,
        },
      }

      return result
    },
  )

/**
 * Update team
 */
export const updateTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: updateTeamSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: UpdateTeamInput }
    }) => {
      const { token, data: validatedData } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      const { teamId, data: updateData } = validatedData

      // Check if team exists
      const existingTeam = await db.query.teams.findFirst({
        where: and(eq(teams.id, teamId), isNull(teams.deletedAt)),
      })

      if (!existingTeam) {
        throw new Error('Team not found')
      }

      // If updating team name, check uniqueness
      if (updateData.teamName) {
        const isUnique = await isTeamNameUnique(updateData.teamName, teamId)
        if (!isUnique) {
          throw new Error(
            `Team name "${updateData.teamName}" already exists. Please choose a different name.`,
          )
        }
      }

      // If updating leaderId, verify constraints
      if (updateData.leaderId !== undefined) {
        if (updateData.leaderId !== null) {
          // Verify leader exists
          const leader = await db.query.users.findFirst({
            where: and(
              eq(users.id, updateData.leaderId),
              isNull(users.deletedAt),
            ),
          })

          if (!leader) {
            throw new Error('Selected leader does not exist')
          }

          // Verify leader is a member of the team
          const isInTeam = await isUserInTeam(updateData.leaderId, teamId)
          if (!isInTeam) {
            throw new Error(
              'Leader must be a member of the team. Please assign the user to the team first.',
            )
          }
        }
      }

      // Update team
      const [updatedTeam] = await db
        .update(teams)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(teams.id, teamId))
        .returning()

      // TODO: Send email notifications if leader changed

      return {
        success: true,
        data: updatedTeam as TeamResponse,
      }
    },
  )

/**
 * Delete team (soft delete)
 */
export const deleteTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: deleteTeamSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: DeleteTeamInput }
    }) => {
      const { token, data } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      const { teamId } = data

      // Check if team exists
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, teamId), isNull(teams.deletedAt)),
      })

      if (!team) {
        throw new Error('Team not found')
      }

      // Get all team members
      const members = await db.query.users.findMany({
        where: and(eq(users.teamId, teamId), isNull(users.deletedAt)),
        with: {
          profile: true,
        },
      })

      // Soft delete team
      await db
        .update(teams)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teams.id, teamId))

      // Unassign all members
      if (members.length > 0) {
        await db
          .update(users)
          .set({
            teamId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.teamId, teamId))
      }

      // TODO: Send email notifications to affected members

      const result: DeleteTeamResponse = {
        success: true,
        affectedMembers: members.length,
      }

      return result
    },
  )

/**
 * Add member to team
 */
export const addMemberToTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: addMemberToTeamSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: AddMemberToTeamInput }
    }) => {
      const { token, data } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      const { teamId, userId } = data

      // Verify team exists
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, teamId), isNull(teams.deletedAt)),
      })

      if (!team) {
        throw new Error('Team not found')
      }

      // Verify user exists
      const user = await db.query.users.findFirst({
        where: and(eq(users.id, userId), isNull(users.deletedAt)),
        with: {
          profile: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Assign user to team
      await db
        .update(users)
        .set({
          teamId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      // Get updated member count
      const [{ count: newMemberCount }] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.teamId, teamId), isNull(users.deletedAt)))

      // TODO: Send welcome email to user

      return {
        success: true,
        newMemberCount,
      }
    },
  )

/**
 * Remove member from team
 */
export const removeMemberFromTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: removeMemberFromTeamSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: RemoveMemberFromTeamInput }
    }) => {
      const { token, data } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      const { teamId, userId } = data

      // Verify user is in the team
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, userId),
          eq(users.teamId, teamId),
          isNull(users.deletedAt),
        ),
      })

      if (!user) {
        throw new Error('User is not a member of this team')
      }

      // If user is the team leader, clear leaderId
      const team = await db.query.teams.findFirst({
        where: and(
          eq(teams.id, teamId),
          eq(teams.leaderId, userId),
          isNull(teams.deletedAt),
        ),
      })

      if (team) {
        await db
          .update(teams)
          .set({
            leaderId: null,
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId))
      }

      // Remove user from team
      await db
        .update(users)
        .set({
          teamId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      // TODO: Send notification email to user

      return {
        success: true,
      }
    },
  )

/**
 * Assign leader to team
 */
export const assignLeaderFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: assignLeaderSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: AssignLeaderInput }
    }) => {
      const { token, data } = input

      // Verify permissions
      await verifyAdminOrHR(token)

      const { teamId, leaderId } = data

      // Verify team exists
      const team = await db.query.teams.findFirst({
        where: and(eq(teams.id, teamId), isNull(teams.deletedAt)),
        with: {
          leader: {
            with: {
              profile: true,
            },
          },
        },
      })

      if (!team) {
        throw new Error('Team not found')
      }

      // If setting a new leader (not null)
      if (leaderId !== null) {
        // Verify user exists and is a team member
        const isInTeam = await isUserInTeam(leaderId, teamId)
        if (!isInTeam) {
          throw new Error(
            'Leader must be a member of the team. Please assign the user to the team first.',
          )
        }
      }

      // Get LEADER role ID
      const leaderRole = await db.query.roles.findFirst({
        where: eq(roles.roleName, 'LEADER'),
      })

      if (!leaderRole) {
        throw new Error('LEADER role not found in system')
      }

      // Transaction: Update team leader + user role
      await db.transaction(async (tx) => {
        // If there's an old leader, optionally revert their role to DEV
        // (Only if they're not leading another team)
        if (team.leaderId && team.leaderId !== leaderId) {
          const oldLeaderTeamsCount = await tx
            .select({ count: count() })
            .from(teams)
            .where(
              and(
                eq(teams.leaderId, team.leaderId),
                isNull(teams.deletedAt),
              ),
            )

          // If old leader is not leading any other team, revert to DEV
          if (oldLeaderTeamsCount[0].count <= 1) {
            const devRole = await tx.query.roles.findFirst({
              where: eq(roles.roleName, 'DEV'),
            })

            if (devRole) {
              await tx
                .update(users)
                .set({
                  roleId: devRole.id,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, team.leaderId))
            }
          }
        }

        // Update team leader
        await tx
          .update(teams)
          .set({
            leaderId,
            updatedAt: new Date(),
          })
          .where(eq(teams.id, teamId))

        // If assigning a new leader, update their role to LEADER
        if (leaderId !== null) {
          await tx
            .update(users)
            .set({
              roleId: leaderRole.id,
              updatedAt: new Date(),
            })
            .where(eq(users.id, leaderId))
        }
      })

      // TODO: Send emails to old and new leader

      return {
        success: true,
      }
    },
  )
