import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { format } from 'date-fns'
import {
  IconArrowLeft,
  IconDownload,
  IconFileText,
  IconLoader2,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AssessmentSummaryCards } from '@/components/competencies/assessments/assessment-summary-cards'
import { CompetencyRadarChart } from '@/components/competencies/assessments/assessment-radar-chart'
import { GapAnalysisTable } from '@/components/competencies/assessments/gap-analysis-table'
import {
  getAssessmentByIdFn,
  getCompetencyRadarDataFn,
} from '@/server/assessments.server'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/competencies/results/$assessmentId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const assessmentId = parseInt(params.assessmentId)
    if (isNaN(assessmentId)) {
      throw new Error('Invalid assessment ID')
    }
    return { assessmentId }
  },
})

function RouteComponent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AssessmentResultsContent />
    </Suspense>
  )
}

function AssessmentResultsContent() {
  const { assessmentId } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const token = useAuthStore((state: any) => state.token)

  // Fetch assessment data
  const { data: assessmentData } = useSuspenseQuery({
    queryKey: ['assessment', assessmentId.toString()],
    queryFn: async () => {
      const result = await getAssessmentByIdFn({
        data: {
          token: token!,
          params: { assessmentId },
        },
      } as any)
      return result.data
    },
  })

  // Fetch radar chart data
  const { data: radarData } = useSuspenseQuery({
    queryKey: ['radar-chart', assessmentId.toString()],
    queryFn: async () => {
      const result = await getCompetencyRadarDataFn({
        data: {
          token: token!,
          params: { assessmentId },
        },
      } as any)
      return result.data
    },
  })

  if (!assessmentData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Assessment Not Found</h2>
          <Button onClick={() => navigate({ to: '/' })}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const { assessment, details, stats } = assessmentData

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800'
      case 'DISCUSSION':
        return 'bg-blue-100 text-blue-800'
      case 'LEADER_ASSESSING':
        return 'bg-purple-100 text-purple-800'
      case 'SELF_ASSESSING':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/' })}
          className="mb-4"
        >
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assessment Results</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {assessment.user?.profile?.fullName || 'User'}
              </span>
              <span>•</span>
              <span>{assessment.cycle?.name || 'Assessment Cycle'}</span>
              <span>•</span>
              <span>
                {assessment.cycle?.startDate && format(new Date(assessment.cycle.startDate), 'MMM d')} -{' '}
                {assessment.cycle?.endDate && format(new Date(assessment.cycle.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(assessment.status || null)}>
              {assessment.status?.replace(/_/g, ' ') || 'UNKNOWN'}
            </Badge>
            <Button variant="outline" size="sm" disabled>
              <IconDownload className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <AssessmentSummaryCards stats={stats} />

      {/* Radar Chart */}
      <div className="mb-8">
        <CompetencyRadarChart groups={radarData?.groups || []} />
      </div>

      {/* Gap Analysis Table */}
      <div className="mb-8">
        <GapAnalysisTable details={details} />
      </div>

      {/* Feedback Section */}
      {assessment.feedback && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <IconFileText className="h-5 w-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Final Feedback</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assessment.feedback}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/' })}
        >
          Back to Home
        </Button>
        <Button disabled>
          <IconFileText className="h-4 w-4 mr-2" />
          Create IDP (Coming Soon)
        </Button>
      </div>
    </div>
  )
}
