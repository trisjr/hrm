import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getAssessmentByIdFn } from '@/server/assessments.server'
import { AssessmentDetail } from '@/components/competencies/assessments/assessment-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/competencies/assessments/$assessmentId')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  const { assessmentId } = Route.useParams()
  const token = useAuthStore((state: any) => state.token)

  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () =>
      getAssessmentByIdFn({
        data: {
          token: token!,
          params: { assessmentId: parseInt(assessmentId) },
        },
      } as any),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-4xl space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message ||
              'Failed to load assessment data. You may not have permission to view this.'}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  const { assessment, details, meta } = data.data

  // Determine mode
  let mode: 'SELF' | 'LEADER' = 'SELF' // default
  let isReadOnly = true

  if (meta.isOwner && assessment.status === 'SELF_ASSESSING') {
    mode = 'SELF'
    isReadOnly = false
  } else if (meta.isLeader && assessment.status === 'LEADER_ASSESSING') {
    mode = 'LEADER'
    isReadOnly = false
  } else {
    // For view mode, show leader view if leader/admin/hr, otherwise self view (or mixed)
    // AssessmentDetail uses 'mode' to decide which score to initialize.
    // In view mode, we might want to see ONE specific view or BOTH.
    // Current AssessmentDetail is designed for action.
    // Let's pass 'SELF' for now as ReadOnly view logic is handled inside.
    // If we want to view Final results, we need to update AssessmentDetail to show Final Scores.
    mode = 'SELF'
    isReadOnly = true
  }

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" className="mb-4 pl-0" asChild>
        <Link to="/">
          <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>

      <AssessmentDetail
        assessment={assessment}
        details={details}
        mode={mode}
        isReadOnly={isReadOnly}
      />
    </div>
  )
}
