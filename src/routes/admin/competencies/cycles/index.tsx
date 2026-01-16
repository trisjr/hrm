import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import {
  getAssessmentCyclesFn,
  deleteAssessmentCycleFn,
} from '@/server/competencies.server'
import { assignUsersToCycleFn } from '@/server/assessments.server'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Plus } from 'lucide-react'
import { CreateCycleDialog } from '@/components/competencies/assessment-cycles/create-cycle-dialog'
import { CycleList } from '@/components/competencies/assessment-cycles/cycle-list'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/admin/competencies/cycles/')({
  component: RouteComponent,
})

function RouteComponent() {
  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [heroCycle, setHeroCycle] = useState<any>(null)

  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['assessment-cycles'],
    queryFn: () => getAssessmentCyclesFn({ data: { token: token! } } as any),
  })

  // ... (deleteMutation) ...
  const deleteMutation = useMutation({
    mutationFn: async (cycleId: number) => {
      await deleteAssessmentCycleFn({
        data: {
          token: token!,
          data: { cycleId },
        },
      } as any)
    },
    onSuccess: () => {
      toast.success('Assessment cycle deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['assessment-cycles'] })
      setDeleteDialogOpen(false)
      setHeroCycle(null)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assessment cycle')
    },
  })
  
  const assignMutation = useMutation({
    mutationFn: async (cycleId: number) => {
        return await assignUsersToCycleFn({
            data: { token: token!, cycleId }
        } as any)
    },
    onSuccess: (data: any) => {
        if (data.count === 0) {
            toast.info(data.message)
        } else {
            toast.success(data.message)
        }
    },
    onError: (error: any) => {
        toast.error(`Failed to assign users: ${error.message}`)
    }
  })

  const handleEdit = (cycle: any) => {
    setHeroCycle(cycle)
    setCreateDialogOpen(true)
  }

  const handleDeleteCallback = (cycle: any) => {
    setHeroCycle(cycle)
    setDeleteDialogOpen(true)
  }
  
  const handleAssignCallback = (cycle: any) => {
      if (confirm(`Are you sure you want to assign assessments to all eligible users for "${cycle.name}"?`)) {
          assignMutation.mutate(cycle.id)
      }
  }

  const handleCreateOpenChange = (open: boolean) => {
    setCreateDialogOpen(open)
    if (!open) setHeroCycle(null)
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
              to="/admin/competencies"
              className="hover:text-foreground transition-colors"
            >
              Competency Dictionary
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Assessment Cycles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Assessment Cycles
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage performance review periods and timelines
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Cycle
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <CycleList
          cycles={cyclesData?.data || []}
          onEdit={handleEdit}
          onDelete={handleDeleteCallback}
          onAssign={handleAssignCallback}
        />
      )}

      {/* Dialogs */}
      <CreateCycleDialog
        open={createDialogOpen}
        onOpenChange={handleCreateOpenChange}
        cycleToEdit={heroCycle}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              assessment cycle "{heroCycle?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => heroCycle && deleteMutation.mutate(heroCycle.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
