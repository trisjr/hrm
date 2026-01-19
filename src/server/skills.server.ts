/**
 * Skills Server API
 * Uses dynamic imports to prevent code leakage.
 */
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// --- Schemas ---
const searchSchema = z.object({
  token: z.string(),
  query: z.string().optional(),
  type: z.enum(['HARD_SKILL', 'SOFT_SKILL']).optional(),
})

const getUserSkillsSchema = z.object({
  token: z.string(),
  userId: z.number().optional(),
})

const upsertSkillSchema = z.object({
  token: z.string(),
  skillId: z.number(),
  levelId: z.number(),
  note: z.string().optional(),
})

const deleteSkillSchema = z.object({
  token: z.string(),
  id: z.number(),
})

// --- Server Functions ---

export const searchMasterSkillsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(async (ctx) => {
    const { searchMasterSkillsImpl } = await import('./skills.impl')
    return searchMasterSkillsImpl(ctx.data)
  })

export const getUserSkillsFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => getUserSkillsSchema.parse(data))
  .handler(async (ctx) => {
    const { getUserSkillsImpl } = await import('./skills.impl')
    return getUserSkillsImpl(ctx.data)
  })

export const upsertUserSkillFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => upsertSkillSchema.parse(data))
  .handler(async (ctx) => {
    const { upsertUserSkillImpl } = await import('./skills.impl')
    return upsertUserSkillImpl(ctx.data)
  })

export const deleteUserSkillFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => deleteSkillSchema.parse(data))
  .handler(async (ctx) => {
    const { deleteUserSkillImpl } = await import('./skills.impl')
    return deleteUserSkillImpl(ctx.data)
  })
