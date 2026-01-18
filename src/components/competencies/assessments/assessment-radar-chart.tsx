import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface CompetencyRadarChartProps {
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

export function CompetencyRadarChart({ groups }: CompetencyRadarChartProps) {
  // Transform data for radar chart
  const chartData = groups.map((group) => ({
    group: group.name,
    'Final Score': Number(group.avgFinalScore.toFixed(2)),
    'Required Level': Number(group.avgRequiredLevel.toFixed(2)),
  }))

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Competency Radar Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No data available for radar chart
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competency Overview by Group</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visual comparison of final scores vs required levels across competency groups
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="group"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <Radar
              name="Final Score"
              dataKey="Final Score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Radar
              name="Required Level"
              dataKey="Required Level"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: number) => value.toFixed(2)}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
