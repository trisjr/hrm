/**
 * Email Template Validation Schemas
 * Using Zod for input data validation
 */
import { z } from 'zod'

// Create Email Template Schema
export const createEmailTemplateSchema = z.object({
  code: z
    .string()
    .min(1, 'Template code is required')
    .max(100, 'Template code must not exceed 100 characters')
    .regex(
      /^[A-Z_]+$/,
      'Template code must contain only uppercase letters and underscores',
    ),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(200, 'Template name must not exceed 200 characters'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(255, 'Subject must not exceed 255 characters'),
  body: z.string().min(1, 'Email body is required'),
  variables: z.string().optional(), // JSON string describing placeholders
  isSystem: z.boolean(),
})

// Update Email Template Schema (code and isSystem are immutable)
export const updateEmailTemplateSchema = createEmailTemplateSchema

// List Email Templates Params Schema
export const listEmailTemplatesParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  isSystem: z.boolean().optional(), // Filter by System/Custom
})

// Send Email from Template Schema
export const sendEmailSchema = z.object({
  templateId: z.number().int().positive('Template ID is required'),
  recipientEmail: z.string().email('Invalid recipient email address'),
  placeholderValues: z.record(z.string()), // Dynamic object with placeholder values
})

// Email Template Response Schema
export const emailTemplateResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  variables: z.string().nullable(),
  isSystem: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
})

// Type exports
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>
export type ListEmailTemplatesParams = z.infer<
  typeof listEmailTemplatesParamsSchema
>
export type SendEmailInput = z.infer<typeof sendEmailSchema>
export type EmailTemplateResponse = z.infer<typeof emailTemplateResponseSchema>
