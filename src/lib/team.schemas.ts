import { z } from 'zod'

// ==================== INPUT SCHEMAS ====================

/**
 * Schema for creating a new team
 */
export const createTeamSchema = z.object({
  teamName: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(100, 'Team name must not exceed 100 characters')
    .trim(),
  description: z.string().trim().optional(),
  leaderId: z.number().int().positive().nullable().optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

/**
 * Schema for updating an existing team
 */
export const updateTeamSchema = z.object({
  teamId: z.number().int().positive(),
  data: z.object({
    teamName: z
      .string()
      .min(3, 'Team name must be at least 3 characters')
      .max(100, 'Team name must not exceed 100 characters')
      .trim()
      .optional(),
    description: z.string().trim().optional(),
    leaderId: z.number().int().positive().nullable().optional(),
  }),
})

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

/**
 * Schema for assigning a leader to a team
 */
export const assignLeaderSchema = z.object({
  teamId: z.number().int().positive(),
  leaderId: z.number().int().positive().nullable(),
})

export type AssignLeaderInput = z.infer<typeof assignLeaderSchema>

/**
 * Schema for adding a member to a team
 */
export const addMemberToTeamSchema = z.object({
  teamId: z.number().int().positive(),
  userId: z.number().int().positive(),
})

export type AddMemberToTeamInput = z.infer<typeof addMemberToTeamSchema>

/**
 * Schema for removing a member from a team
 */
export const removeMemberFromTeamSchema = z.object({
  teamId: z.number().int().positive(),
  userId: z.number().int().positive(),
})

export type RemoveMemberFromTeamInput = z.infer<
  typeof removeMemberFromTeamSchema
>

/**
 * Schema for deleting a team
 */
export const deleteTeamSchema = z.object({
  teamId: z.number().int().positive(),
})

export type DeleteTeamInput = z.infer<typeof deleteTeamSchema>

/**
 * Schema for fetching teams with filters
 */
export const getTeamsSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(10).optional(),
  search: z.string().trim().optional(),
  filterHasLeader: z.boolean().optional(),
  includeDeleted: z.boolean().default(false).optional(),
})

export type GetTeamsInput = z.infer<typeof getTeamsSchema>

/**
 * Schema for fetching a single team by ID
 */
export const getTeamByIdSchema = z.object({
  teamId: z.number().int().positive(),
})

export type GetTeamByIdInput = z.infer<typeof getTeamByIdSchema>

/**
 * Schema for team analytics date range
 */
export const getTeamAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type GetTeamAnalyticsInput = z.infer<typeof getTeamAnalyticsSchema>

/**
 * Schema for exporting teams to Excel
 */
export const exportTeamsSchema = z.object({
  teamIds: z.array(z.number().int().positive()).optional(),
})

export type ExportTeamsInput = z.infer<typeof exportTeamsSchema>

// ==================== RESPONSE SCHEMAS ====================

/**
 * Basic team response
 */
export const teamResponseSchema = z.object({
  id: z.number(),
  teamName: z.string(),
  description: z.string().nullable(),
  leaderId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})

export type TeamResponse = z.infer<typeof teamResponseSchema>

/**
 * Team with leader details
 */
export const teamWithLeaderSchema = teamResponseSchema.extend({
  leader: z
    .object({
      id: z.number(),
      employeeCode: z.string(),
      email: z.string(),
      fullName: z.string(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
})

export type TeamWithLeader = z.infer<typeof teamWithLeaderSchema>

/**
 * Team with statistics
 */
export const teamWithStatsSchema = teamWithLeaderSchema.extend({
  memberCount: z.number().int().min(0),
})

export type TeamWithStats = z.infer<typeof teamWithStatsSchema>

/**
 * User profile for team members
 */
export const teamMemberSchema = z.object({
  id: z.number(),
  employeeCode: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  roleName: z.string().nullable(),
  status: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  joinDate: z.string().nullable(),
})

export type TeamMember = z.infer<typeof teamMemberSchema>

/**
 * Team detail response with members and stats
 */
export const teamDetailSchema = teamWithLeaderSchema.extend({
  members: z.array(teamMemberSchema),
  stats: z.object({
    totalMembers: z.number().int().min(0),
    activeRequests: z.number().int().min(0),
    avgAttendance: z.number().min(0).max(100).nullable(),
  }),
})

export type TeamDetail = z.infer<typeof teamDetailSchema>

/**
 * Paginated teams response
 */
export const paginatedTeamsSchema = z.object({
  data: z.array(teamWithStatsSchema),
  total: z.number().int().min(0),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().min(0),
})

export type PaginatedTeams = z.infer<typeof paginatedTeamsSchema>

/**
 * Team analytics response
 */
export const teamAnalyticsSchema = z.object({
  totalTeams: z.number().int().min(0),
  totalMembers: z.number().int().min(0),
  totalLeaders: z.number().int().min(0),
  avgTeamSize: z.number().min(0),
  teamsWithLeader: z.number().int().min(0),
  teamsWithoutLeader: z.number().int().min(0),
  teamSizeDistribution: z.array(
    z.object({
      name: z.string(), // e.g., "1-5 Members"
      value: z.number().int().min(0),
    }),
  ),
  leaderStatus: z.array(
    z.object({
      name: z.string(), // "Assigned", "Unassigned"
      value: z.number().int().min(0),
      fill: z.string().optional(),
    }),
  ),
  largestTeams: z.array(
    z.object({
      id: z.number(),
      teamName: z.string(),
      memberCount: z.number().int().min(0),
    }),
  ),
})

export type TeamAnalytics = z.infer<typeof teamAnalyticsSchema>

/**
 * Delete team response
 */
export const deleteTeamResponseSchema = z.object({
  success: z.boolean(),
  affectedMembers: z.number().int().min(0),
})

export type DeleteTeamResponse = z.infer<typeof deleteTeamResponseSchema>
