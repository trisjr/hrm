'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import type { SendEmailInput } from '@/lib/email-template.schemas'
import { sendEmailSchema } from '@/lib/email-template.schemas'
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
import { replacePlaceholders } from '@/lib/email.utils'

interface EmailTemplate {
  id: number
  code: string
  name: string
  subject: string
  body: string
  variables: string | null
}

interface SendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SendEmailInput) => Promise<void>
  template: EmailTemplate | null
}

export function SendEmailDialog({
  open,
  onOpenChange,
  onSubmit,
  template,
}: SendEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placeholderFields, setPlaceholderFields] = useState<
    Array<{ key: string; description: string }>
  >([])
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewBody, setPreviewBody] = useState('')

  const form = useForm<SendEmailInput>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      templateId: template?.id || 0,
      recipientEmail: '',
      placeholderValues: {},
    },
  })

  // Parse variables JSON and watch for changes
  useEffect(() => {
    if (template && open) {
      form.setValue('templateId', template.id)

      // Parse variables to get placeholder fields
      if (template.variables) {
        try {
          const vars = JSON.parse(template.variables)
          const fields = Object.entries(vars).map(([key, desc]) => ({
            key,
            description: desc as string,
          }))
          setPlaceholderFields(fields)

          // Initialize placeholder values
          const initialValues: Record<string, string> = {}
          fields.forEach((field) => {
            initialValues[field.key] = ''
          })
          form.setValue('placeholderValues', initialValues)
        } catch (error) {
          console.error('Failed to parse variables:', error)
          setPlaceholderFields([])
        }
      }
    } else if (!open) {
      form.reset({
        templateId: 0,
        recipientEmail: '',
        placeholderValues: {},
      })
      setPlaceholderFields([])
    }
  }, [template, open, form])

  // Update preview when placeholder values change
  const placeholderValues = form.watch('placeholderValues')
  useEffect(() => {
    if (template) {
      const subject = replacePlaceholders(template.subject, placeholderValues)
      const body = replacePlaceholders(template.body, placeholderValues)
      setPreviewSubject(subject)
      setPreviewBody(body)
    }
  }, [template, placeholderValues])

  const handleSubmit = async (data: SendEmailInput) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to send email:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Send Email from Template</DialogTitle>
          <DialogDescription>
            Template: <strong>{template?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Recipient Email */}
            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Recipient Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic Placeholder Fields */}
            {placeholderFields.length > 0 && (
              <div className="space-y-3">
                <FormLabel>Placeholder Values</FormLabel>
                {placeholderFields.map((field) => (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={`placeholderValues.${field.key}`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-normal">
                          {field.key}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={field.description}
                            {...formField}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {field.description}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            {/* Preview */}
            {placeholderValues && Object.keys(placeholderValues).length > 0 && (
              <div className="mt-4 space-y-2 rounded-md border p-4 bg-muted/50">
                <h4 className="text-sm font-semibold">Preview</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>{' '}
                    <span className="text-muted-foreground">
                      {previewSubject}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Body:</span>
                    <div
                      className="mt-1 rounded bg-background p-2 text-xs overflow-auto max-h-64"
                      dangerouslySetInnerHTML={{ __html: previewBody }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                Send Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
