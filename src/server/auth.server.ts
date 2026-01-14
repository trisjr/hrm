import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { comparePassword, signToken } from '../lib/auth.utils'
import { type LoginInput, loginSchema } from '../lib/auth.schemas'

// @tanstack/start might abstract cookie setting differently, but standard response is fine.

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }: { data: LoginInput }) => {
    const { email, password } = data

    console.log('TJ - auth.server.ts - line 15', { email, password })

    // 1. Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        profile: true,
      },
    })

    console.log('TJ - auth.server.ts - line 25', { user })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // 2. Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error(`Account is ${user.status}. Please contact support.`)
    }

    // 3. Verify password
    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // 4. Create session object
    const userSession = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      teamId: user.teamId,
      careerBandId: user.careerBandId,
      status: user.status!,
      fullName: user.profile?.fullName,
      avatarUrl: user.profile?.avatarUrl,
    }

    // 5. Sign token
    const token = signToken(userSession)

    // Optional: Set cookie if needed for SSR context
    // setCookie("auth-token", token, { httpOnly: true, secure: true, sameSite: 'lax' })

    // 6. Return response
    return {
      user: userSession,
      token,
    }
  })
