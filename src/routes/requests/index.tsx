import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
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
import type { CreateRequestInput, RequestResponse } from '@/lib/request.schemas'
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
import { format } from 'date-fns'

export const Route = createFileRoute('/requests/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token, user } = useAuthStore()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editRequest, setEditRequest] = React.useState<RequestResponse | null>(
    null,
  )
  const [requestToCancel, setRequestToCancel] = React.useState<number | null>(
    null,
  )
  const [sentRequests, setSentRequests] = React.useState<RequestResponse[]>([])
  const [receivedRequests, setReceivedRequests] = React.useState<
    RequestResponse[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Check if user can see "Received" tab (Leader or HR/Admin)
  const canApprove =
    user?.roleName === 'Leader' ||
    user?.roleName === 'HR' ||
    user?.roleName === 'ADMIN'

  // Fetch data
  const fetchData = React.useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    try {
      // Fetch sent requests
      const sentResponse = await getRequestsSentFn({ data: { token } })
      setSentRequests((sentResponse.data as any) || [])

      // Fetch received requests if user has approval permission
      if (canApprove) {
        const receivedResponse = await getRequestsReceivedFn({
          data: { token },
        })
        setReceivedRequests((receivedResponse.data as any) || [])
      }
    } catch (error: any) {
      toast.error('Failed to load requests', {
        description: error.message || 'An error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }, [token, canApprove])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

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
      fetchData() // Refresh data
      setEditRequest(null) // Clear edit state
      setIsDialogOpen(false) // Close dialog
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
    () => sentRequests.find((r) => r.id === requestToCancel),
    [sentRequests, requestToCancel],
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
      fetchData() // Refresh data
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
      fetchData() // Refresh data
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
      fetchData() // Refresh data
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
      <Tabs defaultValue={canApprove ? 'received' : 'sent'} className="w-full">
        {canApprove && (
          <TabsList className="grid w-full grid-cols-2">
            {canApprove && <TabsTrigger value="received">Received</TabsTrigger>}
            <TabsTrigger value="sent">
              {canApprove ? 'Sent' : 'My Requests'}
            </TabsTrigger>
          </TabsList>
        )}

        {/* Received Requests Tab */}
        {canApprove && (
          <TabsContent value="received" className="mt-6">
            <RequestsTable
              mode="received"
              data={receivedRequests}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="mt-6">
          <RequestsTable
            mode="sent"
            data={sentRequests}
            onEdit={handleEdit}
            onCancel={handleCancelClick}
            isLoading={isLoading}
          />
        </TabsContent>
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
