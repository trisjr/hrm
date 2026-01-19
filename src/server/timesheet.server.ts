/**
 * Timesheet Server Functions
 * Handle timesheet data aggregation, public holidays, and export
 */
import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import {
  users,
  workRequests,
  publicHolidays,
  profiles,
  teams,
} from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify user authentication
 */
async function verifyUser(token: string) {
  const payload = verifyToken(token)
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
    with: {
      role: true,
      team: true,
      profile: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

/**
 * Verify Admin or HR role
 */
async function verifyAdminOrHR(token: string) {
  const user = await verifyUser(token)
  if (!['ADMIN', 'HR'].includes(user.role.name)) {
    throw new Error('Unauthorized: Admin or HR role required')
  }
  return user
}

// ==================== TIMESHEET FUNCTIONS ====================

/**
 * Get timesheet data for a specific month
 * 
 * @description Fetches approved requests (OFF/WFH) for calendar display
 * @permissions Employee (self), Leader (team), Admin/HR (all)
 * 
 * @param userId - Optional. If not provided, uses current user. Leader/Admin can specify others.
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2026)
 * 
 * @returns Timesheet data with requests, holidays, and statistics
 */
export const getTimesheetDataFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    params: z.object({
      userId: z.number().int().positive().optional(),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2020).max(2100),
    }),
  })

  const data = schema.parse(ctx.data)
  const requester = await verifyUser(data.token)
  const { userId, month, year } = data.params

  // Determine target user
  let targetUserId = userId || requester.id

  // Permission check
  if (targetUserId !== requester.id) {
    // If requesting someone else's timesheet
    if (requester.role.name === 'LEADER') {
      // Leader can only view team members
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId),
        with: { team: true },
      })

      if (!targetUser || targetUser.team?.id !== requester.team?.id) {
        throw new Error('Unauthorized: Can only view team members')
      }
    } else if (!['ADMIN', 'HR'].includes(requester.role.name)) {
      throw new Error('Unauthorized: Cannot view other users timesheet')
    }
  }

  // Calculate month date range
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of month

  // Fetch approved requests for the month
  const requests = await db.query.workRequests.findMany({
    where: and(
      eq(workRequests.userId, targetUserId),
      eq(workRequests.status, 'APPROVED'),
      gte(workRequests.startDate, startDate.toISOString().split('T')[0]),
      lte(workRequests.endDate, endDate.toISOString().split('T')[0]),
    ),
    with: {
      user: {
        with: {
          profile: true,
        },
      },
      approver: {
        with: {
          profile: true,
        },
      },
    },
    orderBy: (workRequests, { asc }) => [asc(workRequests.startDate)],
  })

  // Fetch public holidays for the month
  const holidays = await db.query.publicHolidays.findMany({
    where: and(
      gte(publicHolidays.date, startDate.toISOString().split('T')[0]),
      lte(publicHolidays.date, endDate.toISOString().split('T')[0]),
    ),
    orderBy: (publicHolidays, { asc }) => [asc(publicHolidays.date)],
  })

  // Calculate statistics
  const stats = calculateMonthStats(requests, startDate, endDate)

  return {
    success: true,
    data: {
      requests,
      publicHolidays: holidays,
      stats,
      month,
      year,
    },
  }
})

/**
 * Calculate monthly statistics from requests
 */
function calculateMonthStats(
  requests: any[],
  startDate: Date,
  endDate: Date,
) {
  let totalOffDays = 0
  let totalWfhDays = 0

  requests.forEach((req) => {
    const reqStart = new Date(req.startDate)
    const reqEnd = new Date(req.endDate)

    // Calculate number of days (inclusive)
    const days =
      Math.floor(
        (reqEnd.getTime() - reqStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1

    if (req.type === 'LEAVE') {
      totalOffDays += days
    } else if (req.type === 'WFH') {
      totalWfhDays += days
    }
  })

  // Calculate total working days in month (Mon-Fri)
  let totalWorkingDays = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday or Saturday
      totalWorkingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return {
    totalWorkingDays,
    totalOffDays,
    totalWfhDays,
    totalPublicHolidays: 0, // Will be calculated from holidays array
    leaveBalance: {
      annual: 12, // TODO: Calculate from user's actual balance
      sick: 5,
      used: totalOffDays,
    },
  }
}

/**
 * Get team timesheet (Leader only)
 * 
 * @description Fetches timesheet data for all team members
 * @permissions Leader, Admin, HR
 */
export const getTeamTimesheetFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    token: z.string(),
    params: z.object({
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2020).max(2100),
    }),
  })

  const data = schema.parse(ctx.data)
  const requester = await verifyUser(data.token)

  // Permission check
  if (!['LEADER', 'ADMIN', 'HR'].includes(requester.role.name)) {
    throw new Error('Unauthorized: Leader, Admin, or HR role required')
  }

  // Get team members
  let teamMembers: any[] = []

  if (requester.role.name === 'LEADER') {
    // Get own team members
    teamMembers = await db.query.users.findMany({
      where: eq(users.teamId, requester.team?.id!),
      with: {
        profile: true,
      },
    })
  } else {
    // Admin/HR can see all
    teamMembers = await db.query.users.findMany({
      with: {
        profile: true,
        team: true,
      },
    })
  }

  // Fetch timesheet for each member
  const timesheets = []
  for (const member of teamMembers) {
    const timesheetData = await getTimesheetDataFn({
      data: {
        token: data.token,
        params: {
          userId: member.id,
          month: data.params.month,
          year: data.params.year,
        },
      },
    } as any)

    timesheets.push({
      user: member,
      ...timesheetData.data,
    })
  }

  return {
    success: true,
    data: timesheets,
  }
})

/**
 * Get public holidays from external API and sync to DB
 * 
 * @description Fetches Vietnam public holidays from Nager.Date API
 * @caching Cached for 1 year
 */
export const getPublicHolidaysFn = createServerFn({
  method: 'POST',
}).handler(async (ctx) => {
  const schema = z.object({
    year: z.number().int().min(2020).max(2100),
  })

  const { year } = schema.parse(ctx.data)

  // Check if we have holidays for this year in DB
  const existingHolidays = await db.query.publicHolidays.findMany({
    where: sql`EXTRACT(YEAR FROM ${publicHolidays.date}) = ${year}`,
  })

  if (existingHolidays.length > 0) {
    return {
      success: true,
      data: existingHolidays,
      source: 'database',
    }
  }

  // Fetch from API
  try {
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/VN`,
    )

    if (!response.ok) {
      throw new Error('Failed to fetch public holidays from API')
    }

    const apiHolidays = await response.json()

    // Insert into DB
    const holidaysToInsert = apiHolidays.map((h: any) => ({
      date: h.date,
      name: h.localName || h.name,
      country: 'VN',
      isRecurring: h.fixed || false,
    }))

    if (holidaysToInsert.length > 0) {
      await db.insert(publicHolidays).values(holidaysToInsert)
    }

    // Fetch again from DB to return consistent format
    const newHolidays = await db.query.publicHolidays.findMany({
      where: sql`EXTRACT(YEAR FROM ${publicHolidays.date}) = ${year}`,
    })

    return {
      success: true,
      data: newHolidays,
      source: 'api',
    }
  } catch (error: any) {
    console.error('Failed to fetch public holidays:', error)
    return {
      success: false,
      error: error.message,
      data: [],
    }
  }
})
