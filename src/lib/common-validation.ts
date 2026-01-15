import { z } from 'zod';

export const passwordPolicy = {
  minLength: 8,
  maxLength: 100,
  hasUpperCase: true,
  hasLowerCase: true,
  hasNumber: true,
  hasSpecialChar: true,
};

export const passwordSchema = z
  .string()
  .min(passwordPolicy.minLength, `Password must be at least ${passwordPolicy.minLength} characters`)
  .max(passwordPolicy.maxLength, `Password must be at most ${passwordPolicy.maxLength} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
