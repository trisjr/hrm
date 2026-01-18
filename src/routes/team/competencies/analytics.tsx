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
import { getTeamGapAnalysisFn, getTeamRadarDataFn } from '@/server/assessments.server'
import { useAuthStore } from '@/store/auth.store'
import { CompetencyRadarChart } from '@/components/competencies/assessments/assessment-radar-chart'

export const Route = createFileRoute('/team/competencies/analytics')({
  component: TeamAnalyticsPage,
})

function TeamAnalyticsContent() {
  const { token } = useAuthStore()

  const { data: gapData } = useSuspenseQuery({
    queryKey: ['team-gap-analysis'],
    queryFn: async () => {
      if (!token) throw new Error('No token')
      const result = await getTeamGapAnalysisFn({
        data: { token },
      } as any)
      return result.data
    },
  })

  const { data: radarData } = useSuspenseQuery({
    queryKey: ['team-radar-data'],
    queryFn: async () => {
      if (!token) throw new Error('No token')
      const result = await getTeamRadarDataFn({
        data: { token },
      } as any)
      return result.data
    },
  })

  const { summary, byCompetency, byEmployee } = gapData

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Competency Analytics</h1>
          <p className="text-muted-foreground">
            Overview of your team's competency performance
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Completed assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.avgGap >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {summary.avgGap > 0 ? '+' : ''}
              {summary.avgGap.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Team average vs requirement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meets Requirements
            </CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.meetsRequirementPercent}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of competencies meet or exceed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Development
            </CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.needsDevelopmentPercent}%
            </div>
            <p className="text-xs text-muted-foreground">
              Require improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      {radarData.groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Competency Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <CompetencyRadarChart groups={radarData.groups} />
          </CardContent>
        </Card>
      )}

      {/* Top Priority Competencies */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Priority Competencies</CardTitle>
            <p className="text-sm text-muted-foreground">
              Competencies with largest gaps (lowest first)
            </p>
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
                      {item.employeesBelowRequirement} member(s) below
                      requirement
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members Needing Support</CardTitle>
            <p className="text-sm text-muted-foreground">
              Members with critical skill gaps
            </p>
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
              {byEmployee.filter(
                (e) => e.criticalGaps.length > 0 || e.avgGap < -0.5,
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Great! No team members with critical gaps.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Team Members Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byEmployee.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {item.user.profile?.fullName || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {item.totalCompetencies} competencies
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.criticalGaps.length} critical
                    </p>
                  </div>
                  <Badge
                    variant={item.avgGap >= 0 ? 'outline' : 'destructive'}
                    className="min-w-[100px] justify-center"
                  >
                    Avg: {item.avgGap.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TeamAnalyticsContent />
    </Suspense>
  )
}
