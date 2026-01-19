/**
 * Seed Sample Timesheet Requests for Testing
 * Run: npx tsx src/scripts/seed-timesheet-requests.ts
 */
import { db } from '@/db'
import { workRequests, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function seedTimesheetRequests() {
  console.log('📅 Seeding sample timesheet requests...')

  try {
    // Find a test user (front_dev or first user)
    const testUser = await db.query.users.findFirst({
      where: eq(users.email, 'front_dev@gmail.com'),
    })

    if (!testUser) {
      console.log('⚠️  No test user found. Please create a user first.')
      return
    }

    const sampleRequests = [
      {
        userId: testUser.id,
        type: 'WFH' as const,
        startDate: new Date('2026-01-20'),
        endDate: new Date('2026-01-20'),
        reason: 'Working from home - Focus day',
        status: 'APPROVED' as const,
        approvedBy: testUser.id,
        approvedAt: new Date().toISOString(),
      },
      {
        userId: testUser.id,
        type: 'LEAVE' as const,
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-01-17'),
        reason: 'Family vacation',
        status: 'APPROVED' as const,
        approvedBy: testUser.id,
        approvedAt: new Date().toISOString(),
      },
      {
        userId: testUser.id,
        type: 'WFH' as const,
        startDate: new Date('2026-01-22'),
        endDate: new Date('2026-01-22'),
        reason: 'Remote work',
        status: 'APPROVED' as const,
        approvedBy: testUser.id,
        approvedAt: new Date().toISOString(),
      },
    ]

    await db.insert(workRequests).values(sampleRequests)

    console.log(`✅ Successfully seeded ${sampleRequests.length} sample requests!`)
    console.log(`   User: ${testUser.email}`)
  } catch (error) {
    console.error('❌ Error seeding requests:', error)
    throw error
  }
}

seedTimesheetRequests()
  .then(() => {
    console.log('🎊 Seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
