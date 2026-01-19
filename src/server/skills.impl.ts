
import { and, eq, ilike } from 'drizzle-orm'
import { db } from '@/db'
import {
  masterSkills,
  userSkills,
  users,
} from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'

// ==================== HELPER FUNCTIONS ====================

async function verifyUser(token: string) {
  const payload = verifyToken(token)
  if (!payload) throw new Error('Invalid token')
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.id),
    with: { role: true },
  })

  if (!user) throw new Error('User not found')
  return user
}

// ==================== EXPORTED FUNCTIONS ====================

/**
 * Search Master Skills
 */
export const searchMasterSkillsImpl = async (data: {
  token: string
  query?: string
  type?: 'HARD_SKILL' | 'SOFT_SKILL'
}) => {
  await verifyUser(data.token)

  let whereCondition = undefined
  
  if (data.query) {
    whereCondition = ilike(masterSkills.name, `%${data.query}%`)
  }

  if (data.type && whereCondition) {
    whereCondition = and(whereCondition, eq(masterSkills.type, data.type))
  } else if (data.type) {
    whereCondition = eq(masterSkills.type, data.type)
  }

  const skills = await db.query.masterSkills.findMany({
    where: whereCondition,
    limit: 50,
    with: {
      levels: {
        orderBy: (levels, { asc }) => [asc(levels.levelOrder)],
      },
    },
    orderBy: (skills, { asc }) => [asc(skills.name)],
  })

  return { success: true, data: skills }
}

/**
 * Get User Skills
 */
export const getUserSkillsImpl = async (data: {
  token: string
  userId?: number // specific user (optional)
}) => {
  const requester = await verifyUser(data.token)
  
  const targetUserId = data.userId || requester.id

  // Permission: Allow view if self, or Admin/HR/Leader
  if (targetUserId !== requester.id) {
    // Only allow if requester has role
    // TODO: Add strict role check if needed
  }

  const skills = await db.query.userSkills.findMany({
    where: eq(userSkills.userId, targetUserId),
    with: {
      skill: true,
      level: true, // Join to get level name (Beginner, Master...)
    },
    orderBy: (userSkills, { desc }) => [desc(userSkills.levelId)], // Sort by level usually makes sense
  })

  return { success: true, data: skills }
}

/**
 * Add or Update User Skill
 */
export const upsertUserSkillImpl = async (data: {
  token: string
  skillId: number
  levelId: number
  note?: string
}) => {
  const user = await verifyUser(data.token)

  // 1. Check if user already has this skill
  const existing = await db.query.userSkills.findFirst({
    where: and(
      eq(userSkills.userId, user.id),
      eq(userSkills.skillId, data.skillId),
    ),
  })

  if (existing) {
    // Update
    await db.update(userSkills)
      .set({
        levelId: data.levelId,
        note: data.note,
        updatedAt: new Date(),
      })
      .where(eq(userSkills.id, existing.id))
  } else {
    // Insert
    await db.insert(userSkills).values({
      userId: user.id,
      skillId: data.skillId,
      levelId: data.levelId,
      note: data.note,
      assessedAt: new Date().toISOString().split('T')[0],
    })
  }

  return { success: true, message: 'Skill updated successfully' }
}

/**
 * Delete User Skill
 */
export const deleteUserSkillImpl = async (data: {
  token: string
  id: number // user_skill id
}) => {
  const user = await verifyUser(data.token)

  // Verify ownership
  const existing = await db.query.userSkills.findFirst({
    where: eq(userSkills.id, data.id),
  })

  if (!existing) throw new Error('Skill not found')
  
  if (existing.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  await db.delete(userSkills).where(eq(userSkills.id, data.id))

  return { success: true, message: 'Skill removed successfully' }
}
