import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconPlus } from '@tabler/icons-react'
import { toast } from 'sonner'
import type {
  CreateTeamInput,
  TeamWithStats,
  UpdateTeamInput,
} from '@/lib/team.schemas'
import {
  createTeamFn,
  deleteTeamFn,
  getTeamsFn,
  updateTeamFn,
} from '@/server/teams.server'
import { useAuthStore } from '@/store/auth.store'
import { TeamsTable } from '@/components/teams/teams-table'
import { CreateTeamDialog } from '@/components/teams/create-team-dialog'
import { EditTeamDialog } from '@/components/teams/edit-team-dialog'
import { DeleteTeamDialog } from '@/components/teams/delete-team-dialog'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export const Route = createFileRoute('/admin/teams/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = useAuthStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [editTeam, setEditTeam] = React.useState<TeamWithStats | null>(null)
  const [deleteTeam, setDeleteTeam] = React.useState<TeamWithStats | null>(null)
  const [teams, setTeams] = React.useState<TeamWithStats[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterHasLeader, setFilterHasLeader] = React.useState<
    boolean | undefined
  >(undefined)

  // Fetch teams
  const fetchTeams = React.useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await getTeamsFn({
        data: {
          token,
          params: {
            page: 1,
            limit: 50,
            search: searchQuery || undefined,
            filterHasLeader,
          },
        },
      })

      setTeams(response.data)
    } catch (error: any) {
      toast.error('Failed to load teams', {
        description: error.message || 'An error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchQuery, filterHasLeader])

  React.useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // Create team
  const handleCreateTeam = async (data: CreateTeamInput) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await createTeamFn({
        data: {
          token,
          data,
        },
      })
      toast.success('Team created successfully')
      setIsCreateDialogOpen(false)
      fetchTeams()
    } catch (error: any) {
      toast.error('Failed to create team', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  // Update team
  const handleUpdateTeam = async (teamId: number, data: UpdateTeamInput['data']) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      await updateTeamFn({
        data: {
          token,
          data: {
            teamId,
            data,
          },
        },
      })
      toast.success('Team updated successfully')
      setEditTeam(null)
      fetchTeams()
    } catch (error: any) {
      toast.error('Failed to update team', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
  }

  // Delete team
  const handleDeleteTeam = async (teamId: number) => {
    if (!token) {
      toast.error('Authentication required')
      return
    }

    try {
      const result = await deleteTeamFn({
        data: {
          token,
          data: { teamId },
        },
      })
      
      if (result.affectedMembers > 0) {
        toast.success(`Team deleted. ${result.affectedMembers} members unassigned.`)
      } else {
        toast.success('Team deleted successfully')
      }
      
      setDeleteTeam(null)
      fetchTeams()
    } catch (error: any) {
      toast.error('Failed to delete team', {
        description: error.message || 'An error occurred',
      })
      throw error
    }
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
            <BreadcrumbPage>Teams</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Organize employees into teams and assign leaders
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <IconPlus className="mr-2 h-4 w-4" />
          New Team
        </Button>
      </div>

      {/* Teams Table */}
      <TeamsTable
        data={teams}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterHasLeader={filterHasLeader}
        onFilterHasLeaderChange={setFilterHasLeader}
        onEdit={setEditTeam}
        onDelete={setDeleteTeam}
      />

      {/* Create Team Dialog */}
      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateTeam}
      />

      {/* Edit Team Dialog */}
      {editTeam && (
        <EditTeamDialog
          open={!!editTeam}
          onOpenChange={(open) => !open && setEditTeam(null)}
          team={editTeam}
          onSubmit={(data) => handleUpdateTeam(editTeam.id, data)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTeam && (
        <DeleteTeamDialog
          open={!!deleteTeam}
          onOpenChange={(open) => !open && setDeleteTeam(null)}
          team={deleteTeam}
          onConfirm={() => handleDeleteTeam(deleteTeam.id)}
        />
      )}
    </div>
  )
}
