
import { db } from '@/db'
import { emailTemplates } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function seed() {
    console.log('Seeding assessment email templates...')
    const templates = [
        {
            code: 'ASSESSMENT_CYCLE_STARTED',
            name: 'Assessment Cycle Started',
            subject: 'Assessment Cycle {{cycleName}} Has Started',
            body: '<p>Dear {{fullName}},</p><p>The assessment cycle <strong>{{cycleName}}</strong> has officially started.</p><p>Please log in to the HRM portal and complete your self-assessment before <strong>{{endDate}}</strong>.</p><p><a href="{{link}}">Go to My Assessment</a></p><p>Best regards,<br>HR Team</p>',
            isSystem: true,
            variables: ['cycleName', 'fullName', 'endDate', 'link']
        },
        {
            code: 'ASSESSMENT_REMINDER',
            name: 'Assessment Reminder',
            subject: 'Reminder: Complete Your Assessment for {{cycleName}}',
            body: '<p>Dear {{fullName}},</p><p>This is a gentle reminder that you have pending assessments in <strong>{{cycleName}}</strong>.</p><p>Please complete them as soon as possible.</p><p><a href="{{link}}">Go to My Assessment</a></p><p>Best regards,<br>HR Team</p>',
            isSystem: true,
            variables: ['cycleName', 'fullName', 'link']
        }
    ]

    for (const t of templates) {
        const existing = await db.query.emailTemplates.findFirst({
            where: eq(emailTemplates.code, t.code)
        })
        if (!existing) {
            await db.insert(emailTemplates).values(t)
            console.log(`✅ Seeded template: ${t.code}`)
        } else {
            console.log(`ℹ️ Template existing: ${t.code}`)
        }
    }
    console.log('Done.')
}

seed().then(() => process.exit(0)).catch((e) => {
    console.error(e)
    process.exit(1)
})
