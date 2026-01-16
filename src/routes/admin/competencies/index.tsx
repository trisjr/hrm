import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { CompetencyGroupList } from '@/components/competencies/competency-group-list'
import { CompetencyTable } from '@/components/competencies/competency-table'
import { CreateGroupDialog } from '@/components/competencies/create-group-dialog'
import { CreateCompetencyDialog } from '@/components/competencies/create-competency-dialog'
import { ViewLevelsDrawer } from '@/components/competencies/view-levels-drawer'
import { DeleteCompetencyDialog } from '@/components/competencies/delete-competency-dialog'
import {
  createCompetencyFn,
  createCompetencyGroupFn,
  deleteCompetencyFn,
  getCompetenciesFn,
  getCompetencyGroupsFn,
} from '@/server/competencies.server'

export const Route = createFileRoute('/admin/competencies/')({
  component: CompetenciesPage,
})

function CompetenciesPage() {
  const token = useAuthStore((state: any) => state.token)
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [createCompetencyOpen, setCreateCompetencyOpen] = useState(false)
  const [viewLevelsOpen, setViewLevelsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] = useState<any>(null)

  // Fetch groups
  const { data: groupsData, refetch: refetchGroups } = useSuspenseQuery({
    queryKey: ['competency-groups'],
    queryFn: () => getCompetencyGroupsFn({ data: { token: token! } } as any),
  })

  // Fetch competencies
  const { data: competenciesData, refetch: refetchCompetencies } =
    useSuspenseQuery({
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
      refetchGroups()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group')
      throw error
    }
  }

  const handleCreateCompetency = async (data: any) => {
    try {
      await createCompetencyFn({ data: { token: token!, data } } as any)
      toast.success('Competency created successfully')
      refetchCompetencies()
      refetchGroups() // Update counts
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
      refetchCompetencies()
      refetchGroups() // Update counts
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete competency')
      throw error
    }
  }

  const handleViewLevels = (competency: any) => {
    setSelectedCompetency(competency)
    setViewLevelsOpen(true)
  }

  const handleEdit = () => {
    // TODO: Implement edit dialog
    toast.info('Edit functionality coming soon')
  }

  const handleDelete = (competency: any) => {
    setSelectedCompetency(competency)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Competency Dictionary
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage competencies and behavioral levels
            </p>
          </div>
          <Button onClick={() => setCreateCompetencyOpen(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            New Competency
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden w-64 border-r lg:block">
          <CompetencyGroupList
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            onCreateGroup={() => setCreateGroupOpen(true)}
          />
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="border-b p-4">
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
          <div className="flex-1 overflow-auto p-4">
            <CompetencyTable
              competencies={competencies}
              onViewLevels={handleViewLevels}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
    </div>
  )
}
