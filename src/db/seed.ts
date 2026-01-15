import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { profiles, roles, teams, users } from './schema'
import { client, db } from './index'

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

    // 3. Email Templates
    console.log('Checking email templates...')
    const { emailTemplates } = await import('./schema')

    // 3a. Welcome New User Template
    const welcomeTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'WELCOME_NEW_USER'),
    })

    if (!welcomeTemplate) {
      console.log('Creating WELCOME_NEW_USER template...')
      await db.insert(emailTemplates).values({
        code: 'WELCOME_NEW_USER',
        name: 'Welcome New User',
        subject: 'Welcome to HRM System - Activate Your Account',
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to HRM System!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{fullName}</strong>,</p>
      <p>Your account has been created successfully. Please activate your account by clicking the button below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{verificationLink}" class="button">Activate Account</a>
      </p>
      <p>Your email: <strong>{email}</strong></p>
      <p>If you didn't expect this email, please contact your administrator.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Tech House HRM System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify({
          fullName: "User's full name",
          email: "User's email address",
          verificationLink: 'Account activation link',
        }),
        isSystem: true,
      })
      console.log('✅ WELCOME_NEW_USER template created')
    } else {
      console.log('WELCOME_NEW_USER template already exists.')
    }

    // 3b. Password Reset Template
    const resetTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'PASSWORD_RESET'),
    })

    if (!resetTemplate) {
      console.log('Creating PASSWORD_RESET template...')
      await db.insert(emailTemplates).values({
        code: 'PASSWORD_RESET',
        name: 'Password Reset Request',
        subject: 'Reset Your Password - HRM System',
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{fullName}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{resetLink}" class="button">Reset Password</a>
      </p>
      <p>If you didn't request a password reset, please ignore this email or contact your administrator if you have concerns.</p>
      <p><strong>This link will expire in 24 hours.</strong></p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Tech House HRM System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify({
          fullName: "User's full name",
          resetLink: 'Password reset link',
        }),
        isSystem: true,
      })
      console.log('✅ PASSWORD_RESET template created')
    } else {
      console.log('PASSWORD_RESET template already exists.')
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
