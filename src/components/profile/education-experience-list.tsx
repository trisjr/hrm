import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Plus } from 'lucide-react'
import { format } from 'date-fns'

interface EducationExperienceItem {
  id: number
  organizationName: string
  positionMajor: string | null
  startDate: string | null
  endDate: string | null
  description: string | null
  type: 'Education' | 'Experience'
}

interface EducationExperienceListProps {
  items: EducationExperienceItem[]
}

export function EducationExperienceList({
  items,
}: EducationExperienceListProps) {
  const experiences = items.filter((i) => i.type === 'Experience')
  const educations = items.filter((i) => i.type === 'Education')

  const RenderList = ({
    list,
    title,
  }: {
    list: EducationExperienceItem[]
    title: string
  }) => {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/90 hover:bg-primary/10"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Info
          </Button>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              No {title.toLowerCase()} information added.
            </p>
          ) : (
            list.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-base">
                      {item.organizationName}
                    </h4>
                    <p className="text-sm text-muted-foreground font-medium">
                      {item.positionMajor}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {item.startDate
                        ? format(new Date(item.startDate), 'MMM dd, yyyy')
                        : 'N/A'}{' '}
                      -{' '}
                      {item.endDate
                        ? format(new Date(item.endDate), 'MMM dd, yyyy')
                        : 'Present'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
                <Separator className="mt-4 last:hidden" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 bg-card rounded-lg p-6 border">
      <RenderList list={experiences} title="Job information" />
      <Separator />
      <RenderList list={educations} title="Education" />
    </div>
  )
}
