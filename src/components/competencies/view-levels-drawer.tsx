import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CompetencyLevel {
  id: number
  competencyId: number
  levelNumber: number
  behavioralIndicator: string | null
  createdAt: Date | null
}

interface Competency {
  id: number
  groupId: number
  name: string
  description: string | null
  levels?: CompetencyLevel[]
}

interface ViewLevelsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competency: Competency | null
}

export function ViewLevelsDrawer({
  open,
  onOpenChange,
  competency,
}: ViewLevelsDrawerProps) {
  if (!competency) return null

  const sortedLevels = [...(competency.levels || [])].sort(
    (a, b) => a.levelNumber - b.levelNumber,
  )

  const getLevelLabel = (level: number) => {
    const labels = ['Beginner', 'Developing', 'Competent', 'Advanced', 'Expert']
    return labels[level - 1] || `Level ${level}`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{competency.name}</SheetTitle>
          <SheetDescription>
            {competency.description ||
              'View behavioral indicators for each level'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4 px-4">
            {sortedLevels.map((level) => (
              <div
                key={level.id}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    variant={level.levelNumber >= 4 ? 'default' : 'secondary'}
                    className="font-mono"
                  >
                    Level {level.levelNumber}
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    {getLevelLabel(level.levelNumber)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {level.behavioralIndicator || 'No description provided'}
                </p>
              </div>
            ))}

            {sortedLevels.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No levels defined for this competency
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
