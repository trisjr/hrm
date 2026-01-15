'use client'

import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

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

interface EmailLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: EmailLog | null
}

export function EmailLogDetailDialog({
  open,
  onOpenChange,
  log,
}: EmailLogDetailDialogProps) {
  if (!log) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge className="bg-green-500">Sent</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      case 'QUEUED':
        return <Badge variant="secondary">Queued</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Email Log Details</DialogTitle>
          <DialogDescription>
            Log ID: #{log.id} | {getStatusBadge(log.status)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Recipient</h4>
              <p className="text-sm text-muted-foreground">
                {log.recipientEmail}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Sent At</h4>
              <p className="text-sm text-muted-foreground">
                {log.sentAt
                  ? format(new Date(log.sentAt), 'PPpp')
                  : 'Not sent yet'}
              </p>
            </div>
          </div>

          {/* Template & Sender */}
          <div className="grid grid-cols-2 gap-4">
            {log.template && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Template</h4>
                <p className="text-sm text-muted-foreground">
                  {log.template.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {log.template.code}
                </p>
              </div>
            )}
            {log.sender && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Sender</h4>
                <p className="text-sm text-muted-foreground">
                  {log.sender.profile?.fullName || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {log.sender.employeeCode}
                </p>
              </div>
            )}
            {!log.sender && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Sender</h4>
                <p className="text-sm text-muted-foreground">System</p>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <h4 className="text-sm font-semibold mb-1">Subject</h4>
            <p className="text-sm text-muted-foreground">{log.subject}</p>
          </div>

          {/* Error Message */}
          {log.errorMessage && (
            <div>
              <h4 className="text-sm font-semibold mb-1 text-destructive">
                Error Message
              </h4>
              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {log.errorMessage}
              </p>
            </div>
          )}

          {/* Email Body */}
          {log.body && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Email Body</h4>
              <div className="rounded-md border bg-muted/50 p-4 max-h-96 overflow-auto">
                <iframe
                  srcDoc={log.body}
                  title="Email Preview"
                  className="w-full min-h-[300px] bg-white rounded"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
