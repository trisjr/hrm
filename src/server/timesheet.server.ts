/**
 * Timesheet Server Wrappers
 * Uses dynamic imports to prevent server-side code leakage to client bundle.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Validations
const timesheetSchema = z.object({
  token: z.string(),
  params: z.object({
    userId: z.number().int().positive().optional(),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
  }),
})

const teamTimesheetSchema = z.object({
  token: z.string(),
  params: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
  }),
})

const holidaysSchema = z.object({
  year: z.number().int().min(2020).max(2100),
})

export const getTimesheetDataFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => timesheetSchema.parse(data))
  .handler(async (ctx) => {
    const { getTimesheetDataImpl } = await import('./timesheet.impl')
    return getTimesheetDataImpl(ctx.data)
  })

export const getTeamTimesheetFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => teamTimesheetSchema.parse(data))
  .handler(async (ctx) => {
    const { getTeamTimesheetImpl } = await import('./timesheet.impl')
    return getTeamTimesheetImpl(ctx.data)
  })

export const getPublicHolidaysFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => holidaysSchema.parse(data))
  .handler(async (ctx) => {
    const { getPublicHolidaysImpl } = await import('./timesheet.impl')
    return getPublicHolidaysImpl(ctx.data)
  })
