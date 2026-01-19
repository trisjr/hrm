import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Request {
  id: number
  type: string
  status: string // PENDING, APPROVED, REJECTED
  startDate: string
  endDate: string
  createdAt: string
  user?: { fullName: string; email: string } // Optional user details
}

interface RequestsWidgetProps {
  title: string
  requests: Request[]
  emptyMessage?: string
  showUser?: boolean // Show requester name (for Leader/Admin view)
}

export function RequestsWidget({ 
  title, 
  requests, 
  emptyMessage = 'No requests found',
  showUser = false
}: RequestsWidgetProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default' // shadcn default is effectively black/primary, usually stick directly to badge variant
      case 'REJECTED': return 'destructive'
      default: return 'secondary' // Yellow/Orange often mapped to secondary or outline
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                     <Badge variant="outline">{req.type}</Badge>
                     {showUser && <span className="text-primary">{req.user?.fullName}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(req.startDate), 'MMM dd')} - {format(new Date(req.endDate), 'MMM dd')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusIcon(req.status)}
                    <Badge variant={getStatusColor(req.status) as any} className="text-[10px] px-1.5 py-0 h-5">
                        {req.status}
                    </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
