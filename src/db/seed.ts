import { client, db } from './index'
import { profiles, roles, teams, users } from './schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Starting seed...')

  try {
    // 1. Roles
    console.log('Checking roles...')
    const existingRoles = await db.select().from(roles)
    let adminRole = existingRoles.find((r) => r.roleName === 'ADMIN')

    if (existingRoles.length === 0) {
      console.log('Inserting roles...')
      const roleData = [
        {
          roleName: 'ADMIN',
          description: 'System Administrator with full access',
        },
        { roleName: 'HR', description: 'Human Resources Manager' },
        { roleName: 'LEADER', description: 'Team Leader' },
        { roleName: 'DEV', description: 'Developer' },
      ]
      await db.insert(roles).values(roleData)

      // Fetch again to get IDs
      const newRoles = await db.select().from(roles)
      adminRole = newRoles.find((r) => r.roleName === 'ADMIN')
    } else {
      console.log('Roles already exist. Skipping role creation.')
    }

    if (!adminRole) {
      throw new Error('ADMIN role could not be found or created.')
    }

    // 2. Admin User
    console.log('Checking admin user...')
    // We check by employeeCode or email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@techhouse.com'),
    })

    if (!existingUser) {
      console.log('Creating Admin Team & User...')

      // 2a. Create Team for Admin
      const [adminTeam] = await db
        .insert(teams)
        .values({
          teamName: 'Board of Directors',
          description: 'Executive Management Team',
        })
        .returning()

      // 2b. Create Admin User
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123'
      const hashedPassword = await bcrypt.hash(adminPassword, 10)

      const [newUser] = await db
        .insert(users)
        .values({
          employeeCode: 'ADM001',
          email: 'admin@techhouse.com',
          phone: '0123456789',
          passwordHash: hashedPassword,
          roleId: adminRole.id,
          teamId: adminTeam.id,
          status: 'ACTIVE',
        })
        .returning()

      // 2c. Update Team with Leader
      await db
        .update(teams)
        .set({ leaderId: newUser.id })
        .where(eq(teams.id, adminTeam.id))

      // 2d. Create Profile
      await db.insert(profiles).values({
        userId: newUser.id,
        fullName: 'System Administrator',
        joinDate: new Date().toISOString(),
        gender: 'Other',
        address: 'Headquarters',
      })

      console.log('✅ Admin user created: admin@techhouse.com')
    } else {
      console.log('Admin user already exists.')
    }

    console.log('✅ Seed completed successfully')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
