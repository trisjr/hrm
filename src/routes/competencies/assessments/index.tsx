import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getMyAssessmentsHistoryFn } from '@/server/assessments.server'
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
import { IconEye, IconLoader2, IconAlertCircle } from '@tabler/icons-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/competencies/assessments/')({
  component: AssessmentHistoryPage,
})

function AssessmentHistoryPage() {
  const token = useAuthStore((state: any) => state.token)

  const { data: assessmentsData, isLoading, error } = useQuery({
    queryKey: ['my-assessments-history'],
    queryFn: () => getMyAssessmentsHistoryFn({ data: { token: token! } } as any),
  })

  console.log('>>> HISTORY PAGE DEBUG:', {
      data: assessmentsData,
      error,
      isLoading,
      tokenLen: token?.length
  })

  const assessments = assessmentsData?.data || []

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center text-destructive flex-col gap-2">
        <IconAlertCircle className="h-8 w-8" />
        <p>Failed to load assessments</p>
        <p className="text-sm text-muted-foreground">{String(error)}</p>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessment History</h1>
        <p className="text-muted-foreground">
          View your past competency assessments and performance growth.
        </p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>System Status</TableHead>
                <TableHead>Assessment Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Scores (Self / Final)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No assessments found.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.cycle?.name || `Assessment #${a.id}`}
                    </TableCell>
                    <TableCell>
                         <Badge variant="outline">{a.cycle?.status || 'UNKNOWN'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'DONE' ? 'default' : 'secondary'}>
                        {a.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(a.createdAt), 'PP')}
                    </TableCell>
                    <TableCell>
                       {a.selfScoreAvg?.toFixed(1) || '-'} / {a.finalScoreAvg?.toFixed(1) || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          to="/competencies/assessments/$assessmentId"
                          params={{ assessmentId: a.id.toString() }}
                        >
                          <IconEye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
