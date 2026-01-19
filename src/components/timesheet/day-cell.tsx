import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DayCellProps {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isPublicHoliday: boolean
  request?: {
    type: string
    status: string
    reason: string
    startDate: string
    endDate: string
  }
  onClick?: (date: Date) => void
}

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isWeekend,
  isPublicHoliday,
  request,
  onClick,
}: DayCellProps) {
  const dayNumber = format(date, 'd')

  // Determine background color
  let bgColor = 'bg-white dark:bg-gray-900'
  let icon = ''
  let textColor = 'text-gray-900 dark:text-gray-100'

  if (!isCurrentMonth) {
    bgColor = 'bg-gray-50 dark:bg-gray-800/50'
    textColor = 'text-gray-400'
  } else if (isPublicHoliday) {
    bgColor = 'bg-yellow-50 dark:bg-yellow-900/20'
    icon = '🎉'
  } else if (request?.status === 'APPROVED') {
    if (request.type === 'LEAVE') {
      bgColor = 'bg-orange-50 dark:bg-orange-900/20'
      icon = '🌴'
    } else if (request.type === 'WFH') {
      bgColor = 'bg-blue-50 dark:bg-blue-900/20'
      icon = '🏠'
    }
  } else if (isWeekend) {
    bgColor = 'bg-gray-50 dark:bg-gray-800/30'
  }

  const tooltipContent = request
    ? `${request.type === 'LEAVE' ? 'Off' : 'WFH'}: ${request.reason}`
    : isPublicHoliday
      ? 'Public Holiday'
      : null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onClick?.(date)}
            className={cn(
              'aspect-square p-2 rounded-lg border transition-all',
              'hover:shadow-md hover:scale-105',
              'flex flex-col items-center justify-center',
              'relative',
              bgColor,
              isToday && 'ring-2 ring-primary ring-offset-2',
              !isCurrentMonth && 'opacity-40',
            )}
          >
            <span className={cn('text-sm font-medium', textColor)}>
              {dayNumber}
            </span>
            {icon && <span className="text-lg mt-1">{icon}</span>}
            {request?.status === 'PENDING' && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />
            )}
          </button>
        </TooltipTrigger>
        {tooltipContent && (
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
