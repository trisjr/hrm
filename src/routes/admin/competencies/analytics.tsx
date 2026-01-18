import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import {
  IconAlertTriangle,
  IconChartBar,
  IconCheck,
  IconLoader2,
  IconUsers,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getGapAnalysisReportFn } from '@/server/assessments.server'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/admin/competencies/analytics')({
  component: RouteComponent,
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
      <AnalyticsContent />
    </Suspense>
  )
}

function AnalyticsContent() {
  const token = useAuthStore((state: any) => state.token)

  const { data } = useSuspenseQuery({
    queryKey: ['gap-analysis-report'],
    queryFn: async () => {
      const result = await getGapAnalysisReportFn({
        data: { token: token! },
      } as any)
      return result.data
    },
  })

  // Safe check for data
  if (!data || !data.summary) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No data available for analysis.
      </div>
    )
  }

  const { summary, byCompetency, byEmployee } = data

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Competency Gap Analysis</h1>
        <p className="text-muted-foreground">
          Organization-wide overview of competency gaps and development needs.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Assessed Employees
              </p>
              <p className="text-3xl font-bold">{summary.totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <IconUsers className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Average Gap
              </p>
              <p
                className={`text-3xl font-bold ${summary.avgGap >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {summary.avgGap > 0 ? '+' : ''}
                {summary.avgGap}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${summary.avgGap >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
            >
              <IconChartBar
                className={`h-6 w-6 ${summary.avgGap >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Meeting Requirements
              </p>
              <p className="text-3xl font-bold text-green-600">
                {summary.meetsRequirementPercent}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <IconCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Needs Development
              </p>
              <p className="text-3xl font-bold text-amber-600">
                {summary.needsDevelopmentPercent}%
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <IconAlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Skill Gaps */}
        <Card>
          <CardHeader>
            <CardTitle>Top Skill Gaps (By Competency)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byCompetency.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.competency.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.employeesBelow} employees below required level
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={item.avgGap >= 0 ? 'outline' : 'destructive'}
                    >
                      Gap: {item.avgGap.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
              {byCompetency.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employees Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle>Development Priority (By Employee)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byEmployee
                .filter((e) => e.criticalGaps.length > 0 || e.avgGap < -0.5)
                .slice(0, 5)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {item.user.profile?.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.criticalGaps.length} critical gaps
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        Avg Gap: {item.avgGap.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              {byEmployee.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Table Link (Placeholder) */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Detailed reports export functionality coming soon.
        </p>
      </div>
    </div>
  )
}
