/**
 * CV Server API
 * Uses dynamic imports to prevent code leakage.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// --- Schemas ---
const getCVDataSchema = z.object({
  token: z.string(),
  userId: z.number().optional(),
})

const updateSummarySchema = z.object({
  token: z.string(),
  summary: z.string().max(500), // Limit summary length
})

// --- Server Functions ---

export const getCVDataFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => getCVDataSchema.parse(data))
  .handler(async (ctx) => {
    const { getCVDataImpl } = await import('./cv.impl')
    return getCVDataImpl(ctx.data)
  })

export const updateProfileSummaryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateSummarySchema.parse(data))
  .handler(async (ctx) => {
    const { updateProfileSummaryImpl } = await import('./cv.impl')
    return updateProfileSummaryImpl(ctx.data)
  })
