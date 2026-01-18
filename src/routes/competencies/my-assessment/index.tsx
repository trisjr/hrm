import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getMyAssessmentFn, startMyAssessmentFn } from '@/server/assessments.server'
import { getActiveAssessmentCycleFn } from '@/server/competencies.server'
import { AssessmentDetail } from '@/components/competencies/assessments/assessment-detail'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconAlertCircle, IconArrowLeft, IconPlayerPlay, IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export const Route = createFileRoute('/competencies/my-assessment/')({
  component: RouteComponent,
})

function RouteComponent() {
  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-assessment'],
    queryFn: () => getMyAssessmentFn({ data: { token: token! } } as any),
  })

  // Fetch active cycle if no assessment found
  const { data: activeCycleData } = useQuery({
    queryKey: ['active-assessment-cycle'],
    queryFn: () => getActiveAssessmentCycleFn(),
    enabled: !isLoading && !data?.data, // Only fetch if no assessment
  })

  const startAssessmentMutation = useMutation({
    mutationFn: startMyAssessmentFn,
    onSuccess: () => {
      toast.success('Assessment started successfully')
      queryClient.invalidateQueries({ queryKey: ['my-assessment'] })
      router.invalidate()
    },
    onError: (error: any) => {
      toast.error(`Failed to start assessment: ${error.message}`)
    },
  })

  const handleStartAssessment = (cycleId: number) => {
    console.log('Starting assessment with token:', token)
    if (!token) {
        toast.error('Authentication token missing. Please login again.')
        return
    }
    startAssessmentMutation.mutate({
      data: { token, cycleId },
    } as any)
  }

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

  // ... (Error handling same as before)

  const assessmentData = data?.data
  const activeCycle = activeCycleData?.data

  if (!assessmentData) {
    if (activeCycle) {
      return (
        <div className="container mx-auto py-20 max-w-2xl text-center">
            <div className="bg-card p-10 rounded-xl border shadow-sm">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconPlayerPlay className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Assessment Active: {activeCycle.name}</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    The {activeCycle.name} is currently open. You can start your self-assessment now.
                    Please complete it before {new Date(activeCycle.endDate).toLocaleDateString()}.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" asChild>
                        <Link to="/">Cancel</Link>
                    </Button>
                    <Button 
                        onClick={() => handleStartAssessment(activeCycle.id)}
                        disabled={startAssessmentMutation.isPending}
                    >
                        {startAssessmentMutation.isPending ? 'Starting...' : 'Start Assessment'}
                    </Button>
                </div>
            </div>
        </div>
      )
    }

    // No active cycle and no assessment
    return (
      <div className="container mx-auto py-20 max-w-2xl text-center">
        <div className="bg-muted/30 p-10 rounded-xl border border-dashed flex flex-col items-center">
            <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <IconCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're All Caught Up!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                You have completed all pending assessments. 
                You can review your past performance results in Assessment History.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" asChild>
                    <Link to="/">Dashboard</Link>
                </Button>
                <Button asChild>
                    <Link to="/competencies/assessments">View History</Link>
                </Button>
            </div>
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
