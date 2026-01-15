import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { listProfileRequestsFn } from '@/server/profile-request.server'
import { useAuthStore } from '@/store/auth.store'
import { ProfileRequestsTable } from '@/components/admin/profile-requests-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'

// Define search params
const profileRequestsSearchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
})

export const Route = createFileRoute('/admin/profile-requests/')({
  validateSearch: profileRequestsSearchSchema,
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: async ({ deps }) => {
    const token = useAuthStore.getState().token

    if (!token) {
      throw redirect({ to: '/login' })
    }

    try {
      const res = await listProfileRequestsFn({
        data: {
          token,
          status: deps.status,
        },
      })
      return { requests: res.requests }
    } catch (error) {
      console.error('Failed to load profile requests', error)
      throw error // Or handle more gracefully
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { requests } = Route.useLoaderData()

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
            <BreadcrumbPage>Profile Requests</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Profile Requests
          </h2>
          <p className="text-muted-foreground">
            Review and manage user profile update requests.
          </p>
        </div>
      </div>

      <ProfileRequestsTable data={requests} />
    </div>
  )
}
