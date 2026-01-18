import { AssessmentSummaryCards } from './assessment-summary-cards'
import { CompetencyRadarChart } from './assessment-radar-chart'
import { GapAnalysisTable } from './gap-analysis-table'
import { Card, CardContent } from '@/components/ui/card'
import { IconFileText } from '@tabler/icons-react'

interface AssessmentResultsViewProps {
  assessment: any
  details: any[]
  stats: {
    avgSelf: number | null
    avgLeader: number | null
    avgFinal: number | null
    avgGap: number | null
  }
  radarData?: {
    groups: Array<{
      name: string
      avgFinalScore: number
      avgRequiredLevel: number
      competencies: Array<{
        name: string
        finalScore: number
        requiredLevel: number
        gap: number
      }>
    }>
  }
}

export function AssessmentResultsView({
  assessment,
  details,
  stats,
  radarData,
}: AssessmentResultsViewProps) {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <AssessmentSummaryCards stats={stats} />

      {/* Radar Chart */}
      {radarData && radarData.groups.length > 0 && (
        <CompetencyRadarChart groups={radarData.groups} />
      )}

      {/* Gap Analysis Table */}
      <GapAnalysisTable details={details} />

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
    </div>
  )
}
