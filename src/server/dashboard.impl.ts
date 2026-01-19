/**
 * Dashboard Implementation
 * Aggregates data for role-based dashboard views
 */
import { eq, and, gte, lte, count, desc, or } from 'drizzle-orm'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { db } from '@/db'
import {
  users,
  workRequests,
  publicHolidays,
  userSkills,
} from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

async function verifyUser(token: string) {
  const payload = verifyToken(token)
  if (!payload) throw new Error('Invalid token')
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
    with: { 
      role: true, 
      profile: true,
      team: true, 
    },
  })

  if (!user) throw new Error('User not found')
  return user
}

// ==================== EXPORTED FUNCTIONS ====================

export const getDashboardStatsImpl = async (data: { token: string }) => {
  const user = await verifyUser(data.token)
  const role = user.role?.roleName || 'DEV'
  
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // --- 1. Personal Stats (All Roles) ---

  // Count Leave Days taken this month (approx based on requests)
  const leaveRequestsMonth = await db
    .select({ count: count() })
    .from(workRequests)
    .where(and(
      eq(workRequests.userId, user.id),
      eq(workRequests.type, 'LEAVE'),
      eq(workRequests.status, 'APPROVED'),
      gte(workRequests.startDate, monthStart),
      lte(workRequests.startDate, monthEnd)
    ))

  // Count WFH Days taken this month
  const wfhRequestsMonth = await db
    .select({ count: count() })
    .from(workRequests)
    .where(and(
      eq(workRequests.userId, user.id),
      eq(workRequests.type, 'WFH'),
      eq(workRequests.status, 'APPROVED'),
      gte(workRequests.startDate, monthStart),
      lte(workRequests.startDate, monthEnd)
    ))

  // Total Skills
  const totalSkills = await db
    .select({ count: count() })
    .from(userSkills)
    .where(eq(userSkills.userId, user.id))

  // Pending My Requests
  const pendingRequests = await db.query.workRequests.findMany({
    where: and(
      eq(workRequests.userId, user.id),
      eq(workRequests.status, 'PENDING')
    ),
    orderBy: [desc(workRequests.createdAt)],
    limit: 5,
  })

  // Upcoming Holidays (Next 1 events)
  const holidays = await db.query.publicHolidays.findMany({
    where: gte(publicHolidays.date, now.toISOString().split('T')[0]),
    orderBy: [publicHolidays.date],
    limit: 1,
  })

  // Determine Today's Status
  const activeRequestToday = await db.query.workRequests.findFirst({
    where: and(
      eq(workRequests.userId, user.id),
      eq(workRequests.status, 'APPROVED'),
      lte(workRequests.startDate, todayEnd), // Start <= TodayEnd
      gte(workRequests.endDate, todayStart)  // End >= TodayStart
    ),
  })

  let todayStatus = {
    status: 'OFFICE',
    detail: null as any
  }

  if (activeRequestToday) {
    todayStatus = {
      status: activeRequestToday.type,
      detail: activeRequestToday
    }
  }

  // --- 2. Leader / Admin Stats ---
  let teamStats = null

  if (['LEADER', 'ADMIN'].includes(role)) {
    const myTeamId = user.teamId

    if (myTeamId || role === 'ADMIN') {
      let totalMembers = 0
      if (role === 'ADMIN') {
        const res = await db.select({ count: count() }).from(users)
        totalMembers = res[0].count
      } else if (myTeamId) {
         // Count members of my team
         const res = await db.select({ count: count() })
            .from(users)
            .where(eq(users.teamId, myTeamId))
         totalMembers = res[0].count
      }

      // Who's Off Today
      const absentToday = await db.query.workRequests.findMany({
        where: and(
          eq(workRequests.status, 'APPROVED'),
          or(eq(workRequests.type, 'LEAVE'), eq(workRequests.type, 'WFH')),
          lte(workRequests.startDate, todayEnd),
          gte(workRequests.endDate, todayStart)
        ),
        with: {
            user: { with: { profile: true } }
        },
        limit: 10
      })

      // DB side filtering for team isolation
      let filteredAbsent = absentToday
      if (role !== 'ADMIN' && myTeamId) {
        filteredAbsent = absentToday.filter(req => req.user.teamId === myTeamId)
      }

      const pendingApprovals = await db.query.workRequests.findMany({
        where: eq(workRequests.status, 'PENDING'),
        with: { user: { with: { profile: true } } },
        limit: 5,
        orderBy: [desc(workRequests.createdAt)]
      })
      
      let filteredPending = pendingApprovals
      if (role !== 'ADMIN' && myTeamId) {
          filteredPending = pendingApprovals.filter(req => req.user.teamId === myTeamId)
      }

      teamStats = {
        totalMembers,
        absentToday: filteredAbsent,
        pendingApprovalsCount: filteredPending.length, 
        pendingApprovals: filteredPending
      }
    }
  }

  return {
    user: {
        id: user.id,
        fullName: user.profile?.fullName || user.email,
        avatar: user.profile?.avatarUrl
    },
    role,
    stats: {
      leaveTakenMonth: leaveRequestsMonth[0].count,
      wfhTakenMonth: wfhRequestsMonth[0].count,
      totalSkills: totalSkills[0].count,
    },
    todayStatus,
    pendingMyRequests: pendingRequests,
    upcomingHolidays: holidays,
    teamStats,
  }
}
