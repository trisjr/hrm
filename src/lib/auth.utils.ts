import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserSession } from '../types/auth.types.ts'

// --- Constants ---
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.AUTH_SECRET ||
  'dev_secret_key_change_me'
const JWT_EXPIRES_IN = '7D'

// --- Helpers ---

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

/**
 * Sign a JWT token with the user session payload
 */
export function signToken(user: UserSession): string {
  return jwt.sign(
    {
      sub: user.id,
      ...user,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    // Map back to UserSession if needed, or just return decoded
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      roleId: decoded.roleId,
      teamId: decoded.teamId,
      careerBandId: decoded.careerBandId,
      status: decoded.status,
      fullName: decoded.fullName,
      avatarUrl: decoded.avatarUrl,
    }
  } catch (error) {
    return null
  }
}
