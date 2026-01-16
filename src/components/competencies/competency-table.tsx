import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconTrash,
} from '@tabler/icons-react'

interface CompetencyLevel {
  id: number
  competencyId: number
  levelNumber: number
  behavioralIndicator: string | null
  createdAt: Date | null
}

interface CompetencyGroup {
  id: number
  name: string
  description: string | null
}

interface Competency {
  id: number
  groupId: number
  name: string
  description: string | null
  createdAt: Date | null
  group?: CompetencyGroup
  levels?: CompetencyLevel[]
}

interface CompetencyTableProps {
  competencies: Competency[]
  onViewLevels: (competency: Competency) => void
  onEdit: (competency: Competency) => void
  onDelete: (competency: Competency) => void
}

export function CompetencyTable({
  competencies,
  onViewLevels,
  onEdit,
  onDelete,
}: CompetencyTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competency Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20 text-center">Levels</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="text-sm text-muted-foreground">
                      <p>No competencies found</p>
                      <p className="mt-1 text-xs">
                        Create a new competency to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                competencies.map((competency) => (
                  <TableRow key={competency.id}>
                    <TableCell className="font-medium">
                      {competency.name}
                    </TableCell>
                    <TableCell>
                      {competency.group && (
                        <Badge variant="outline">{competency.group.name}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                      {competency.description || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {competency.levels?.length || 0}/5
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Open menu"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onViewLevels(competency)}
                          >
                            <IconEye className="mr-2 h-4 w-4" />
                            View Levels
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(competency)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(competency)}
                            className="text-destructive focus:text-destructive"
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
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
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {competencies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-sm text-muted-foreground">
                <p>No competencies found</p>
                <p className="mt-1 text-xs">
                  Create a new competency to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          competencies.map((competency) => (
            <Card key={competency.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-medium">{competency.name}</h4>
                      {competency.group && (
                        <Badge variant="outline" className="mt-1">
                          {competency.group.name}
                        </Badge>
                      )}
                    </div>
                    {competency.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {competency.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Levels:
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {competency.levels?.length || 0}/5
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label="Open menu"
                      >
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewLevels(competency)}>
                        <IconEye className="mr-2 h-4 w-4" />
                        View Levels
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(competency)}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(competency)}
                        className="text-destructive focus:text-destructive"
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
