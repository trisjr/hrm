import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getMyAssessmentFn } from '@/server/assessments.server'
import { AssessmentDetail } from '@/components/competencies/assessments/assessment-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle, IconArrowLeft } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/competencies/my-assessment/')({
  component: RouteComponent,
})

function RouteComponent() {
  const token = useAuthStore((state: any) => state.token)

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-assessment'],
    queryFn: () => getMyAssessmentFn({ data: { token: token! } } as any),
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

  if (error) {
     return (
        <div className="container mx-auto py-10 max-w-4xl">
            <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load assessment data. Please try again later.
                </AlertDescription>
            </Alert>
        </div>
     )
  }

  const assessmentData = data?.data

  if (!assessmentData) {
    return (
      <div className="container mx-auto py-20 max-w-2xl text-center">
        <div className="bg-muted/30 p-10 rounded-xl border border-dashed">
            <h2 className="text-2xl font-bold mb-2">No Active Assessment</h2>
            <p className="text-muted-foreground mb-6">
                You don't have any pending competency assessment for the current cycle.
                Contact your HR department if you believe this is a mistake.
            </p>
            <Button variant="outline" asChild>
                <Link to="/">Go Home</Link>
            </Button>
        </div>
      </div>
    )
  }

  const { assessment, details } = assessmentData
  const isSelfAssessment = assessment.status === 'SELF_ASSESSING'
  const isReadOnly = !isSelfAssessment // User can only edit during SELF_ASSESSING

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
            mode="SELF"
            isReadOnly={isReadOnly}
         />
    </div>
  )
}
