'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Check, Edit2, MoreHorizontal, Trash2, X } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { RequestTypeChip } from './request-type-chip'
import { ApprovalDialog } from './approval-dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RequestsTableProps {
  mode: 'sent' | 'received'
  data: Array<RequestResponse>
  onApprove?: (requestId: number) => Promise<void>
  onReject?: (requestId: number, reason: string) => Promise<void>
  onEdit?: (request: RequestResponse) => void
  onCancel?: (requestId: number) => Promise<void>
  isLoading?: boolean
}

export function RequestsTable({
  mode,
  data,
  onApprove,
  onReject,
  onEdit,
  onCancel,
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
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
      {/* Desktop Table View */}
      <div className="hidden rounded-md border md:block">
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
              <TableHead className="text-right">Actions</TableHead>
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

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {(mode === 'sent' && request.status === 'PENDING') ||
                    mode === 'received' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {mode === 'sent' && request.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onEdit?.(request)}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => onCancel?.(request.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {mode === 'received' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleApproveClick(request.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleRejectClick(request.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {data.map((request) => (
          <div
            key={request.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="space-y-1">
                <RequestTypeChip
                  type={request.type}
                  isHalfDay={request.isHalfDay}
                />
                <div className="text-xs text-muted-foreground">
                  {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status} />
                {(mode === 'sent' && request.status === 'PENDING') ||
                mode === 'received' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {mode === 'sent' && request.status === 'PENDING' && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit?.(request)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onCancel?.(request.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                      {mode === 'received' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleApproveClick(request.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleRejectClick(request.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {format(new Date(request.startDate), 'MMM dd')} -{' '}
                  {format(new Date(request.endDate), 'MMM dd, yyyy')}
                </span>
              </div>

              {mode === 'received' && request.user && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">From:</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {request.user.profile?.fullName
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                      <p className="font-medium leading-none">
                        {request.user.profile?.fullName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {request.user.employeeCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'sent' && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Approver:</span>
                  {request.approver ? (
                    <div className="text-right">
                      <p className="font-medium leading-none">
                        {request.approver.profile?.fullName || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {request.approver.employeeCode}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
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
