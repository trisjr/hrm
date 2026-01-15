'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { RequestResponse } from '@/lib/request.schemas'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from './status-badge'
import { RequestTypeChip } from './request-type-chip'
import { ApprovalDialog } from './approval-dialog'
import { Check, X } from 'lucide-react'

interface RequestsTableProps {
  mode: 'sent' | 'received'
  data: RequestResponse[]
  onApprove?: (requestId: number) => Promise<void>
  onReject?: (requestId: number, reason: string) => Promise<void>
  isLoading?: boolean
}

export function RequestsTable({
  mode,
  data,
  onApprove,
  onReject,
  isLoading = false,
}: RequestsTableProps) {
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean
    mode: 'approve' | 'reject'
    requestId: number
  }>({
    open: false,
    mode: 'approve',
    requestId: 0,
  })

  const handleApproveClick = (requestId: number) => {
    setApprovalDialog({
      open: true,
      mode: 'approve',
      requestId,
    })
  }

  const handleRejectClick = (requestId: number) => {
    setApprovalDialog({
      open: true,
      mode: 'reject',
      requestId,
    })
  }

  const handleApproveConfirm = async (requestId: number) => {
    if (onApprove) {
      await onApprove(requestId)
    }
  }

  const handleRejectConfirm = async (requestId: number, reason: string) => {
    if (onReject) {
      await onReject(requestId, reason)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading requests...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          {mode === 'sent'
            ? 'No requests submitted yet'
            : 'No pending requests to review'}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {mode === 'sent'
            ? 'Create a new request to get started'
            : 'Pending requests will appear here'}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {mode === 'received' && <TableHead>Sender</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              {mode === 'sent' && <TableHead>Approver</TableHead>}
              <TableHead>Created</TableHead>
              {mode === 'received' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((request) => (
              <TableRow key={request.id}>
                {/* Sender (for received mode) */}
                {mode === 'received' && (
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {request.user?.profile?.fullName
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {request.user?.profile?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.user?.employeeCode}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                )}

                {/* Type */}
                <TableCell>
                  <RequestTypeChip
                    type={request.type}
                    isHalfDay={request.isHalfDay}
                  />
                </TableCell>

                {/* Start Date */}
                <TableCell>
                  {format(new Date(request.startDate), 'MMM dd, yyyy')}
                </TableCell>

                {/* End Date */}
                <TableCell>
                  {format(new Date(request.endDate), 'MMM dd, yyyy')}
                  {request.isHalfDay && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Half)
                    </span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>

                {/* Approver (for sent mode) */}
                {mode === 'sent' && (
                  <TableCell>
                    {request.approver ? (
                      <div className="text-sm">
                        <div className="font-medium">
                          {request.approver.profile?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.approver.employeeCode}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </TableCell>
                )}

                {/* Created */}
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(request.createdAt), 'HH:mm')}
                  </div>
                </TableCell>

                {/* Actions (for received mode) */}
                {mode === 'received' && (
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApproveClick(request.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(request.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approval Dialog */}
      {mode === 'received' && (
        <ApprovalDialog
          open={approvalDialog.open}
          onOpenChange={(open) =>
            setApprovalDialog({ ...approvalDialog, open })
          }
          mode={approvalDialog.mode}
          requestId={approvalDialog.requestId}
          onApprove={handleApproveConfirm}
          onReject={handleRejectConfirm}
        />
      )}
    </>
  )
}
