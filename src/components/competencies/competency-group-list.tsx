import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  IconDotsVertical,
  IconFolderFilled,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'

interface CompetencyGroup {
  id: number
  name: string
  description: string | null
  createdAt: Date | null
  competencyCount: number
}

interface CompetencyGroupListProps {
  groups: CompetencyGroup[]
  selectedGroupId?: number
  onSelectGroup: (groupId: number | undefined) => void
  onCreateGroup: () => void
  onDeleteGroup: (group: CompetencyGroup) => void
}

export function CompetencyGroupList({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
}: CompetencyGroupListProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <h3 className="font-semibold tracking-tight">Groups</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCreateGroup}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Create new competency group"
          >
            <IconPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Groups List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {/* All Groups Option */}
          <button
            onClick={() => onSelectGroup(undefined)}
            className={cn(
              'group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent/50',
              !selectedGroupId
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>All Competencies</span>
            <Badge
              variant="secondary"
              className={cn(
                'ml-2 transition-colors',
                !selectedGroupId && 'bg-background',
              )}
            >
              {groups.reduce((sum, g) => sum + g.competencyCount, 0)}
            </Badge>
          </button>

          {/* Individual Groups */}
          {groups.map((group) => (
            <div
              key={group.id}
              className={cn(
                'group relative flex items-center justify-between rounded-md transition-colors hover:bg-accent/50',
                selectedGroupId === group.id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <button
                onClick={() => onSelectGroup(group.id)}
                className="flex flex-1 items-center justify-between overflow-hidden px-3 py-2 text-left text-sm outline-none"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <IconFolderFilled
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      selectedGroupId === group.id
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span className="truncate font-medium">{group.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'ml-auto h-7 w-7 opacity-0 transition-opacity data-[state=open]:opacity-100 group-hover:opacity-100',
                      )}
                    >
                      <IconDotsVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteGroup(group)
                      }}
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Badge variant="secondary" className="ml-2 shrink-0 bg-background text-foreground">
                  {group.competencyCount}
                </Badge>
              </button>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No groups yet</p>
              <Button
                variant="link"
                className="mt-1 h-auto p-0 text-xs"
                onClick={onCreateGroup}
              >
                Create one
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
