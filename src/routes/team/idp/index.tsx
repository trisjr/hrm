import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getTeamIDPsFn } from '@/server/idp.server'
import { useAuthStore } from '@/store/auth.store'
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
  IconEye,
  IconLoader2,
  IconTarget,
  IconChartBar
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/team/idp/')({
  component: TeamIDPListPage,
})

function TeamIDPListPage() {
  const token = useAuthStore((state: any) => state.token)

  const { data: idpsData, isLoading } = useQuery({
    queryKey: ['team-idps'],
    queryFn: () => getTeamIDPsFn({ data: { token: token! } } as any),
  })

  // Group by status for stats
  const idps = idpsData?.data || []
  const activeCount = idps.filter((i: any) => i.status === 'IN_PROGRESS').length
  const completedCount = idps.filter((i: any) => i.status === 'COMPLETED').length
  const draftCount = idps.filter((i: any) => i.status === 'DRAFT').length
  
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Development Plans</h1>
          <p className="text-muted-foreground">
            Monitor and support your team's professional growth
          </p>
        </div>
        <Button variant="outline" disabled>
             <IconChartBar className="h-4 w-4 mr-2" /> Analytics (Coming Soon)
        </Button>
      </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                    <IconTarget className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeCount}</div>
                    <p className="text-xs text-muted-foreground">Employees currently working on goals</p>
                </CardContent>
            </Card>
            {/* Add more cards if needed */}
        </div>

      {/* Table */}
      <Card>
        <CardHeader>
            <CardTitle>Member Plans</CardTitle>
        </CardHeader>
        <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Development Goal</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {idps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No development plans found for your team.
              </TableCell>
            </TableRow>
          ) : (
            idps.map((idp: any) => {
              const activities = idp.activities || []
              const totalAct = activities.length
              const doneAct = activities.filter((a: any) => a.status === 'COMPLETED').length
              const progress = totalAct > 0 ? (doneAct / totalAct) * 100 : 0
              
              return (
                <TableRow key={idp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {idp.user.profile?.fullName?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {idp.user.profile?.fullName || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {idp.user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="line-clamp-2" title={idp.goal}>
                        {idp.goal}
                    </div>
                    {idp.userAssessment && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                            Cycle: {idp.userAssessment.cycle?.name}
                        </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                        {format(new Date(idp.startDate), 'MMM yyyy')} - {format(new Date(idp.endDate), 'MMM yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{Math.round(progress)}%</span>
                            <span className="text-muted-foreground">{doneAct}/{totalAct}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={idp.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                        {idp.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/team/idp/$idpId" params={{ idpId: idp.id.toString() }}>
                        <IconEye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      </CardContent>
      </Card>
    </div>
  )
}
