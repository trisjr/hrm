import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Plus, Search } from 'lucide-react'
import { listUsersFn } from '@/server/users.server'
import { UsersTable } from '@/components/user/users-table'
import { CreateUserDialog } from '@/components/user/create-user-dialog'
import { Pagination } from '@/components/common/pagination'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

// Search params validation
const usersSearchSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  search: z.string().optional().default(''),
})

export const Route = createFileRoute('/admin/users/')({
  validateSearch: (search) => usersSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return await listUsersFn({
      data: {
        page: deps.page,
        limit: deps.limit,
        search: deps.search,
      },
    })
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { search } = Route.useSearch()
  const data = Route.useLoaderData()
  const [searchInput, setSearchInput] = React.useState(search)

  const handlePageChange = async (newPage: number) => {
    await navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    })
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await navigate({
      search: (prev) => ({ ...prev, search: searchInput, page: 1 }),
    })
  }

  const handleRefresh = async () => {
    await navigate({
      search: (prev) => ({ ...prev }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage system users and their access permissions
          </p>
        </div>
        <CreateUserDialog onSuccess={handleRefresh}>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </CreateUserDialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search by name, email, or employee code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {/* Users Table */}
      <UsersTable users={data.users as any} />

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {data.users.length} of {data.pagination.total} users
      </div>
    </div>
  )
}
