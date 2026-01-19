import { Card, CardContent } from '@/components/ui/card'
import { IconHome, IconBeach, IconBriefcase, IconCalendar } from '@tabler/icons-react'

interface TimesheetStatsProps {
  stats: {
    totalWorkingDays: number
    totalOffDays: number
    totalWfhDays: number
    totalPublicHolidays: number
    leaveBalance?: {
      annual: number
      sick: number
      used: number
    }
  }
}

export function TimesheetStats({ stats }: TimesheetStatsProps) {
  const statCards = [
    {
      title: 'WFH Days',
      value: stats.totalWfhDays,
      icon: IconHome,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Off Days',
      value: stats.totalOffDays,
      icon: IconBeach,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: 'Working Days',
      value: stats.totalWorkingDays,
      icon: IconBriefcase,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Leave Balance',
      value: stats.leaveBalance?.annual || 0,
      icon: IconCalendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      subtitle: `${stats.leaveBalance?.used || 0} used`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
