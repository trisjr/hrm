import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  IconDots,
  IconEdit,
  IconFilter,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import type { TeamWithStats } from '@/lib/team.schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TeamsTableProps {
  data: TeamWithStats[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  filterHasLeader?: boolean
  onFilterHasLeaderChange: (value: boolean | undefined) => void
  onEdit: (team: TeamWithStats) => void
  onDelete: (team: TeamWithStats) => void
}

export function TeamsTable({
  data,
  isLoading,
  searchQuery,
  onSearchChange,
  filterHasLeader,
  onFilterHasLeaderChange,
  onEdit,
  onDelete,
}: TeamsTableProps) {
  // Debounced search
  const [localSearch, setLocalSearch] = React.useState(searchQuery)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <IconFilter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={
              filterHasLeader === undefined
                ? 'all'
                : filterHasLeader
                  ? 'with-leader'
                  : 'without-leader'
            }
            onValueChange={(value) =>
              onFilterHasLeaderChange(
                value === 'all' ? undefined : value === 'with-leader',
              )
            }
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filter by leader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="with-leader">With Leader</SelectItem>
              <SelectItem value="without-leader">Without Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Leader</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <div className="flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No teams found. Create your first team to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div>
                      <Link
                        to="/admin/teams/$teamId"
                        params={{ teamId: team.id.toString() }}
                        className="hover:underline hover:text-primary"
                      >
                        {team.teamName}
                      </Link>
                      {team.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {team.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.leader ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={team.leader.avatarUrl || undefined}
                          />
                          <AvatarFallback>
                            {team.leader.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {team.leader.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {team.leader.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">No Leader</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{team.memberCount}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(team.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(team)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(team)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No teams found. Create your first team to get started.
            </CardContent>
          </Card>
        ) : (
          data.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      to="/admin/teams/$teamId"
                      params={{ teamId: team.id.toString() }}
                      className="hover:underline hover:text-primary"
                    >
                      {team.teamName}
                    </Link>
                    {team.description && (
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2">
                          <span className="sr-only">Open menu</span>
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(team)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(team)}
                          className="text-destructive focus:text-destructive"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Leader
                  </div>
                  {team.leader ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={team.leader.avatarUrl || undefined} />
                        <AvatarFallback>
                          {team.leader.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {team.leader.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {team.leader.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline">No Leader</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <Badge variant="secondary">{team.memberCount}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {format(new Date(team.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
