'use client'

import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

interface EmailLogsTableProps {
  data: Array<EmailLog>
  isLoading: boolean
  onViewDetail: (log: EmailLog) => void
}

export function EmailLogsTable({
  data,
  isLoading,
  onViewDetail,
}: EmailLogsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center space-y-2">
            <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No email logs found</h3>
            <p className="text-sm text-muted-foreground">
              Email logs will appear here when emails are sent
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent At</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {log.sentAt
                    ? format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')
                    : '-'}
                </TableCell>
                <TableCell className="font-medium">
                  {log.recipientEmail}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {log.subject}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.template?.name || 'N/A'}
                </TableCell>
                <TableCell>{getStatusBadge(log.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(log)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((log) => (
          <Card key={log.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {log.recipientEmail}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {log.sentAt
                      ? format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')
                      : 'Not sent yet'}
                  </CardDescription>
                </div>
                {getStatusBadge(log.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="text-sm font-medium truncate">{log.subject}</p>
              </div>
              {log.template && (
                <div>
                  <p className="text-sm text-muted-foreground">Template:</p>
                  <p className="text-sm">{log.template.name}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onViewDetail(log)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
