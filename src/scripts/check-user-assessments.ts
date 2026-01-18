import { db } from '@/db'
import { users, userAssessments } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function check() {
    // User from screenshot: front_dev@gmail.com
    // Hoặc thử query user đầu tiên có assessments
    const email = 'front_dev@gmail.com' 
    console.log(`Checking assessments for user: ${email}`)

    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    })
    
    if (!user) {
        console.log('User not found:', email)
        // Try fallback to find any user with assessment
        const anyAss = await db.query.userAssessments.findFirst()
        if (anyAss) {
            console.log('Found an assessment belonging to user ID:', anyAss.userId)
        } else {
             console.log('No assessments found in DB at all.')
        }
        return
    }
    
    console.log('User found:', user.id, user.email)
    
    const assessments = await db.query.userAssessments.findMany({
        where: eq(userAssessments.userId, user.id),
        with: { cycle: true }
    })
    
    console.log('Assessments found in DB:', assessments.length)
    if (assessments.length > 0) {
        console.log('Assessment Details:')
        assessments.forEach(a => {
            console.log(`- ID: ${a.id}, Status: ${a.status}, Cycle: ${a.cycle?.name}`)
        })
    } else {
        console.log('Possible reason: User ID mismatch or verifyUser returning wrong user.')
    }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
