import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { IconSearch } from '@tabler/icons-react'
import { CompetencyGroupList } from '@/components/competencies/competency-group-list'
import { CompetencyTable } from '@/components/competencies/competency-table'
import { CreateGroupDialog } from '@/components/competencies/create-group-dialog'
import { CreateCompetencyDialog } from '@/components/competencies/create-competency-dialog'
import { ViewLevelsDrawer } from '@/components/competencies/view-levels-drawer'
import { DeleteCompetencyDialog } from '@/components/competencies/delete-competency-dialog'
import { DeleteGroupDialog } from '@/components/competencies/delete-group-dialog'
import {
  createCompetencyFn,
  createCompetencyGroupFn,
  deleteCompetencyFn,
  deleteCompetencyGroupFn,
  getCompetenciesFn,
  getCompetencyGroupsFn,
} from '@/server/competencies.server'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/admin/competencies/')({
  component: RouteComponent,
})

/**
 * Main Competency Dictionary Management Page (Admin/HR)
 * Allows managing competency groups, competencies, and their behavioral levels.
 */
function RouteComponent() {
  const token = useAuthStore((state: any) => state.token)
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [createCompetencyOpen, setCreateCompetencyOpen] = useState(false)
  const [viewLevelsOpen, setViewLevelsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] = useState<any>(null)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  const navigate = useNavigate()

  // Fetch groups
  const {
    data: groupsData,
    refetch: refetchGroups,
    isLoading: isGroupsLoading,
  } = useQuery({
    queryKey: ['competency-groups'],
    queryFn: () => getCompetencyGroupsFn({ data: { token: token! } } as any),
  })

  // Fetch competencies
  const {
    data: competenciesData,
    refetch: refetchCompetencies,
    isLoading: isCompetenciesLoading,
  } = useQuery({
    queryKey: ['competencies', selectedGroupId, searchQuery],
    queryFn: () =>
      getCompetenciesFn({
        data: {
          token: token!,
          params: {
            groupId: selectedGroupId,
            search: searchQuery || undefined,
          },
        },
      } as any),
  })

  const groups = groupsData?.data || []
  const competencies = competenciesData?.data || []

  // Handlers
  const handleCreateGroup = async (data: any) => {
    try {
      await createCompetencyGroupFn({ data: { token: token!, data } } as any)
      toast.success('Competency group created successfully')
      await refetchGroups()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group')
      throw error
    }
  }

  const handleCreateCompetency = async (data: any) => {
    try {
      await createCompetencyFn({ data: { token: token!, data } } as any)
      toast.success('Competency created successfully')
      await refetchCompetencies()
      await refetchGroups() // Update counts
    } catch (error: any) {
      toast.error(error.message || 'Failed to create competency')
      throw error
    }
  }

  const handleDeleteCompetency = async () => {
    if (!selectedCompetency) return
    try {
      await deleteCompetencyFn({
        data: { token: token!, data: { competencyId: selectedCompetency.id } },
      } as any)
      toast.success('Competency deleted successfully')
      await refetchCompetencies()
      await refetchGroups() // Update counts
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete competency')
      throw error
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    try {
      await deleteCompetencyGroupFn({
        data: { token: token!, data: { groupId: selectedGroup.id } },
      } as any)
      toast.success('Competency group deleted successfully')
      setSelectedGroupId(undefined)
      await refetchGroups()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group')
      throw error
    }
  }

  const handleViewLevels = (competency: any) => {
    setSelectedCompetency(competency)
    setViewLevelsOpen(true)
  }

  const handleEdit = () => {
    toast.info('Edit functionality coming soon')
  }

  const handleDelete = (competency: any) => {
    setSelectedCompetency(competency)
    setDeleteDialogOpen(true)
  }

  const handleDeleteGroupClick = (group: any) => {
    setSelectedGroup(group)
    setDeleteGroupDialogOpen(true)
  }

  const openMatrix = async () => {
    await navigate({ to: '/admin/competencies/requirements' })
  }

  const openAssessmentCycles = async () => {
    await navigate({ to: '/admin/competencies/cycles' })
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
            <BreadcrumbPage>Competency Dictionary</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Competency Dictionary
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage competencies and behavioral levels
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={openMatrix}
          >
            Requirements Matrix
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={openAssessmentCycles}
          >
            Assessment Cycles
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setCreateCompetencyOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Competency
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden w-64 lg:block">
          <CompetencyGroupList
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            onCreateGroup={() => setCreateGroupOpen(true)}
            onDeleteGroup={handleDeleteGroupClick}
            isLoading={isGroupsLoading}
          />
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden space-y-4">
          {/* Search Bar */}
          <div>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search competencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search competencies"
              />
            </div>
          </div>

          {/* Competencies List */}
          <div className="flex-1 overflow-auto">
            <CompetencyTable
              competencies={competencies}
              onViewLevels={handleViewLevels}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isCompetenciesLoading}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onSubmit={handleCreateGroup}
      />

      <CreateCompetencyDialog
        open={createCompetencyOpen}
        onOpenChange={setCreateCompetencyOpen}
        groups={groups}
        onSubmit={handleCreateCompetency}
      />

      <ViewLevelsDrawer
        open={viewLevelsOpen}
        onOpenChange={setViewLevelsOpen}
        competency={selectedCompetency}
      />

      <DeleteCompetencyDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        competencyName={selectedCompetency?.name || ''}
        onConfirm={handleDeleteCompetency}
      />

      <DeleteGroupDialog
        open={deleteGroupDialogOpen}
        onOpenChange={setDeleteGroupDialogOpen}
        groupName={selectedGroup?.name || ''}
        competencyCount={selectedGroup?.competencyCount || 0}
        onConfirm={handleDeleteGroup}
      />
    </div>
  )
}
