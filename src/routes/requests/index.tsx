import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  approveRequestFn,
  createRequestFn,
  getRequestsReceivedFn,
  getRequestsSentFn,
  rejectRequestFn,
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
} from '@/components/ui/breadcrumb'

export const Route = createFileRoute('/requests/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token, user } = useAuthStore()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
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

  // Create request
  const handleCreateRequest = async (data: CreateRequestInput) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await createRequestFn({
        data: {
          token,
          data,
        },
      })
      toast.success('Request submitted successfully')
      fetchData() // Refresh data
    } catch (error: any) {
      toast.error('Failed to create request', {
        description: error.message || 'An error occurred',
      })
      throw error // Re-throw to prevent dialog from closing
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
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <RequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateRequest}
      />
    </div>
  )
}
