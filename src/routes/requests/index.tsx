import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { CreateRequestInput, RequestResponse } from '@/lib/request.schemas'
import {
  approveRequestFn,
  cancelRequestFn,
  createRequestFn,
  getRequestsReceivedFn,
  getRequestsSentFn,
  rejectRequestFn,
  updateRequestFn,
} from '@/server/requests.server'
import { useAuthStore } from '@/store/auth.store'
import { RequestsTable } from '@/components/requests/requests-table'
import { RequestDialog } from '@/components/requests/request-dialog'
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
import { Pagination } from '@/components/common/pagination'

// Search params validation
const requestsSearchSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  tab: z.enum(['sent', 'received']).optional().default('sent'),
})

export const Route = createFileRoute('/requests/')({
  validateSearch: (search) => requestsSearchSchema.parse(search),
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { tab, page, limit } = Route.useSearch()
  const { token, user } = useAuthStore()

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editRequest, setEditRequest] = React.useState<RequestResponse | null>(
    null,
  )
  const [requestToCancel, setRequestToCancel] = React.useState<number | null>(
    null,
  )

  // Check if user can see "Received" tab (Leader or HR/Admin)
  const canApprove =
    user?.roleName === 'Leader' ||
    user?.roleName === 'HR' ||
    user?.roleName === 'ADMIN'

  // Determine active tab for fetching logic
  const activeTab = canApprove ? (tab as 'sent' | 'received') : 'sent'

  // Query for Sent Requests
  const sentQuery = useQuery({
    queryKey: ['requests', 'sent', page, limit],
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')

      return await getRequestsSentFn({ data: { token, page, limit } })
    },
    enabled: !!token && activeTab === 'sent',
  })

  // Query for Received Requests
  const receivedQuery = useQuery({
    queryKey: ['requests', 'received', page, limit],
    queryFn: async () => {
      if (!token) throw new Error('Authentication required')

      return await getRequestsReceivedFn({ data: { token, page, limit } })
    },
    enabled: !!token && activeTab === 'received' && canApprove,
  })

  // Derive data for display
  const sentRequests = (sentQuery.data?.data as RequestResponse[]) || []
  const receivedRequests = (receivedQuery.data?.data as RequestResponse[]) || []

  // Decide which data to use for current view logic (like finding item to delete)
  const currentRequestsList =
    activeTab === 'sent' ? sentRequests : receivedRequests

  // Pagination logic based on active tab
  const currentPagination =
    activeTab === 'sent'
      ? (sentQuery.data as any)?.pagination
      : (receivedQuery.data as any)?.pagination

  const pagination = currentPagination || {
    page,
    limit,
    total: 0,
    totalPages: 0,
  }

  const handlePageChange = async (newPage: number) => {
    await navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handleTabChange = async (newTab: string) => {
    await navigate({
      search: (prev) => ({
        ...prev,
        tab: newTab as 'sent' | 'received',
        page: 1,
      }),
    })
  }

  const handleRefresh = async () => {
    if (activeTab === 'sent') await sentQuery.refetch()
    else await receivedQuery.refetch()
  }

  // Create or update request
  const handleSubmitRequest = async (data: CreateRequestInput) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      if (editRequest) {
        await updateRequestFn({
          data: {
            token,
            data: {
              requestId: editRequest.id,
              data,
            },
          },
        })
        toast.success('Request updated successfully')
      } else {
        await createRequestFn({
          data: {
            token,
            data,
          },
        })
        toast.success('Request submitted successfully')
      }
      await handleRefresh()
      setEditRequest(null)
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(
        editRequest ? 'Failed to update request' : 'Failed to create request',
        {
          description: error.message || 'An error occurred',
        },
      )
      throw error // Re-throw to prevent dialog from closing
    }
  }

  // Edit request
  const handleEdit = (request: RequestResponse) => {
    setEditRequest(request)
    setIsDialogOpen(true)
  }

  // Cancel request click
  const handleCancelClick = async (requestId: number) => {
    setRequestToCancel(requestId)
  }

  // Find request to cancel for display
  const targetRequest = React.useMemo(
    () => currentRequestsList.find((r) => r.id === requestToCancel),
    [currentRequestsList, requestToCancel],
  )

  // Confirm cancel
  const handleConfirmCancel = async () => {
    if (!token || !requestToCancel) return

    try {
      await cancelRequestFn({
        data: {
          token,
          data: { requestId: requestToCancel },
        },
      })
      toast.success('Request cancelled successfully')
      await handleRefresh()
      setRequestToCancel(null)
    } catch (error: any) {
      toast.error('Failed to cancel request', {
        description: error.message || 'An error occurred',
      })
    }
  }

  // Approve request
  const handleApprove = async (requestId: number) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await approveRequestFn({
        data: {
          token,
          data: { requestId },
        },
      })
      toast.success('Request approved successfully')
      await handleRefresh()
    } catch (error: any) {
      toast.error('Failed to approve request', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  // Reject request
  const handleReject = async (requestId: number, reason: string) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await rejectRequestFn({
        data: {
          token,
          data: { requestId, rejectionReason: reason },
        },
      })
      toast.success('Request rejected')
      await handleRefresh()
    } catch (error: any) {
      toast.error('Failed to reject request', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

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
            <BreadcrumbPage>Requests</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Work Requests
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your leave, WFH, and other work-related requests
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue={tab}
        value={tab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {canApprove && (
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sent">My Requests (Sent)</TabsTrigger>
            <TabsTrigger value="received">Team Requests (Received)</TabsTrigger>
          </TabsList>
        )}

        {/* Content Area */}
        <div className="mt-0">
          {canApprove && (
            <TabsContent value="received" className="mt-0">
              <RequestsTable
                mode="received"
                data={receivedRequests}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={receivedQuery.isLoading}
              />
            </TabsContent>
          )}

          <TabsContent value="sent" className="mt-0">
            <RequestsTable
              mode="sent"
              data={sentRequests}
              onEdit={handleEdit}
              onCancel={handleCancelClick}
              isLoading={sentQuery.isLoading}
            />
          </TabsContent>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Tabs>

      {/* Create/Edit Request Dialog */}
      <RequestDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditRequest(null)
        }}
        onSubmit={handleSubmitRequest}
        editRequest={editRequest}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!requestToCancel}
        onOpenChange={(open) => !open && setRequestToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently cancel your{' '}
              <span className="font-semibold text-foreground">
                {targetRequest?.type}
              </span>{' '}
              request for{' '}
              <span className="font-semibold text-foreground">
                {targetRequest?.startDate &&
                  format(new Date(targetRequest.startDate), 'MMM dd, yyyy')}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmCancel}
            >
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
