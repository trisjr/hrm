import * as React from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import {
  IconArrowLeft,
  IconChartBar,
  IconClipboardList,
  IconUsers,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import {
  addMemberToTeamFn,
  assignLeaderFn,
  getTeamByIdFn,
  removeMemberFromTeamFn,
} from '@/server/teams.server'
import { useAuthStore } from '@/store/auth.store'
import type { TeamDetail, TeamMember } from '@/lib/team.schemas'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamLeaderCard } from '@/components/teams/team-leader-card'
import { TeamMembersTable } from '@/components/teams/team-members-table'
import { AssignLeaderDialog } from '@/components/teams/assign-leader-dialog'
import { AddMemberDialog } from '@/components/teams/add-member-dialog'
import { RemoveMemberDialog } from '@/components/teams/remove-member-dialog'

export const Route = createFileRoute('/admin/teams/$teamId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { teamId } = Route.useParams()
  const { token } = useAuthStore()
  const router = useRouter()

  const [team, setTeam] = React.useState<TeamDetail | null>(null)
  const [isAssignLeaderOpen, setIsAssignLeaderOpen] = React.useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(
    null,
  )

  // Fetch team details
  const fetchTeam = React.useCallback(async () => {
    if (!token) return

    try {
      const teamData = await getTeamByIdFn({
        data: {
          token,
          params: { teamId: Number(teamId) },
        },
      })

      setTeam(teamData)
    } catch (error: any) {
      toast.error('Failed to load team details', {
        description: error.message || 'An error occurred',
      })
      // Navigate back if team not found
      router.navigate({ to: '/admin/teams' })
    } finally {
    }
  }, [token, teamId, router])

  React.useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  // Assign leader
  const handleAssignLeader = async (leaderId: number | null) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await assignLeaderFn({
        data: {
          token,
          data: {
            teamId: Number(teamId),
            leaderId,
          },
        },
      })

      toast.success(
        leaderId === null
          ? 'Leader removed successfully'
          : 'Leader assigned successfully. User role updated to LEADER.',
      )
      setIsAssignLeaderOpen(false)
      fetchTeam()
    } catch (error: any) {
      toast.error('Failed to assign leader', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  // Add member
  const handleAddMember = async (userId: number) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await addMemberToTeamFn({
        data: {
          token,
          data: {
            teamId: Number(teamId),
            userId,
          },
        },
      })

      toast.success('Member added successfully')
      fetchTeam()
    } catch (error: any) {
      toast.error('Failed to add member', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  // Remove member
  const handleRemoveMember = async (userId: number) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await removeMemberFromTeamFn({
        data: {
          token,
          data: {
            teamId: Number(teamId),
            userId,
          },
        },
      })

      toast.success('Member removed successfully')
      setMemberToRemove(null)
      fetchTeam()
    } catch (error: any) {
      toast.error('Failed to remove member', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leader Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Members Table Skeleton */}
        <div className="rounded-md border p-4 space-y-4">
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link
              to="/admin"
              className="hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link
              to="/admin/teams"
              className="hover:text-foreground transition-colors"
            >
              Teams
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{team.teamName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.navigate({ to: '/admin/teams' })}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {team.teamName}
            </h1>
            {team.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {team.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.stats.totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Requests
            </CardTitle>
            <IconClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.stats.activeRequests}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Attendance (30d)
            </CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.stats.avgAttendance !== null
                ? `${team.stats.avgAttendance.toFixed(1)}%`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leader Card */}
      <TeamLeaderCard
        leader={team.leader}
        onAssignLeader={() => setIsAssignLeaderOpen(true)}
      />

      {/* Members Table */}
      <TeamMembersTable
        members={team.members}
        currentLeaderId={team.leaderId}
        onAddMember={() => setIsAddMemberOpen(true)}
        onRemoveMember={setMemberToRemove}
      />

      {/* Assign Leader Dialog */}
      <AssignLeaderDialog
        open={isAssignLeaderOpen}
        onOpenChange={setIsAssignLeaderOpen}
        teamId={Number(teamId)}
        currentLeaderId={team.leaderId}
        members={team.members}
        onSubmit={handleAssignLeader}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        teamId={Number(teamId)}
        currentMembers={team.members}
        onSubmit={handleAddMember}
      />

      {/* Remove Member Dialog */}
      {memberToRemove && (
        <RemoveMemberDialog
          open={!!memberToRemove}
          onOpenChange={(open) => !open && setMemberToRemove(null)}
          member={memberToRemove}
          isLeader={memberToRemove.id === team.leaderId}
          onConfirm={() => handleRemoveMember(memberToRemove.id)}
        />
      )}
    </div>
  )
}
