import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TimesheetLegend() {
  const legendItems = [
    {
      label: 'Work from Home',
      color: 'bg-blue-50 dark:bg-blue-900/20',
      icon: '🏠',
    },
    {
      label: 'Annual Leave',
      color: 'bg-orange-50 dark:bg-orange-900/20',
      icon: '🌴',
    },
    {
      label: 'Public Holiday',
      color: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: '🎉',
    },
    {
      label: 'Weekend',
      color: 'bg-gray-50 dark:bg-gray-800/30',
      icon: '',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded border flex items-center justify-center ${item.color}`}
              >
                {item.icon && <span className="text-sm">{item.icon}</span>}
              </div>
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
