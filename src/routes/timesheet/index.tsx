import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { getTimesheetDataFn, getPublicHolidaysFn } from '@/server/timesheet.server'
import { TimesheetCalendar } from '@/components/timesheet/timesheet-calendar'
import { TimesheetStats } from '@/components/timesheet/timesheet-stats'
import { TimesheetLegend } from '@/components/timesheet/timesheet-legend'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
} from '@tabler/icons-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/timesheet/')({
  component: TimesheetPage,
  errorComponent: ({ error }) => (
    <div className="p-4 text-red-500">
      <h2 className="text-lg font-bold">Error loading timesheet</h2>
      <pre>{error.message}</pre>
    </div>
  ),
  pendingComponent: () => (
    <div className="flex items-center justify-center p-8">
      <span className="text-muted-foreground">Loading timesheet...</span>
    </div>
  ),
})

function TimesheetPage() {
  const token = useAuthStore((state: any) => state.token)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  console.log('Rendering TimesheetPage', { currentMonth, currentYear, token })

  // Fetch timesheet data
  const { data: timesheetData } = useSuspenseQuery({
    queryKey: ['timesheet', currentMonth, currentYear],
    queryFn: async () => {
      console.log('Fetching timesheet data...')
      const res = await getTimesheetDataFn({
        data: {
          token: token!,
          params: {
            month: currentMonth,
            year: currentYear,
          },
        },
      } as any)
      console.log('Timesheet response:', res)
      return res
    },
  })

  // Fetch public holidays
  const { data: holidaysData } = useSuspenseQuery({
    queryKey: ['public-holidays', currentYear],
    queryFn: () =>
      getPublicHolidaysFn({
        data: { year: currentYear },
      } as any),
  })

  const timesheet = timesheetData?.data
  const holidays = holidaysData?.data || []

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export timesheet')
  }

  const monthName = format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy')

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Timesheet</h1>
          <p className="text-muted-foreground">
            Track your work schedule and leave days
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <IconDownload className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      {timesheet && <TimesheetStats stats={timesheet.stats} />}

      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timesheet && (
            <TimesheetCalendar
              month={currentMonth}
              year={currentYear}
              requests={timesheet.requests}
              publicHolidays={holidays}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <TimesheetLegend />
    </div>
  )
}
