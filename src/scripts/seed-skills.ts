
import { db } from '../db'
import { masterSkills, skillLevels, skillCriteria } from '../db/schema'
import { eq } from 'drizzle-orm'

// Define standard levels that will be applied to ALL skills
const STANDARD_LEVELS = [
  { name: 'Beginner', order: 1, criteria: 'Basic conceptual understanding. Needs supervision.' },
  { name: 'Intermediate', order: 2, criteria: 'Can perform tasks independently. Understands core principles.' },
  { name: 'Advanced', order: 3, criteria: 'Deep understanding. Can mentor others. Solves complex problems.' },
  { name: 'Expert', order: 4, criteria: 'Recognized authority. Defines standards. Innovates.' },
  { name: 'Master', order: 5, criteria: 'Top-tier industry level. Sets strategic direction.' },
]

// Define master skills
const SEED_SKILLS = [
  // HARD SKILLS - Tech
  { name: 'React.js', type: 'HARD_SKILL', category: 'Frontend Development' },
  { name: 'TypeScript', type: 'HARD_SKILL', category: 'Programming Language' },
  { name: 'Node.js', type: 'HARD_SKILL', category: 'Backend Development' },
  { name: 'PostgreSQL', type: 'HARD_SKILL', category: 'Database' },
  { name: 'Docker', type: 'HARD_SKILL', category: 'DevOps' },
  { name: 'GraphQL', type: 'HARD_SKILL', category: 'API' },
  { name: 'Tailwind CSS', type: 'HARD_SKILL', category: 'Frontend Development' },
  { name: 'Next.js', type: 'HARD_SKILL', category: 'Frontend Development' },
  { name: 'NestJS', type: 'HARD_SKILL', category: 'Backend Development' },
  { name: 'Python', type: 'HARD_SKILL', category: 'Programming Language' },
  
  // SOFT SKILLS - General
  { name: 'Communication', type: 'SOFT_SKILL', category: 'Interpersonal' },
  { name: 'Teamwork', type: 'SOFT_SKILL', category: 'Interpersonal' },
  { name: 'Problem Solving', type: 'SOFT_SKILL', category: 'Cognitive' },
  { name: 'Leadership', type: 'SOFT_SKILL', category: 'Management' },
  { name: 'Time Management', type: 'SOFT_SKILL', category: 'Self Management' },
  { name: 'Adaptability', type: 'SOFT_SKILL', category: 'Self Management' },
  { name: 'Critical Thinking', type: 'SOFT_SKILL', category: 'Cognitive' },
  { name: 'Mentoring', type: 'SOFT_SKILL', category: 'Management' },
  { name: 'Presentation', type: 'SOFT_SKILL', category: 'Communication' },
  { name: 'English', type: 'SOFT_SKILL', category: 'Language' },
] as const

async function seedSkills() {
  console.log('🌱 Seeding Skills and Levels...')

  for (const skillData of SEED_SKILLS) {
    // 1. Check if skill exists
    const existingSkill = await db.query.masterSkills.findFirst({
      where: eq(masterSkills.name, skillData.name),
    })

    let skillId = existingSkill?.id

    if (!existingSkill) {
      // 2. Insert Skill
      const [newSkill] = await db.insert(masterSkills).values(skillData).returning()
      skillId = newSkill.id
      console.log(`+ Added Skill: ${skillData.name}`)

      // 3. Insert Levels for this skill
      for (const level of STANDARD_LEVELS) {
        const [newLevel] = await db.insert(skillLevels).values({
          skillId: skillId,
          name: level.name,
          levelOrder: level.order,
        }).returning()

        // 4. Insert Criteria (Optional but good for completeness)
        await db.insert(skillCriteria).values({
          levelId: newLevel.id,
          content: level.criteria,
        })
      }
    } else {
      console.log(`= Skipped Skill (Exists): ${skillData.name}`)
    }
  }

  console.log('✅ Skills Seeding Completed!')
}

seedSkills().catch((err) => {
  console.error('❌ Seeding Failed:', err)
  process.exit(1)
})
