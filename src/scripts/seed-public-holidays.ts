/**
 * Seed Public Holidays for Vietnam 2026
 * Run: npx tsx src/scripts/seed-public-holidays.ts
 */
import { db } from '@/db'
import { publicHolidays } from '@/db/schema'

async function seedPublicHolidays() {
  console.log('🎉 Seeding public holidays for Vietnam 2026...')

  const holidays = [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-28', name: 'Tết Holiday (Day 1)' },
    { date: '2026-01-29', name: 'Tết Holiday (Day 2)' },
    { date: '2026-01-30', name: 'Tết Holiday (Day 3)' },
    { date: '2026-01-31', name: 'Tết Holiday (Day 4)' },
    { date: '2026-02-01', name: 'Tết Holiday (Day 5)' },
    { date: '2026-04-02', name: 'Hung Kings Festival' },
    { date: '2026-04-30', name: 'Reunification Day' },
    { date: '2026-05-01', name: 'International Labor Day' },
    { date: '2026-09-02', name: 'National Day' },
  ]

  try {
    // Check if already seeded
    const existing = await db.query.publicHolidays.findFirst()
    if (existing) {
      console.log('⚠️  Public holidays already seeded. Skipping...')
      return
    }

    // Insert holidays
    await db.insert(publicHolidays).values(
      holidays.map((h) => ({
        ...h,
        country: 'VN',
        isRecurring: false,
      })),
    )

    console.log(`✅ Successfully seeded ${holidays.length} public holidays!`)
  } catch (error) {
    console.error('❌ Error seeding public holidays:', error)
    throw error
  }
}

seedPublicHolidays()
  .then(() => {
    console.log('🎊 Seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
