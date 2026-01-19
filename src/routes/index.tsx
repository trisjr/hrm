/**
 * Dashboard Homepage
 * Displays personalized dashboard based on user role
 */
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getDashboardStatsFn } from '@/server/dashboard.server'
import { useAuthStore } from '@/store/auth.store'
import { 
  Building2, 
  Home, 
  Users, 
  CalendarDays, 
  Briefcase, 
  Award, 
  AlertCircle
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { RequestsWidget } from '@/components/dashboard/requests-widget'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const token = useAuthStore((state: any) => state.token)
  
  const { data: dashboard } = useSuspenseQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStatsFn({ data: { token: token! } }),
  })

  const { user, role, stats, todayStatus, pendingMyRequests, upcomingHolidays, teamStats } = dashboard

  const isLeaderOrAdmin = ['LEADER', 'ADMIN'].includes(role)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Good Morning, {user.fullName.split(' ')[0]}! ☀️
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening today, {format(new Date(), 'EEEE, MMMM do')}.
          </p>
        </div>
        
        {/* Today Status Badge */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
          <span className="text-sm font-medium text-gray-500">Today Status:</span>
          {todayStatus.status === 'OFFICE' ? (
             <Badge className="bg-blue-500 hover:bg-blue-600">OFFICE</Badge>
          ) : todayStatus.status === 'WFH' ? (
             <Badge variant="secondary" className="bg-purple-100 text-purple-700">WFH</Badge>
          ) : (
             <Badge variant="destructive">LEAVE</Badge>
          )}
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Leave Taken (Month)"
          value={`${stats.leaveTakenMonth} days`}
          icon={CalendarDays}
          variant="default"
        />
        <StatCard
          title="WFH Taken (Month)"
          value={`${stats.wfhTakenMonth} days`}
          icon={Home}
          description="Work from home"
        />
        <StatCard
          title="Total Skills"
          value={stats.totalSkills}
          icon={Award}
          trend={stats.totalSkills > 0 ? "Growing!" : "Add skills now"}
        />
        
        {isLeaderOrAdmin && teamStats && (
           <StatCard
             title={role === 'ADMIN' ? 'Total Employees' : 'Team Members'}
             value={teamStats.totalMembers}
             icon={Users}
             description="Active personnel"
           />
        )}
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid mt-2 gap-6 md:grid-cols-7 lg:grid-cols-7">
        
        {/* Left Column (Main) */}
        <div className="md:col-span-4 lg:col-span-5 space-y-6">
           
           {/* Leader View: Team Status */}
           {isLeaderOrAdmin && teamStats && (
             <div className="grid gap-6 md:grid-cols-2">
                {/* Who's Off */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                       <Building2 className="w-5 h-5 text-orange-500" />
                       Who's Absent Today?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamStats.absentToday.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4">Everyone is present!</p>
                    ) : (
                        <div className="space-y-4">
                            {teamStats.absentToday.map((req: any) => (
                                <div key={req.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={req.user.profile?.avatarUrl} />
                                            <AvatarFallback>{req.user.email[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{req.user.profile?.fullName || req.user.email}</p>
                                            <p className="text-xs text-muted-foreground">{req.type}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">
                                        {format(new Date(req.startDate), 'HH:mm')} - {format(new Date(req.endDate), 'HH:mm')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Approvals */}
                <RequestsWidget 
                   title={`Pending Approvals (${teamStats.pendingApprovalsCount})`}
                   requests={teamStats.pendingApprovals}
                   showUser={true}
                   emptyMessage="You're all caught up! No pending requests."
                />
             </div>
           )}

           {/* Personal Requests (All Roles) */}
           <RequestsWidget 
              title="My Recent Requests"
              requests={pendingMyRequests}
              emptyMessage="No pending requests recently."
           />

        </div>

        {/* Right Column (Sidebar) */}
        <div className="md:col-span-3 lg:col-span-2 space-y-6">
           {/* Holidays */}
           <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                   <CalendarDays className="w-5 h-5 text-green-500" />
                   Upcoming Holidays
                </CardTitle>
              </CardHeader>
              <CardContent>
                 {upcomingHolidays.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No holidays coming up soon.</p>
                 ) : (
                    <div className="space-y-4">
                       {upcomingHolidays.map((h: any) => (
                          <div key={h.id} className="flex flex-col bg-accent/50 p-3 rounded-md">
                             <span className="font-semibold text-primary">{h.name}</span>
                             <span className="text-sm text-muted-foreground">
                                {format(new Date(h.date), 'EEEE, MMMM do')}
                             </span>
                          </div>
                       ))}
                    </div>
                 )}
              </CardContent>
           </Card>

           {/* Quick Tip (Static) */}
           <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-none shadow-sm">
              <CardContent className="p-6">
                 <h3 className="font-semibold text-indigo-700 mb-2">💡 Quick Tip</h3>
                 <p className="text-sm text-indigo-600 mb-4">
                    Update your skills regularly to keep your profile competitive!
                 </p>
              </CardContent>
           </Card>
        </div>

      </div>
    </div>
  )
}
