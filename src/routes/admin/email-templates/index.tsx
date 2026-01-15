import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type {
  CreateEmailTemplateInput,
  SendEmailInput,
} from '@/lib/email-template.schemas'
import {
  createEmailTemplateFn,
  deleteEmailTemplateFn,
  listEmailTemplatesFn,
  sendEmailFromTemplateFn,
  updateEmailTemplateFn,
} from '@/server/email-template.server'
import { listEmailLogsFn } from '@/server/email-log.server'
import { useAuthStore } from '@/store/auth.store'
import { EmailTemplatesTable } from '@/components/email-templates/email-templates-table'
import { EmailTemplateDialog } from '@/components/email-templates/email-template-dialog'
import { SendEmailDialog } from '@/components/email-templates/send-email-dialog'
import { EmailLogsTable } from '@/components/email-logs/email-logs-table'
import { EmailLogDetailDialog } from '@/components/email-logs/email-log-detail-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export const Route = createFileRoute('/admin/email-templates/')({
  component: RouteComponent,
})

interface EmailTemplate {
  id: number
  code: string
  name: string
  subject: string
  body: string
  variables: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date | null
}

interface EmailLog {
  id: number
  recipientEmail: string
  subject: string
  body: string | null
  status: 'SENT' | 'FAILED' | 'QUEUED'
  sentAt: Date | null
  errorMessage: string | null
  createdAt: Date
  template?: {
    code: string
    name: string
  } | null
  sender?: {
    employeeCode: string
    profile: {
      fullName: string
    } | null
  } | null
}

function RouteComponent() {
  const { token } = useAuthStore()
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false)
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] =
    React.useState(false)
  const [isLogDetailDialogOpen, setIsLogDetailDialogOpen] =
    React.useState(false)
  const [editTemplate, setEditTemplate] = React.useState<EmailTemplate | null>(
    null,
  )
  const [sendTemplate, setSendTemplate] = React.useState<EmailTemplate | null>(
    null,
  )
  const [selectedLog, setSelectedLog] = React.useState<EmailLog | null>(null)
  const [templateToDelete, setTemplateToDelete] = React.useState<number | null>(
    null,
  )
  const [templates, setTemplates] = React.useState<Array<EmailTemplate>>([])
  const [logs, setLogs] = React.useState<Array<EmailLog>>([])
  const [isTemplatesLoading, setIsTemplatesLoading] = React.useState(true)
  const [isLogsLoading, setIsLogsLoading] = React.useState(true)

  // Fetch email templates
  const fetchTemplates = React.useCallback(async () => {
    if (!token) return

    setIsTemplatesLoading(true)
    try {
      const response = await listEmailTemplatesFn({
        data: { page: 1, limit: 100 },
      })
      setTemplates((response as any).templates || [])
    } catch (error: any) {
      toast.error('Failed to load email templates', {
        description: error.message || 'An error occurred',
      })
    } finally {
      setIsTemplatesLoading(false)
    }
  }, [token])

  // Fetch email logs
  const fetchLogs = React.useCallback(async () => {
    if (!token) return

    setIsLogsLoading(true)
    try {
      const response = await listEmailLogsFn({ data: { page: 1, limit: 100 } })
      setLogs((response as any).logs || [])
    } catch (error: any) {
      toast.error('Failed to load email logs', {
        description: error.message || 'An error occurred',
      })
    } finally {
      setIsLogsLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Create or update template
  const handleSubmitTemplate = async (data: CreateEmailTemplateInput) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      if (editTemplate) {
        await updateEmailTemplateFn({
          data: {
            token,
            id: editTemplate.id,
            data,
          },
        })
        toast.success('Template updated successfully')
      } else {
        await createEmailTemplateFn({
          data: {
            token,
            data,
          },
        })
        toast.success('Template created successfully')
      }
      fetchTemplates()
      setEditTemplate(null)
      setIsTemplateDialogOpen(false)
    } catch (error: any) {
      toast.error(
        editTemplate
          ? 'Failed to update template'
          : 'Failed to create template',
        {
          description: error.message || 'An error occurred',
        },
      )
      throw error
    }
  }

  // Edit template
  const handleEdit = (template: EmailTemplate) => {
    setEditTemplate(template)
    setIsTemplateDialogOpen(true)
  }

  // Delete template click
  const handleDeleteClick = (templateId: number) => {
    setTemplateToDelete(templateId)
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!token || !templateToDelete) return

    try {
      await deleteEmailTemplateFn({
        data: {
          token,
          id: templateToDelete,
        },
      })
      toast.success('Template deleted successfully')
      fetchTemplates()
      setTemplateToDelete(null)
    } catch (error: any) {
      toast.error('Failed to delete template', {
        description: error.message || 'An error occurred',
      })
    }
  }

  // Send email
  const handleSendClick = (template: EmailTemplate) => {
    setSendTemplate(template)
    setIsSendEmailDialogOpen(true)
  }

  const handleSendEmail = async (data: SendEmailInput) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await sendEmailFromTemplateFn({
        data: {
          token,
          data,
        },
      })
      toast.success('Email sent successfully')
      fetchLogs() // Refresh logs
      setSendTemplate(null)
      setIsSendEmailDialogOpen(false)
    } catch (error: any) {
      toast.error('Failed to send email', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  // View log detail
  const handleViewLogDetail = (log: EmailLog) => {
    setSelectedLog(log)
    setIsLogDetailDialogOpen(true)
  }

  const targetTemplate = React.useMemo(
    () => templates.find((t) => t.id === templateToDelete),
    [templates, templateToDelete],
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link
              to="/admin"
              className="hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Email Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Email Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage email templates and view email history
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsTemplateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <EmailTemplatesTable
            data={templates}
            isLoading={isTemplatesLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onSend={handleSendClick}
          />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <EmailLogsTable
            data={logs}
            isLoading={isLogsLoading}
            onViewDetail={handleViewLogDetail}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Dialog */}
      <EmailTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={(open) => {
          setIsTemplateDialogOpen(open)
          if (!open) setEditTemplate(null)
        }}
        onSubmit={handleSubmitTemplate}
        editTemplate={editTemplate}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={isSendEmailDialogOpen}
        onOpenChange={(open) => {
          setIsSendEmailDialogOpen(open)
          if (!open) setSendTemplate(null)
        }}
        onSubmit={handleSendEmail}
        template={sendTemplate}
      />

      {/* Email Log Detail Dialog */}
      <EmailLogDetailDialog
        open={isLogDetailDialogOpen}
        onOpenChange={setIsLogDetailDialogOpen}
        log={selectedLog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              <span className="font-semibold text-foreground">
                {targetTemplate?.name}
              </span>{' '}
              template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Yes, Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
