'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import type { CreateEmailTemplateInput } from '@/lib/email-template.schemas'
import {
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
} from '@/lib/email-template.schemas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface EmailTemplate {
  id: number
  code: string
  name: string
  subject: string
  body: string
  variables: string | null
  isSystem: boolean
}

interface EmailTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateEmailTemplateInput) => Promise<void>
  editTemplate?: EmailTemplate | null
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  editTemplate,
}: EmailTemplateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!editTemplate

  const form = useForm<CreateEmailTemplateInput>({
    resolver: zodResolver(
      isEditMode ? updateEmailTemplateSchema : createEmailTemplateSchema,
    ),
    defaultValues: {
      code: '',
      name: '',
      subject: '',
      body: '',
      variables: '',
      isSystem: false,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editTemplate && open) {
      form.reset({
        code: editTemplate.code,
        name: editTemplate.name,
        subject: editTemplate.subject,
        body: editTemplate.body,
        variables: editTemplate.variables || '',
        isSystem: editTemplate.isSystem,
      })
    } else if (!open) {
      // Reset form when dialog closes
      form.reset({
        code: '',
        name: '',
        subject: '',
        body: '',
        variables: '',
        isSystem: false,
      })
    }
  }, [editTemplate, open, form])

  const handleSubmit = async (data: CreateEmailTemplateInput) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-180">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the email template details below.'
              : 'Create a new email template with placeholder support.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Template Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Template Code <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="WELCOME_NEW_USER"
                      {...field}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormDescription>
                    Uppercase letters and underscores only. Cannot be changed
                    after creation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Template Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Welcome New User" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Subject <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Welcome to HRM - {fullName}"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {'{'} {'}'} for placeholders, e.g., {'{fullName}'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Body (HTML){' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<p>Hello {fullName}!</p>"
                      className="font-mono text-sm resize-none"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    HTML content. Use placeholders like {'{fullName}'}, {'{'}
                    email{'}'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variables */}
            <FormField
              control={form.control}
              name="variables"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variables (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"fullName": "User full name", "email": "User email"}'
                      className="font-mono text-sm resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    JSON object describing available placeholders (for
                    documentation)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Update Template' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
