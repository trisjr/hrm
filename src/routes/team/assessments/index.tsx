import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getTeamAssessmentsFn } from '@/server/assessments.server'
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
  IconBell,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconEye,
  IconLoader2,
  IconMessage,
  IconPencil,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const Route = createFileRoute('/team/assessments/')({
  component: TeamAssessmentsPage,
})

function TeamAssessmentsPage() {
  const token = useAuthStore((state: any) => state.token)

  const { data, isLoading } = useQuery({
    queryKey: ['team-assessments'],
    queryFn: () =>
      getTeamAssessmentsFn({
        data: { token: token! },
      } as any),
  })

  const handleRemind = (employeeName: string) => {
    // In a real app, this would call an API to send an email
    toast.success(`Reminder sent to ${employeeName}`, {
      description: 'They will receive an email notification to complete their assessment.',
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const assessments = data?.data || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELF_ASSESSING':
        return (
          <Badge variant="outline" className="flex w-fit items-center gap-1 border-muted-foreground/40 text-muted-foreground">
            <IconClock className="h-3 w-3" /> Self Assessing
          </Badge>
        )
      case 'LEADER_ASSESSING':
        return (
          <Badge className="flex w-fit items-center gap-1 bg-blue-500 hover:bg-blue-600 animate-pulse">
            <IconPencil className="h-3 w-3" /> Ready for Review
          </Badge>
        )
      case 'DISCUSSION':
        return (
          <Badge className="flex w-fit items-center gap-1 bg-orange-500 hover:bg-orange-600">
            <IconMessage className="h-3 w-3" /> Discussion Phase
          </Badge>
        )
      case 'DONE':
        return (
          <Badge className="flex w-fit items-center gap-1 bg-green-500 hover:bg-green-600">
            <IconCheck className="h-3 w-3" /> Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderActions = (assessment: any) => {
    const status = assessment.status

    switch (status) {
      case 'SELF_ASSESSING':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => handleRemind(assessment.user.profile?.fullName)}
                >
                  <IconBell className="h-4 w-4 mr-1" />
                  Remind
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send a reminder email to this employee</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )

      case 'LEADER_ASSESSING':
        return (
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link
              to="/competencies/assessments/$assessmentId"
              params={{ assessmentId: assessment.id.toString() }}
            >
              <IconPencil className="h-4 w-4 mr-2" />
              Evaluate Now
            </Link>
          </Button>
        )

      case 'DISCUSSION':
        return (
          <Button variant="secondary" size="sm" className="bg-orange-100 text-orange-700 hover:bg-orange-200" asChild>
             <Link
              to="/competencies/assessments/$assessmentId"
              params={{ assessmentId: assessment.id.toString() }}
            >
              <IconMessage className="h-4 w-4 mr-2" />
              Finalize
            </Link>
          </Button>
        )

      case 'DONE':
        return (
          <Button variant="outline" size="sm" asChild>
             <Link
              to="/trainings/idp/create" // Placeholder: Should link to view result or create IDP
              search={{ assessmentId: assessment.id }}
            >
              <IconEye className="h-4 w-4 mr-2" />
              View Result
            </Link>
          </Button>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Assessments</h1>
          <p className="text-muted-foreground">
            Monitor progress and perform assessments for your team members.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  <p>No assessments found.</p>
                  <p className="text-xs">Assessments will appear here when an assessment cycle is active.</p>
                </TableCell>
              </TableRow>
            ) : (
              assessments.map((assessment: any) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {assessment.user.profile?.fullName?.substring(0, 2).toUpperCase() || 'NA'}
                       </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {assessment.user.profile?.fullName || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assessment.user.employeeCode}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{assessment.cycle?.name}</TableCell>
                  <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(assessment.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {renderActions(assessment)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
