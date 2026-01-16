import { eq, and } from 'drizzle-orm'
import {
  users,
  userAssessments,
  userAssessmentDetails,
  competencyRequirements
} from './schema'
import { client, db } from './index'

async function finalizeAssessmentSeed() {
  console.log('🏁 Finalizing Assessment Seed...')

  try {
    const devUser = await db.query.users.findFirst({
        where: eq(users.email, 'dev@techhouse.com')
    })
    
    if (!devUser) throw new Error('Dev user not found')

    const assessment = await db.query.userAssessments.findFirst({
        where: eq(userAssessments.userId, devUser.id)
    })

    if (!assessment) throw new Error('Assessment not found')

    console.log(`Processing assessment ${assessment.id}...`)

    // Get details
    const details = await db.select().from(userAssessmentDetails).where(eq(userAssessmentDetails.userAssessmentId, assessment.id))

    // Update details with random scores
    for (const d of details) {
        // Get requirement
        const req = await db.query.competencyRequirements.findFirst({
            where: and(
                eq(competencyRequirements.competencyId, d.competencyId),
                eq(competencyRequirements.careerBandId, devUser.careerBandId!)
            )
        })
        const required = req ? req.requiredLevel : 3
        const finalScore = required > 1 ? required - 1 : required // Make some gaps
        
        await db.update(userAssessmentDetails).set({
            selfScore: finalScore,
            leaderScore: finalScore,
            finalScore: finalScore
        }).where(eq(userAssessmentDetails.id, d.id))
    }

    // Update assessment
    await db.update(userAssessments).set({
        status: 'DONE',
        finalScoreAvg: 2.5 // dummy
    }).where(eq(userAssessments.id, assessment.id))

    console.log('✅ Assessment Finalized!')

  } catch (error) {
    console.error('❌ Failed:', error)
  } finally {
    await client.end()
  }
}

finalizeAssessmentSeed()
