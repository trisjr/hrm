/**
 * Email Log Server Functions
 * Handle queries for Email Logs (read-only)
 */
import { createServerFn } from '@tanstack/react-start'
import { and, between, desc, eq, isNull, sql } from 'drizzle-orm'
import type { ListEmailLogsParams } from '@/lib/email-log.schemas'
import { listEmailLogsParamsSchema } from '@/lib/email-log.schemas'
import { db } from '@/db'
import { emailLogs } from '@/db/schema'

/**
 * List Email Logs
 * Get paginated list of email logs with optional filters
 */
export const listEmailLogsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const params = data as Record<string, unknown>
    return listEmailLogsParamsSchema.parse({
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 10,
      status: params.status as 'SENT' | 'FAILED' | 'QUEUED' | undefined,
      startDate: params.startDate
        ? new Date(params.startDate as string)
        : undefined,
      endDate: params.endDate ? new Date(params.endDate as string) : undefined,
    })
  })
  .handler(async ({ data }: { data: ListEmailLogsParams }) => {
    const { page = 1, limit = 10, status, startDate, endDate } = data

    // Build where conditions
    const whereConditions = [isNull(emailLogs.deletedAt)]

    if (status) {
      whereConditions.push(eq(emailLogs.status, status))
    }

    if (startDate && endDate) {
      whereConditions.push(between(emailLogs.createdAt, startDate, endDate))
    } else if (startDate) {
      whereConditions.push(sql`${emailLogs.createdAt} >= ${startDate}`)
    } else if (endDate) {
      whereConditions.push(sql`${emailLogs.createdAt} <= ${endDate}`)
    }

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(and(...whereConditions))

    // Fetch logs with relations
    const logs = await db.query.emailLogs.findMany({
      where: and(...whereConditions),
      with: {
        template: {
          columns: {
            id: true,
            code: true,
            name: true,
          },
        },
        sender: {
          columns: {
            id: true,
            employeeCode: true,
          },
          with: {
            profile: {
              columns: {
                fullName: true,
              },
            },
          },
        },
      },
      limit,
      offset: (page - 1) * limit,
      orderBy: [desc(emailLogs.sentAt), desc(emailLogs.createdAt)],
    })

    return {
      logs,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    }
  })

/**
 * Get Email Log by ID
 * Fetch single log with full details
 */
export const getEmailLogByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const { id } = data as { id: string }
    return { id: Number(id) }
  })
  .handler(async ({ data }: { data: { id: number } }) => {
    const log = await db.query.emailLogs.findFirst({
      where: and(eq(emailLogs.id, data.id), isNull(emailLogs.deletedAt)),
      with: {
        template: {
          columns: {
            id: true,
            code: true,
            name: true,
          },
        },
        sender: {
          columns: {
            id: true,
            employeeCode: true,
          },
          with: {
            profile: {
              columns: {
                fullName: true,
              },
            },
          },
        },
      },
    })

    if (!log) {
      throw new Error('Email log not found')
    }

    return { log }
  })
