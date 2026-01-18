import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import {
  getAssessmentCycleByIdFn,
  updateAssessmentCycleStatusFn,
} from '@/server/competencies.server'
import {
  getAssessmentsByCycleFn,
  remindPendingAssessmentsFn,
} from '@/server/assessments.server'
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconClock,
  IconLoader2,
  IconMail,
  IconMessage,
  IconPlayerPlay,
  IconPlayerStop,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { AssessmentCycleStatusBadge } from '@/components/competencies/assessment-cycles/cycle-list'
import { Progress } from '@/components/ui/progress'

export const Route = createFileRoute('/admin/competencies/cycles/$cycleId')({
  component: CycleDetailComponent,
})

function CycleDetailComponent() {
  const { cycleId } = Route.useParams()
  const token = useAuthStore((state: any) => state.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()


  // Fetch Cycle Details
  const { data: cycleData, isLoading: isCycleLoading } = useQuery({
    queryKey: ['assessment-cycle', cycleId],
    queryFn: () =>
      getAssessmentCycleByIdFn({
        data: { token: token!, data: { cycleId: Number(cycleId) } },
      } as any),
  })

  // Fetch Assessments in Cycle
  const { data: assessmentsData, isLoading: isAssessmentsLoading } = useQuery({
    queryKey: ['cycle-assessments', cycleId],
    queryFn: () =>
      getAssessmentsByCycleFn({
        data: { token: token!, params: { cycleId: Number(cycleId) } },
      } as any),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'ACTIVE' | 'COMPLETED') => {
      await updateAssessmentCycleStatusFn({
        data: { token: token!, data: { cycleId: Number(cycleId), status } },
      } as any)
    },
    onSuccess: (_, status) => {
      toast.success(`Cycle ${status === 'ACTIVE' ? 'activated' : 'completed'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['assessment-cycle', cycleId] })
      queryClient.invalidateQueries({ queryKey: ['assessment-cycles-list'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const reminderMutation = useMutation({
    mutationFn: async () => {
      await remindPendingAssessmentsFn({
        data: { token: token!, data: { cycleId: Number(cycleId) } },
      } as any)
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Reminders sent')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const isLoading = isCycleLoading || isAssessmentsLoading
  const cycle = cycleData?.data
  const assessments = assessmentsData?.data || []

  // ... (stats calculation)
  const total = assessments.length
  const completed = assessments.filter((a: any) => a.status === 'DONE').length
  const discussion = assessments.filter((a: any) => a.status === 'DISCUSSION').length
  const leaderReview = assessments.filter((a: any) => a.status === 'LEADER_ASSESSING').length
  const selfReview = assessments.filter((a: any) => a.status === 'SELF_ASSESSING').length
  const progress = total > 0 ? (completed / total) * 100 : 0
  
  const handleRemindAll = () => {
    if (confirm('Send email reminders to all employees who have not completed self-assessment?')) {
        reminderMutation.mutate()
    }
  }

  const handleActivate = () => {
      if (confirm('Activate this cycle? Emails will be sent to all participants.')) {
          updateStatusMutation.mutate('ACTIVE')
      }
  }

  const handleClose = () => {
      if (confirm('Close this cycle? No further assessments can be submitted.')) {
          updateStatusMutation.mutate('COMPLETED')
      }
  }

  const handleRemindUser = (name: string) => {
    toast.success(`Reminder sent to ${name}`)
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="container py-10 text-center">
        <h2 className="text-xl font-bold">Assessment Cycle Not Found</h2>
        <Button className="mt-4" onClick={() => navigate({ to: '/admin/competencies/cycles' })}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent"
          asChild
        >
          <Link to="/admin/competencies/cycles">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Cycles
          </Link>
        </Button>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{cycle.name}</h1>
              <AssessmentCycleStatusBadge status={cycle.status} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconCalendar className="h-4 w-4" />
                <span>
                  {format(new Date(cycle.startDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(cycle.endDate), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cycle?.status === 'DRAFT' && (
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={handleActivate}>
                    <IconPlayerPlay className="mr-2 h-4 w-4" /> Activate Cycle
                </Button>
            )}
            {cycle?.status === 'ACTIVE' && (
                <>
                  <Button variant="outline" onClick={() => handleRemindAll()}>
                      <IconMail className="mr-2 h-4 w-4" /> Remind All Pending
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClose}>
                      <IconPlayerStop className="mr-2 h-4 w-4" /> Close Cycle
                  </Button>
                </>
            )}
            {cycle?.status === 'COMPLETED' && (
                <Badge variant="secondary">Archived</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Employees in this cycle
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <Progress value={progress} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selfReview + leaderReview}</div>
            <p className="text-xs text-muted-foreground">
              {leaderReview} waiting for leader, {selfReview} self-review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discussion Phase</CardTitle>
            <IconMessage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discussion}</div>
            <p className="text-xs text-muted-foreground">
              Ready for finalization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participants Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department/Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scores (Self / Leader / Final)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No participants yet. Assign users to start.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {a.user.profile?.fullName || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {a.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.user.team?.name || (
                        <span className="text-muted-foreground italic">
                          No Team
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-sm">
                        <span title="Self Score">
                          S: {a.selfScoreAvg?.toFixed(1) || '-'}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span title="Leader Score">
                          L: {a.leaderScoreAvg?.toFixed(1) || '-'}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span title="Final Score" className="font-bold">
                          F: {a.finalScoreAvg?.toFixed(1) || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       {a.status !== 'DONE' && (
                           <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemindUser(a.user.profile?.fullName)}
                           >
                            <IconMail className="h-4 w-4 mr-1" />
                            Remind
                           </Button>
                       )}
                       <Button variant="ghost" size="sm" asChild>
                           <Link
                             to="/competencies/assessments/$assessmentId"
                             params={{ assessmentId: a.id.toString() }}
                           >
                               <IconUser className="h-4 w-4 mr-1"/> View
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
