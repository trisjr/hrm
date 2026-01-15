import { Badge } from '@/components/ui/badge'

interface RequestTypeChipProps {
  type: 'LEAVE' | 'WFH' | 'LATE' | 'EARLY' | 'OVERTIME'
  isHalfDay?: boolean
}

export function RequestTypeChip({ type, isHalfDay }: RequestTypeChipProps) {
  const typeConfig = {
    LEAVE: {
      label: 'Leave',
      icon: '🏖️',
      className: 'bg-blue-100 text-blue-800',
    },
    WFH: {
      label: 'WFH',
      icon: '🏠',
      className: 'bg-purple-100 text-purple-800',
    },
    LATE: {
      label: 'Late',
      icon: '⏰',
      className: 'bg-orange-100 text-orange-800',
    },
    EARLY: {
      label: 'Early Leave',
      icon: '🚪',
      className: 'bg-cyan-100 text-cyan-800',
    },
    OVERTIME: {
      label: 'Overtime',
      icon: '💼',
      className: 'bg-indigo-100 text-indigo-800',
    },
  }

  const config = typeConfig[type]
  const label = isHalfDay ? `${config.label} (Half Day)` : config.label

  return (
    <Badge variant="outline" className={config.className}>
      <span className="mr-1">{config.icon}</span>
      {label}
    </Badge>
  )
}
