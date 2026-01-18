import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getIDPByIdFn } from '@/server/idp.server'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import {
  IconArrowLeft,
  IconCalendar,
  IconTarget,
  IconCheck,
  IconUser,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/team/idp/$idpId')({
  component: TeamIDPDetailPage,
})

function TeamIDPDetailPage() {
  const { idpId } = Route.useParams()
  const token = useAuthStore((state: any) => state.token)
  const navigate = useNavigate()

  const { data: idpData, isLoading } = useQuery({
    queryKey: ['team-idp', idpId],
    queryFn: () => getIDPByIdFn({ data: { token: token!, data: { idpId: Number(idpId) } } } as any),
  })

  const idp = idpData?.data

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!idp) {
    return <div className="p-8">IDP Not Found</div>
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" className="pl-0" asChild>
          <Link to="/team/idp">
            <IconArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Development Plan Detail</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <IconUser className="h-4 w-4" />
                    <span className="font-medium text-foreground">{idp.user.profile?.fullName}</span>
                    <span>•</span>
                    <span>{idp.user.email}</span>
                </div>
            </div>
            <Badge className="text-sm px-3 py-1" variant={idp.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                {idp.status.replace('_', ' ')}
            </Badge>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
          <CardHeader>
              <CardTitle className="text-lg">Plan Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Development Goal</h3>
                  <p className="text-lg">{idp.goal}</p>
              </div>
              <div className="flex gap-8">
                  <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Start Date</h3>
                      <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(idp.startDate), 'PPP')}</span>
                      </div>
                  </div>
                  <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Target End Date</h3>
                      <div className="flex items-center gap-2">
                          <IconTarget className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(idp.endDate), 'PPP')}</span>
                      </div>
                  </div>
                  {idp.userAssessment && (
                       <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Linked Cycle</h3>
                          <Badge variant="outline">{idp.userAssessment.cycle?.name}</Badge>
                       </div>
                  )}
              </div>
          </CardContent>
      </Card>

      {/* Activities */}
      <Card>
          <CardHeader>
              <CardTitle className="text-lg">Development Activities</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Competency</TableHead>
                          <TableHead>Activity</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Target Date</TableHead>
                          <TableHead>Evidence</TableHead>
                          <TableHead>Status</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {idp.activities.map((act: any) => (
                          <TableRow key={act.id}>
                              <TableCell className="font-medium">{act.competency?.name || 'General'}</TableCell>
                              <TableCell>
                                  <div className="line-clamp-2" title={act.description}>{act.description}</div>
                              </TableCell>
                              <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                      {act.activityType.replace('_', ' ')}
                                  </Badge>
                              </TableCell>
                              <TableCell>
                                  {act.dueDate ? format(new Date(act.dueDate), 'PP') : '-'}
                              </TableCell>
                              <TableCell>
                                  <span className="text-sm text-muted-foreground italic">
                                      {act.evidence || 'No evidence yet'}
                                  </span>
                              </TableCell>
                              <TableCell>
                                  <Badge 
                                    variant={act.status === 'COMPLETED' ? 'default' : act.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}
                                  >
                                      {act.status}
                                  </Badge>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  )
}
