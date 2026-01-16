import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { getMyActiveIDPFn, updateActivityStatusFn } from '@/server/idp.server'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconArrowLeft, IconCheck, IconPlus, IconClock } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/competencies/idp/')({
  component: RouteComponent,
})

function RouteComponent() {
  const token = useAuthStore((state: any) => state.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['my-active-idp'],
    queryFn: () => getMyActiveIDPFn({ data: { token: token! } } as any),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ activityId, status }: { activityId: number, status: 'DONE' | 'PENDING' }) => {
      await updateActivityStatusFn({ 
        data: { 
            token: token!, 
            data: { 
                activityId, 
                status, 
                result: status === 'DONE' ? 'Marked done by user' : undefined 
            } 
        } 
      } as any)
    },
    onSuccess: () => {
      toast.success('Activity updated')
      queryClient.invalidateQueries({ queryKey: ['my-active-idp'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update activity')
    },
  })

  if (isLoading) {
    return <div className="container py-10"><Skeleton className="h-64 w-full" /></div>
  }

  const idpData = data?.data
  const idp = idpData?.idp
  const activities = idpData?.activities || []

  if (!idp) {
    return (
       <div className="container mx-auto py-20 max-w-2xl text-center">
        <div className="bg-muted/30 p-10 rounded-xl border border-dashed">
            <h2 className="text-2xl font-bold mb-2">No Active Development Plan</h2>
            <p className="text-muted-foreground mb-6">
                You haven't created a development plan yet. Start by reviewing your assessment results.
            </p>
            <Button asChild>
                <Link to="/competencies/my-assessment">Go to Assessments</Link>
            </Button>
            <div className="mt-4">
                 <Button variant="link" onClick={() => navigate({ to: '/competencies/idp/create' })}>
                    Create IDP without Assessment
                </Button>
            </div>
        </div>
      </div>
    )
  }

  const completedActivities = activities.filter((a: any) => a.status === 'DONE').length
  const progress = Math.round((completedActivities / activities.length) * 100)

  return (
    <div className="container mx-auto py-8 max-w-5xl">
       {/* Header */}
       <div className="flex items-center justify-between mb-8">
            <div>
                <Button variant="ghost" className="mb-2 pl-0" asChild>
                    <Link to="/competencies/my-assessment">
                        <IconArrowLeft className="mr-2 h-4 w-4" /> Back to Assessments
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">My Development Plan</h1>
                <p className="text-muted-foreground">
                    {new Date(idp.startDate).toLocaleDateString()} - {new Date(idp.endDate).toLocaleDateString()}
                </p>
            </div>
            <div className="text-right">
                <div className="text-2xl font-bold text-primary">{progress}%</div>
                <div className="text-sm text-muted-foreground">Completed</div>
            </div>
       </div>

       {/* Goal */}
       <Card className="mb-8 border-primary/20 bg-primary/5">
         <CardHeader>
            <CardTitle>Development Goal</CardTitle>
         </CardHeader>
         <CardContent>
            <p className="text-lg leading-relaxed">{idp.goal}</p>
         </CardContent>
       </Card>

       {/* Activities */}
       <h2 className="text-xl font-semibold mb-4">Activities</h2>
       <div className="grid gap-4">
            {activities.map((activity: any) => (
                <Card key={activity.id} className={cn("transition-all", activity.status === 'DONE' ? "opacity-75 bg-muted/50" : "hover:border-primary/50")}>
                    <CardContent className="p-6 flex items-start gap-4">
                        <div className="mt-1">
                            <Button
                                variant={activity.status === 'DONE' ? "default" : "outline"}
                                size="icon"
                                className={cn("rounded-full h-8 w-8", activity.status === 'DONE' ? "bg-green-600 hover:bg-green-700" : "")}
                                onClick={() => updateStatusMutation.mutate({ 
                                    activityId: activity.id, 
                                    status: activity.status === 'DONE' ? 'PENDING' : 'DONE' 
                                })}
                                disabled={updateStatusMutation.isPending}
                            >
                                <IconCheck className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={cn("font-medium text-lg", activity.status === 'DONE' ? "line-through text-muted-foreground" : "")}>
                                    {activity.description}
                                </h3>
                                <Badge variant="outline">{activity.activityType}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center bg-muted px-2 py-1 rounded">
                                    Target: {activity.competency.name}
                                </span>
                                {activity.dueDate && (
                                    <span className={cn("flex items-center", new Date(activity.dueDate) < new Date() && activity.status !== 'DONE' ? "text-red-500 font-medium" : "")}>
                                        <IconClock className="mr-1 h-3 w-3" />
                                        Due: {new Date(activity.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
       </div>
    </div>
  )
}
