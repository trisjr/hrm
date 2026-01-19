/**
 * CV Data Aggregation Logic
 * Collects all necessary data for CV generation
 */
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import {
  users,
  profiles,
  userSkills,
  educationExperience,
  achievements,
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
 * Get CV Data - Aggregate all data needed for CV
 */
export const getCVDataImpl = async (data: {
  token: string
  userId?: number
}) => {
  const requester = await verifyUser(data.token)
  const targetUserId = data.userId || requester.id

  // Permission: Allow view if self, or Admin/HR
  if (targetUserId !== requester.id) {
    if (!['ADMIN', 'HR'].includes(requester.role?.roleName || '')) {
      throw new Error('Unauthorized')
    }
  }

  // 1. Get Profile
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, targetUserId),
  })

  if (!profile) {
    throw new Error('Profile not found. Please complete your profile first.')
  }

  // 2. Get Skills
  const skills = await db.query.userSkills.findMany({
    where: eq(userSkills.userId, targetUserId),
    with: {
      skill: true,
      level: true,
    },
    orderBy: (userSkills, { desc }) => [desc(userSkills.levelId)],
  })

  // 3. Get Education
  const education = await db.query.educationExperience.findMany({
    where: and(
      eq(educationExperience.userId, targetUserId),
      eq(educationExperience.type, 'Education'),
    ),
    orderBy: (educationExperience, { desc }) => [desc(educationExperience.startDate)],
  })

  // 4. Get Experience
  const experience = await db.query.educationExperience.findMany({
    where: and(
      eq(educationExperience.userId, targetUserId),
      eq(educationExperience.type, 'Experience'),
    ),
    orderBy: (educationExperience, { desc }) => [desc(educationExperience.startDate)],
  })

  // 5. Get Achievements
  const achievementsList = await db.query.achievements.findMany({
    where: eq(achievements.userId, targetUserId),
    orderBy: (achievements, { desc }) => [desc(achievements.issuedDate)],
  })

  return {
    success: true,
    data: {
      profile,
      skills,
      education,
      experience,
      achievements: achievementsList,
    },
  }
}

/**
 * Update Profile Summary
 */
export const updateProfileSummaryImpl = async (data: {
  token: string
  summary: string
}) => {
  const user = await verifyUser(data.token)

  await db.update(profiles)
    .set({
      summary: data.summary,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id))

  return { success: true, message: 'Summary updated successfully' }
}
