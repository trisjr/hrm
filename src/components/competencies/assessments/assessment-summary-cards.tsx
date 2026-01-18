import { Card, CardContent } from '@/components/ui/card'
import {
  IconUser,
  IconUserCheck,
  IconTrophy,
  IconChartBar,
} from '@tabler/icons-react'

interface AssessmentSummaryCardsProps {
  stats: {
    avgSelf: number | null
    avgLeader: number | null
    avgFinal: number | null
    avgGap: number | null
  }
}

export function AssessmentSummaryCards({ stats }: AssessmentSummaryCardsProps) {
  const cards = [
    {
      title: 'Self Assessment',
      value: stats.avgSelf?.toFixed(1) || 'N/A',
      icon: IconUser,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Leader Assessment',
      value: stats.avgLeader?.toFixed(1) || 'N/A',
      icon: IconUserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Final Score',
      value: stats.avgFinal?.toFixed(1) || 'N/A',
      icon: IconTrophy,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Average Gap',
      value: stats.avgGap !== null ? stats.avgGap.toFixed(2) : 'N/A',
      icon: IconChartBar,
      color: stats.avgGap !== null && stats.avgGap >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.avgGap !== null && stats.avgGap >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
