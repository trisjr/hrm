/**
 * Email Template Server Functions
 * Handle CRUD operations for Email Templates
 */
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type {
  CreateEmailTemplateInput,
  ListEmailTemplatesParams,
  SendEmailInput,
  UpdateEmailTemplateInput,
} from '@/lib/email-template.schemas'
import {
  createEmailTemplateSchema,
  listEmailTemplatesParamsSchema,
  sendEmailSchema,
  updateEmailTemplateSchema,
} from '@/lib/email-template.schemas'
import { db } from '@/db'
import { emailLogs, emailTemplates, users } from '@/db/schema'
import { verifyToken } from '@/lib/auth.utils'
import {
  replacePlaceholders,
  sendEmail,
  validatePlaceholders,
} from '@/lib/email.utils'

/**
 * List Email Templates
 * Get paginated list of email templates with optional System/Custom filter
 */
export const listEmailTemplatesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const params = data as Record<string, unknown>
    return listEmailTemplatesParamsSchema.parse({
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 10,
      isSystem: params.isSystem
        ? params.isSystem === 'true' || params.isSystem === true
        : undefined,
    })
  })
  .handler(async ({ data }: { data: ListEmailTemplatesParams }) => {
    const { page = 1, limit = 10, isSystem } = data

    // Build where conditions
    const whereConditions = [isNull(emailTemplates.deletedAt)]

    if (isSystem !== undefined) {
      whereConditions.push(eq(emailTemplates.isSystem, isSystem))
    }

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailTemplates)
      .where(and(...whereConditions))

    // Fetch templates
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(and(...whereConditions))
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(emailTemplates.createdAt))

    return {
      templates,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    }
  })

/**
 * Get Email Template by ID
 * Fetch single template details
 */
export const getEmailTemplateByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const { id } = data as { id: string }
    return { id: Number(id) }
  })
  .handler(async ({ data }: { data: { id: number } }) => {
    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, data.id),
        isNull(emailTemplates.deletedAt),
      ),
    })

    if (!template) {
      throw new Error('Email template not found')
    }

    return { template }
  })

/**
 * Create Email Template
 * Permission: Admin/HR only
 */
export const createEmailTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: createEmailTemplateSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: CreateEmailTemplateInput }
    }) => {
      const { token, data: templateData } = input

      // 0. Permission Check
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      // Get requester info
      const requester = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: { role: true },
      })

      if (!requester?.role) {
        throw new Error('Unauthorized: User role not found')
      }

      // Only Admin/HR can create templates
      if (
        requester.role.roleName !== 'ADMIN' &&
        requester.role.roleName !== 'HR'
      ) {
        throw new Error(
          'Permission denied: Only Admin or HR can create email templates',
        )
      }

      // Check code uniqueness
      const existingTemplate = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.code, templateData.code),
      })

      if (existingTemplate) {
        throw new Error('Template code already exists')
      }

      // Create template
      const [newTemplate] = await db
        .insert(emailTemplates)
        .values(templateData)
        .returning()

      return { template: newTemplate }
    },
  )

/**
 * Update Email Template
 * Permission: Admin/HR only
 * Cannot update code or isSystem
 */
export const updateEmailTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        id: z.number(),
        data: updateEmailTemplateSchema,
      })
      .parse({
        token: (data as any).token,
        id: Number((data as any).id),
        data: (data as any).data,
      })
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; id: number; data: UpdateEmailTemplateInput }
    }) => {
      const { token, id, data: updateData } = input

      // 0. Permission Check
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      const requester = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: { role: true },
      })

      if (!requester?.role) {
        throw new Error('Unauthorized: User role not found')
      }

      if (
        requester.role.roleName !== 'ADMIN' &&
        requester.role.roleName !== 'HR'
      ) {
        throw new Error(
          'Permission denied: Only Admin or HR can update email templates',
        )
      }

      // Check template exists
      const existingTemplate = await db.query.emailTemplates.findFirst({
        where: and(eq(emailTemplates.id, id), isNull(emailTemplates.deletedAt)),
      })

      if (!existingTemplate) {
        throw new Error('Email template not found')
      }

      // Update template
      const [updatedTemplate] = await db
        .update(emailTemplates)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, id))
        .returning()

      return { template: updatedTemplate }
    },
  )

/**
 * Delete Email Template
 * Permission: Admin/HR only
 * Business Rule: Only Custom templates (isSystem = false) can be deleted
 */
export const deleteEmailTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        id: z.number(),
      })
      .parse({
        token: (data as any).token,
        id: Number((data as any).id),
      })
  })
  .handler(async ({ data: input }: { data: { token: string; id: number } }) => {
    const { token, id } = input

    // 0. Permission Check
    const userSession = verifyToken(token)
    if (!userSession || !userSession.id) {
      throw new Error('Unauthorized: Invalid authentication token')
    }

    const requester = await db.query.users.findFirst({
      where: eq(users.id, userSession.id),
      with: { role: true },
    })

    if (!requester?.role) {
      throw new Error('Unauthorized: User role not found')
    }

    if (
      requester.role.roleName !== 'ADMIN' &&
      requester.role.roleName !== 'HR'
    ) {
      throw new Error(
        'Permission denied: Only Admin or HR can delete email templates',
      )
    }

    // Check template exists
    const existingTemplate = await db.query.emailTemplates.findFirst({
      where: and(eq(emailTemplates.id, id), isNull(emailTemplates.deletedAt)),
    })

    if (!existingTemplate) {
      throw new Error('Email template not found')
    }

    // Business Rule: Cannot delete System templates
    if (existingTemplate.isSystem) {
      throw new Error(
        'Cannot delete system email template. Only custom templates can be deleted.',
      )
    }

    // Soft delete
    await db
      .update(emailTemplates)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, id))

    return {
      success: true,
      message: 'Email template deleted successfully',
    }
  })

/**
 * Send Email from Template
 * Permission: Admin/HR only
 * Replaces placeholders and sends email, creates log entry
 */
export const sendEmailFromTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return z
      .object({
        token: z.string(),
        data: sendEmailSchema,
      })
      .parse(data)
  })
  .handler(
    async ({
      data: input,
    }: {
      data: { token: string; data: SendEmailInput }
    }) => {
      const { token, data: sendData } = input
      const { templateId, recipientEmail, placeholderValues } = sendData

      // 0. Permission Check
      const userSession = verifyToken(token)
      if (!userSession || !userSession.id) {
        throw new Error('Unauthorized: Invalid authentication token')
      }

      const requester = await db.query.users.findFirst({
        where: eq(users.id, userSession.id),
        with: { role: true },
      })

      if (!requester?.role) {
        throw new Error('Unauthorized: User role not found')
      }

      if (
        requester.role.roleName !== 'ADMIN' &&
        requester.role.roleName !== 'HR'
      ) {
        throw new Error('Permission denied: Only Admin or HR can send emails')
      }

      // 1. Fetch template
      const template = await db.query.emailTemplates.findFirst({
        where: and(
          eq(emailTemplates.id, templateId),
          isNull(emailTemplates.deletedAt),
        ),
      })

      if (!template) {
        throw new Error('Email template not found')
      }

      // 2. Validate placeholders
      const validation = validatePlaceholders(template.body, placeholderValues)
      if (!validation.valid) {
        throw new Error(
          `Missing required placeholders: ${validation.missing.join(', ')}`,
        )
      }

      // 3. Replace placeholders in subject and body
      const finalSubject = replacePlaceholders(
        template.subject,
        placeholderValues,
      )
      const finalBody = replacePlaceholders(template.body, placeholderValues)

      // 4. Send email
      const emailResult = await sendEmail(
        recipientEmail,
        finalSubject,
        finalBody,
      )

      // 5. Create log entry
      const [logEntry] = await db
        .insert(emailLogs)
        .values({
          templateId: template.id,
          senderId: requester.id,
          recipientEmail,
          subject: finalSubject,
          body: finalBody,
          status: emailResult.success ? 'SENT' : 'FAILED',
          sentAt: emailResult.success ? new Date() : null,
          errorMessage: emailResult.error || null,
        })
        .returning()

      return {
        success: emailResult.success,
        log: logEntry,
        error: emailResult.error,
      }
    },
  )
