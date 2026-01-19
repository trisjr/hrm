/**
 * Dashboard Server API
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// Schema
const dashboardStatsSchema = z.object({
  token: z.string(),
})

// Server Function
export const getDashboardStatsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => dashboardStatsSchema.parse(data))
  .handler(async (ctx) => {
    const { getDashboardStatsImpl } = await import('./dashboard.impl')
    return getDashboardStatsImpl(ctx.data)
  })
