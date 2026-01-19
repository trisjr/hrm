import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import {
  getRequirementsMatrixFn,
  setCompetencyRequirementFn,
} from '@/server/competencies.server'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { RequirementsMatrix } from '@/components/competencies/requirements-matrix'

export const Route = createFileRoute('/admin/competencies/requirements/')({
  component: RouteComponent,
})

/**
 * Requirements Matrix Management Page (Admin/HR)
 * Allows setting required competency levels (1-5) for each career band.
 */
function RouteComponent() {
  const token = useAuthStore((state: any) => state.token)

  // Fetch matrix data
  const {
    data: matrixData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['requirements-matrix'],
    queryFn: () => getRequirementsMatrixFn({ data: { token: token! } } as any),
  })

  const handleUpdateRequirement = async (
    careerBandId: number,
    competencyId: number,
    requiredLevel: number | null,
  ) => {
    try {
      await setCompetencyRequirementFn({
        data: {
          token: token!,
          data: { careerBandId, competencyId, requiredLevel },
        },
      } as any)

      // Refetch to get updated data
      await refetch()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update requirement')
      throw error
    }
  }

  const careerBands = matrixData?.data?.careerBands || []
  const groups = matrixData?.data?.groups || []

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
            <BreadcrumbPage>Requirements Matrix</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Competency Requirements Matrix
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set required competency levels for each career band (1-5 scale)
        </p>
      </div>

      {/* Matrix */}
      <RequirementsMatrix
        careerBands={careerBands}
        groups={groups}
        onUpdateRequirement={handleUpdateRequirement}
        isLoading={isLoading}
      />
    </div>
  )
}
