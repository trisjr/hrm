/**
 * Timesheet Implementation Logic
 * Contains direct DB access and business logic.
 * Should NOT be imported directly by client.
 */
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  users,
  workRequests,
  publicHolidays,
} from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

async function verifyUser(token: string) {
  const payload = verifyToken(token)
  if (!payload) {
    throw new Error('Invalid token')
  }
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

  let totalWorkingDays = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      totalWorkingDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return {
    totalWorkingDays,
    totalOffDays,
    totalWfhDays,
    totalPublicHolidays: 0,
    leaveBalance: {
      annual: 12,
      sick: 5,
      used: totalOffDays,
    },
  }
}

// ==================== EXPORTED FUNCTIONS ====================

export const getTimesheetDataImpl = async (data: {
  token: string
  params: {
    userId?: number
    month: number
    year: number
  }
}) => {
  const requester = await verifyUser(data.token)
  const { userId, month, year } = data.params

  let targetUserId = userId || requester.id

  if (targetUserId !== requester.id) {
    if (requester.role?.roleName === 'LEADER') {
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId),
        with: { team: true },
      })
      if (!targetUser || targetUser.team?.id !== requester.team?.id) {
        throw new Error('Unauthorized: Can only view team members')
      }
    } else if (!['ADMIN', 'HR'].includes(requester.role?.roleName || '')) {
      throw new Error('Unauthorized: Cannot view other users timesheet')
    }
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)



  const requests = await db.query.workRequests.findMany({
    where: and(
      eq(workRequests.userId, targetUserId),
      eq(workRequests.status, 'APPROVED'),
      gte(workRequests.startDate, startDate),
      lte(workRequests.endDate, endDate),
    ),
    with: {
      user: {
        with: { profile: true },
      },
      approver: {
        with: { profile: true },
      },
    },
    orderBy: (workRequests, { asc }) => [asc(workRequests.startDate)],
  })

  const holidays = await db.query.publicHolidays.findMany({
    where: and(
      gte(publicHolidays.date, startDate.toISOString().split('T')[0]),
      lte(publicHolidays.date, endDate.toISOString().split('T')[0]),
    ),
    orderBy: (publicHolidays, { asc }) => [asc(publicHolidays.date)],
  })

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
}

export const getTeamTimesheetImpl = async (data: {
  token: string
  params: {
    month: number
    year: number
  }
}) => {
  const requester = await verifyUser(data.token)

  if (!['LEADER', 'ADMIN', 'HR'].includes(requester.role?.roleName || '')) {
    throw new Error('Unauthorized: Leader, Admin, or HR role required')
  }

  let teamMembers: any[] = []

  if (requester.role?.roleName === 'LEADER') {
    teamMembers = await db.query.users.findMany({
      where: eq(users.teamId, requester.team?.id!),
      with: { profile: true },
    })
  } else {
    teamMembers = await db.query.users.findMany({
      with: { profile: true, team: true },
    })
  }

  const timesheets = []
  for (const member of teamMembers) {
    const timesheetData = await getTimesheetDataImpl({
      token: data.token,
      params: {
        userId: member.id,
        month: data.params.month,
        year: data.params.year,
      },
    })

    timesheets.push({
      user: member,
      ...timesheetData.data,
    })
  }

  return {
    success: true,
    data: timesheets,
  }
}

export const getPublicHolidaysImpl = async (data: { year: number }) => {
  const { year } = data

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

  try {
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/VN`,
    )
    if (!response.ok) throw new Error('Failed to fetch public holidays from API')

    const apiHolidays = await response.json()
    const holidaysToInsert = apiHolidays.map((h: any) => ({
      date: h.date,
      name: h.localName || h.name,
      country: 'VN',
      isRecurring: h.fixed || false,
    }))

    if (holidaysToInsert.length > 0) {
      await db.insert(publicHolidays).values(holidaysToInsert)
    }

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
}
