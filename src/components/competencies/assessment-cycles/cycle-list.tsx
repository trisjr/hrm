import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  IconCalendarEvent,
  IconDots,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface AssessmentCycle {
  id: number
  name: string
  startDate: string | Date
  endDate: string | Date
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | null
}

interface CycleListProps {
  cycles: AssessmentCycle[]
  onEdit: (cycle: AssessmentCycle) => void
  onDelete: (cycle: AssessmentCycle) => void
}

export function CycleList({ cycles, onEdit, onDelete }: CycleListProps) {
  if (cycles.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <IconCalendarEvent className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No assessment cycles</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first assessment cycle to start evaluating performance.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100/80'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100/80'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100/80'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cycles.map((cycle) => (
        <Card key={cycle.id} className="relative overflow-hidden transition-all hover:shadow-md">
          <div className={cn(
            "absolute top-0 left-0 w-1 h-full",
            cycle.status === 'ACTIVE' ? "bg-green-500" : 
            cycle.status === 'COMPLETED' ? "bg-blue-500" : "bg-gray-300"
          )} />
          
          <CardHeader className="pb-2 pl-6">
            <div className="flex justify-between items-start">
              <Badge variant="secondary" className={cn("mb-2", getStatusColor(cycle.status))}>
                {cycle.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <IconDots className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(cycle)}>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(cycle)}
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete Cycle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-xl line-clamp-1" title={cycle.name}>
              {cycle.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pl-6 pb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <IconCalendarEvent className="mr-2 h-4 w-4" />
              <span>
                {format(new Date(cycle.startDate), 'MMM d, yyyy')} -{' '}
                {format(new Date(cycle.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </CardContent>
          
          {cycle.status === 'ACTIVE' && (
             <CardFooter className="bg-muted/30 pt-3 pb-3 pl-6">
               <p className="text-xs text-muted-foreground w-full text-center font-medium">
                 Current Active Cycle
               </p>
             </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
