import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { IconFolderFilled, IconPlus } from '@tabler/icons-react'

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
}

export function CompetencyGroupList({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
}: CompetencyGroupListProps) {
  return (
    <div className="flex h-full flex-col border-r bg-muted/10">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Groups</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCreateGroup}
            className="h-8 w-8 p-0"
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
              'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
              !selectedGroupId && 'bg-accent font-medium',
            )}
          >
            <span>All Competencies</span>
            <Badge variant="secondary" className="ml-2">
              {groups.reduce((sum, g) => sum + g.competencyCount, 0)}
            </Badge>
          </button>

          {/* Individual Groups */}
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                selectedGroupId === group.id && 'bg-accent font-medium',
              )}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <IconFolderFilled className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{group.name}</span>
              </div>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {group.competencyCount}
              </Badge>
            </button>
          ))}

          {groups.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>No groups yet</p>
              <p className="mt-1 text-xs">Click + to create one</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
