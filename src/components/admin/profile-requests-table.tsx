import { useState } from 'react'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileRequestDetailDialog } from '@/components/admin/profile-request-detail-dialog'

interface ProfileUpdateRequest {
  id: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  createdAt: Date | null
  user: {
    employeeCode: string
    email: string
    profile: any | null
    role: {
      roleName: string
    } | null
  }
  dataChanges: Record<string, any>
  previousData?: Record<string, any> | null
}

interface ProfileRequestsTableProps {
  data: Array<ProfileUpdateRequest>
}

export function ProfileRequestsTable({ data }: ProfileRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<ProfileUpdateRequest | null>(null)

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Requests Found</CardTitle>
          <CardDescription>
            There are no profile update requests at the moment.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  {req.createdAt
                    ? format(new Date(req.createdAt), 'MMM dd, yyyy HH:mm')
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {req.user.profile?.fullName || req.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {req.user.employeeCode}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{req.user.role?.roleName}</TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {
                      Object.entries(req.dataChanges).filter(([key, newValue]) => {
                        const oldValue = req.previousData
                          ? req.previousData[key]
                          : req.user.profile?.[key]
                        return String(oldValue ?? '') !== String(newValue ?? '')
                      }).length
                    } field(s)
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(req.status)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProfileRequestDetailDialog
        open={!!selectedRequest}
        onOpenChange={(open: boolean) => !open && setSelectedRequest(null)}
        request={selectedRequest}
      />
    </>
  )
}
