import { eq, and } from 'drizzle-orm'
import {
  users,
  careerBands,
  competencyRequirements,
  userAssessments,
  userAssessmentDetails,
  assessmentCycles,
  teams,
  roles,
} from './schema'
import { client, db } from './index'
import bcrypt from 'bcryptjs'

async function seedAssessment() {
  console.log('🌱 Starting Assessment Seed...')

  try {
    // 1. Get/Create Assessment Cycle (Active)
    console.log('Checking active cycle...')
    const activeCycle = await db.query.assessmentCycles.findFirst({
      where: eq(assessmentCycles.status, 'ACTIVE'),
    })

    if (!activeCycle) {
      console.log('No active cycle found. Please run main seed first.')
      process.exit(1)
    }

    // 2. Get/Create User (Dev)
    console.log('Checking Dev User...')
    let devUser = await db.query.users.findFirst({
      where: eq(users.email, 'dev@techhouse.com'),
      with: { role: true },
    })

    if (!devUser) {
        console.log('Creating Dev User...')
        const devRole = await db.query.roles.findFirst({ where: eq(roles.roleName, 'DEV') })
        if (!devRole) throw new Error('DEV role not found')

        // Get admin team
        const adminTeam = await db.query.teams.findFirst()
        if (!adminTeam) throw new Error('No team found')

        const passwordHash = await bcrypt.hash('123456', 10)
        
        const [newUser] = await db.insert(users).values({
            email: 'dev@techhouse.com',
            employeeCode: 'DEV001',
            passwordHash,
            roleId: devRole.id,
            teamId: adminTeam.id,
            status: 'ACTIVE',
        }).returning()
        
        devUser = await db.query.users.findFirst({ where: eq(users.id, newUser.id), with: { role: true } })
    }

    // 3. Assign Career Band (if not assigned)
    console.log('Assigning Career Band...')
    if (!devUser?.careerBandId) {
       const seniorBand = await db.query.careerBands.findFirst({
         where: eq(careerBands.title, 'Senior')
       })

       if (seniorBand) {
         await db.update(users)
           .set({ careerBandId: seniorBand.id })
           .where(eq(users.id, devUser!.id))
         console.log('Assigned Senior Band to Dev User')
         devUser!.careerBandId = seniorBand.id
       } else {
         throw new Error('Senior band not found')
       }
    }

    // 4. Create User Assessment
    console.log('Creating User Assessment...')
    const existingAssessment = await db.query.userAssessments.findFirst({
        where: and(
            eq(userAssessments.userId, devUser!.id),
            eq(userAssessments.cycleId, activeCycle.id)
        )
    })

    if (!existingAssessment) {
        const [newAssessment] = await db.insert(userAssessments).values({
            userId: devUser!.id,
            cycleId: activeCycle.id,
            status: 'SELF_ASSESSING',
        }).returning()

        // 5. Create Assessment Details
        console.log('Creating Assessment Details...')
        const requirements = await db
            .select()
            .from(competencyRequirements)
            .where(eq(competencyRequirements.careerBandId, devUser!.careerBandId!))

        if (requirements.length > 0) {
            const detailsValues = requirements.map(req => ({
                userAssessmentId: newAssessment.id,
                competencyId: req.competencyId,
            }))
            await db.insert(userAssessmentDetails).values(detailsValues)
            console.log(`Created ${detailsValues.length} assessment details`)
        } else {
            console.log('No requirements found for this band!')
        }
    } else {
        console.log('Assessment already exists.')
    }

    console.log('✅ Assessment Seed Completed!')
    console.log('User: dev@techhouse.com / 123456')

  } catch (error) {
    console.error('❌ Seed failed:', error)
  } finally {
    await client.end()
  }
}

seedAssessment()
