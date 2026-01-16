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

    // 3c. Team Member Added Template
    const teamMemberAddedTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'TEAM_MEMBER_ADDED'),
    })

    if (!teamMemberAddedTemplate) {
      console.log('Creating TEAM_MEMBER_ADDED template...')
      await db.insert(emailTemplates).values({
        code: 'TEAM_MEMBER_ADDED',
        name: 'Team Member Added',
        subject: 'You have been added to {teamName}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to the Team!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{fullName}</strong>,</p>
      <p>You have been added to the team <strong>{teamName}</strong>.</p>
      <p>We are excited to have you on board!</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{teamLink}" class="button">View Team</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Tech House HRM System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify({
          fullName: "User's full name",
          teamName: 'Name of the team',
          teamLink: 'Link to team details',
        }),
        isSystem: true,
      })
      console.log('✅ TEAM_MEMBER_ADDED template created')
    } else {
      console.log('TEAM_MEMBER_ADDED template already exists.')
    }

    // 3d. Team Member Removed Template
    const teamMemberRemovedTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'TEAM_MEMBER_REMOVED'),
    })

    if (!teamMemberRemovedTemplate) {
      console.log('Creating TEAM_MEMBER_REMOVED template...')
      await db.insert(emailTemplates).values({
        code: 'TEAM_MEMBER_REMOVED',
        name: 'Team Member Removed',
        subject: 'You have been removed from {teamName}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6B7280; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Team Membership Update</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{fullName}</strong>,</p>
      <p>You have been removed from the team <strong>{teamName}</strong>.</p>
      <p>If you believe this is a mistake, please contact your Hello HR.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Tech House HRM System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify({
          fullName: "User's full name",
          teamName: 'Name of the team',
        }),
        isSystem: true,
      })
      console.log('✅ TEAM_MEMBER_REMOVED template created')
    } else {
      console.log('TEAM_MEMBER_REMOVED template already exists.')
    }

    // 3e. Team Leader Assigned Template
    const teamLeaderAssignedTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'TEAM_LEADER_ASSIGNED'),
    })

    if (!teamLeaderAssignedTemplate) {
      console.log('Creating TEAM_LEADER_ASSIGNED template...')
      await db.insert(emailTemplates).values({
        code: 'TEAM_LEADER_ASSIGNED',
        name: 'Team Leader Assigned',
        subject: 'You represent the {teamName} team',
        body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Congratulations!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{fullName}</strong>,</p>
      <p>You have been assigned as the <strong>Leader</strong> of the team <strong>{teamName}</strong>.</p>
      <p>Lead your team to success!</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{teamLink}" class="button">Manage Team</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Tech House HRM System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify({
          fullName: "User's full name",
          teamName: 'Name of the team',
          teamLink: 'Link to team details',
        }),
        isSystem: true,
      })
      console.log('✅ TEAM_LEADER_ASSIGNED template created')
    } else {
      console.log('TEAM_LEADER_ASSIGNED template already exists.')
    }

    // 3f. Team Deleted Template
    const teamDeletedTemplate = await db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.code, 'TEAM_DELETED'),
    })

    if (!teamDeletedTemplate) {
      console.log('Creating TEAM_DELETED template...')
      await db.insert(emailTemplates).values({
        code: 'TEAM_DELETED',
        name: 'Team Deleted',
        subject: 'Team {teamName} has been disbanded',
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
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Team Disbanded</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{fullName}</strong>,</p>
      <p>The team <strong>{teamName}</strong> has been disbanded.</p>
      <p>You have been unassigned from this team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Tech House HRM System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify({
          fullName: "User's full name",
          teamName: 'Name of the team',
        }),
        isSystem: true,
      })
      console.log('✅ TEAM_DELETED template created')
    } else {
      console.log('TEAM_DELETED template already exists.')
    }

    // 3g. Competency Data Seeding
    console.log('Checking Competency Data...')
    const {
      careerBands,
      competencyGroups,
      competencies,
      competencyLevels,
      competencyRequirements,
      assessmentCycles,
    } = await import('./schema')

    // 1. Career Bands
    console.log('Seeding Career Bands...')
    const bandsToSeed = [
      { bandName: 'Band 1', title: 'Junior' },
      { bandName: 'Band 2', title: 'Middle' },
      { bandName: 'Band 3', title: 'Senior' },
      { bandName: 'Band 4', title: 'Lead' },
      { bandName: 'Band 5', title: 'Principal' },
    ]
    const existingBands = await db.select().from(careerBands)
    const existingTitles = existingBands.map((b) => b.title)

    for (const band of bandsToSeed) {
      if (!existingTitles.includes(band.title)) {
        await db.insert(careerBands).values({
          bandName: band.bandName,
          title: band.title,
          description: `${band.title} Level Career Band (${band.bandName})`,
        })
      }
    }

    // 2. Competency Groups
    console.log('Seeding Competency Groups...')
    let techGroup = await db.query.competencyGroups.findFirst({
      where: eq(competencyGroups.name, 'Technical Skills'),
    })
    if (!techGroup) {
      const [newGroup] = await db
        .insert(competencyGroups)
        .values({
          name: 'Technical Skills',
          description: 'Technical proficiencies required for engineering roles',
        })
        .returning()
      techGroup = newGroup
    }

    let softGroup = await db.query.competencyGroups.findFirst({
      where: eq(competencyGroups.name, 'Soft Skills'),
    })
    if (!softGroup) {
      const [newGroup] = await db
        .insert(competencyGroups)
        .values({
          name: 'Soft Skills',
          description: 'Interpersonal and behavioral skills',
        })
        .returning()
      softGroup = newGroup
    }

    // 3. Competencies & Levels
    console.log('Seeding Competencies...')
    const compData = [
      {
        name: 'React.js',
        group: techGroup,
        levels: [
          'Knows basic components',
          'Can build simple apps',
          'Understands hooks & context',
          'Optimizes performance',
          'Architects libraries',
        ],
      },
      {
        name: 'Node.js',
        group: techGroup,
        levels: [
          'Basic HTTP server',
          'Express/NestJS APIs',
          'DB Integration & Auth',
          'Scalable Microservices',
          'Core Node contribution',
        ],
      },
      {
        name: 'Communication',
        group: softGroup,
        levels: [
          'Listens actively',
          'Expresses ideas clearly',
          'Persuades effectively',
          'Negotiates conflicts',
          'Inspires organization',
        ],
      },
      {
        name: 'Teamwork',
        group: softGroup,
        levels: [
          'Participates in meetings',
          'Supports team members',
          'Fosters collaboration',
          'Builds team culture',
          'Cross-departmental synergy',
        ],
      },
      {
        name: 'Problem Solving',
        group: techGroup,
        levels: [
          'Solves simple bugs',
          'Debugs complex issues',
          'Root cause analysis',
          'Proactive prevention',
          'Strategic innovation',
        ],
      },
    ]

    for (const comp of compData) {
      if (!comp.group) continue // Skip if group creation failed

      const existingComp = await db.query.competencies.findFirst({
        where: eq(competencies.name, comp.name),
      })

      if (!existingComp) {
        const [newComp] = await db
          .insert(competencies)
          .values({
            name: comp.name,
            groupId: comp.group.id,
            description: `Competency for ${comp.name}`,
          })
          .returning()

        // Create levels
        const levelsValues = comp.levels.map((desc, index) => ({
          competencyId: newComp.id,
          levelNumber: index + 1,
          behavioralIndicator: desc,
        }))
        await db.insert(competencyLevels).values(levelsValues)
      }
    }

    // 4. Requirements Matrix
    console.log('Seeding Requirements Matrix...')
    // Get fresh data
    const allBands = await db.select().from(careerBands)
    const allComps = await db.select().from(competencies)
    const allReqs = await db.select().from(competencyRequirements)

    if (allReqs.length === 0 && allBands.length > 0 && allComps.length > 0) {
      const juniorBand = allBands.find((b) => b.title === 'Junior')
      const middleBand = allBands.find((b) => b.title === 'Middle')
      const seniorBand = allBands.find((b) => b.title === 'Senior')
      const role = await db.query.roles.findFirst()

      const reqValues: {
        careerBandId: number
        competencyId: number
        requiredLevel: number
        roleId: number
      }[] = []

      // Junior Requirements
      if (juniorBand && role) {
        allComps.forEach((comp) => {
          reqValues.push({
            careerBandId: juniorBand.id,
            competencyId: comp.id,
            requiredLevel: 2,
            roleId: role.id,
          })
        })
      }

      // Middle Requirements
      if (middleBand && role) {
        allComps.forEach((comp) => {
          reqValues.push({
            careerBandId: middleBand.id,
            competencyId: comp.id,
            requiredLevel: 3,
            roleId: role.id,
          })
        })
      }

      // Senior Requirements
      if (seniorBand && role) {
        allComps.forEach((comp) => {
          reqValues.push({
            careerBandId: seniorBand.id,
            competencyId: comp.id,
            requiredLevel: 4,
            roleId: role.id,
          })
        })
      }

      if (reqValues.length > 0) {
        await db.insert(competencyRequirements).values(reqValues)
      }
    }

    // 5. Assessment Cycles
    console.log('Seeding Assessment Cycles...')
    const existingCycles = await db.select().from(assessmentCycles)
    if (existingCycles.length === 0) {
      await db.insert(assessmentCycles).values([
        {
          name: 'Q3 2023 Performance Review',
          startDate: '2023-07-01',
          endDate: '2023-09-30',
          status: 'COMPLETED',
        },
        {
          name: 'Q4 2023 Performance Review',
          startDate: '2023-10-01',
          endDate: '2023-12-31',
          status: 'COMPLETED',
        },
        {
          name: 'Q1 2024 Performance Review',
          startDate: new Date().toISOString().split('T')[0], // Today
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
            .toISOString()
            .split('T')[0], // +3 months
          status: 'ACTIVE',
        },
      ])
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
