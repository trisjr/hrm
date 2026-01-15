'use client'

import { Mail, Pencil, Send, Trash2 } from 'lucide-react'
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

interface EmailTemplatesTableProps {
  data: Array<EmailTemplate>
  isLoading: boolean
  onEdit: (template: EmailTemplate) => void
  onDelete: (id: number) => void
  onSend: (template: EmailTemplate) => void
}

export function EmailTemplatesTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onSend,
}: EmailTemplatesTableProps) {
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
            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No email templates found</h3>
            <p className="text-sm text-muted-foreground">
              Create your first email template to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-mono text-sm">
                  {template.code}
                </TableCell>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant={template.isSystem ? 'default' : 'secondary'}>
                    {template.isSystem ? 'System' : 'Custom'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {template.subject}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(template)}
                      title="Edit template"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSend(template)}
                      title="Send email"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    {!template.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(template.id)}
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {template.code}
                  </CardDescription>
                </div>
                <Badge variant={template.isSystem ? 'default' : 'secondary'}>
                  {template.isSystem ? 'System' : 'Custom'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="text-sm font-medium truncate">
                  {template.subject}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(template)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onSend(template)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
                {!template.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
