import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import type { UserResponse } from '@/lib/user.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface UsersTableProps {
  users: Array<UserResponse>
  isLoading?: boolean
  className?: string
  onEdit?: (user: UserResponse) => void
  onDelete?: (user: UserResponse) => void
}

const statusVariants: Record<
  UserResponse['status'],
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Active', className: 'bg-green-500/10 text-green-700' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-500/10 text-gray-700' },
  ON_LEAVED: {
    label: 'On Leave',
    className: 'bg-yellow-500/10 text-yellow-700',
  },
  RETIRED: { label: 'Retired', className: 'bg-red-500/10 text-red-700' },
}

export function UsersTable({
  users,
  isLoading,
  className,
  onEdit,
  onDelete,
}: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn('hidden rounded-md border md:block', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead className="hidden xl:table-cell">Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.employeeCode}
                </TableCell>
                <TableCell>{user.profile?.fullName || '-'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {user.phone || '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {/* @ts-ignore - team relation exists */}
                  {user.team?.teamName || '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={statusVariants[user.status].className}
                  >
                    {statusVariants[user.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit?.(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete?.(user)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className={cn('space-y-4 md:hidden', className)}>
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-semibold">{user.profile?.fullName || '-'}</p>
                <p className="text-sm text-muted-foreground">
                  {user.employeeCode}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={statusVariants[user.status].className}
                >
                  {statusVariants[user.status].label}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit?.(user)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onDelete?.(user)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}
              {/* @ts-ignore - team relation exists */}
              {user.team && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team:</span>
                  {/* @ts-ignore */}
                  <span className="font-medium">{user.team.teamName}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
