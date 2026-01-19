import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, isSameMonth } from 'date-fns'
import { DayCell } from './day-cell'

interface TimesheetCalendarProps {
  month: number
  year: number
  requests: any[]
  publicHolidays: any[]
}

export function TimesheetCalendar({
  month,
  year,
  requests,
  publicHolidays,
}: TimesheetCalendarProps) {
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))

  // Get all days in month
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  })

  // Pad start to align with Monday (or Sunday depending on locale)
  const startDayOfWeek = monthStart.getDay()
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 // Monday = 0 padding

  // Create calendar grid (6 weeks max)
  const calendarDays: (Date | null)[] = [
    ...Array(paddingDays).fill(null),
    ...daysInMonth,
  ]

  // Pad end to complete the grid
  while (calendarDays.length < 42) {
    calendarDays.push(null)
  }

  // Helper: Find request for a specific date
  const getRequestForDate = (date: Date) => {
    return requests.find((req) => {
      const start = new Date(req.startDate)
      const end = new Date(req.endDate)
      return date >= start && date <= end
    })
  }

  // Helper: Check if date is public holiday
  const isPublicHoliday = (date: Date) => {
    return publicHolidays.some((h) =>
      isSameDay(new Date(h.date), date),
    )
  }

  const today = new Date()

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const request = getRequestForDate(day)
          const isHoliday = isPublicHoliday(day)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, monthStart)

          return (
            <DayCell
              key={day.toISOString()}
              date={day}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isWeekend={isWeekend(day)}
              isPublicHoliday={isHoliday}
              request={request}
            />
          )
        })}
      </div>
    </div>
  )
}
