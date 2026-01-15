import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'
import { MoreHorizontal, Pencil, Plus, Trash } from 'lucide-react'
import { toast } from 'sonner'

import type { CreateEducationExperienceInput } from '@/lib/profile.schemas'
import { EducationExperienceDialog } from '@/components/profile/education-experience-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/auth.store'
import {
  createEducationExperienceFn,
  deleteEducationExperienceFn,
  updateEducationExperienceFn,
} from '@/server/profile.server'

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
  items: Array<EducationExperienceItem>
}

export function EducationExperienceList({
  items,
}: EducationExperienceListProps) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token) || ''
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'Education' | 'Experience'>(
    'Experience',
  )
  const [editingItem, setEditingItem] = useState<
    EducationExperienceItem | undefined
  >(undefined)

  const experiences = items.filter((i) => i.type === 'Experience')
  const educations = items.filter((i) => i.type === 'Education')

  const handleAdd = (type: 'Education' | 'Experience') => {
    setDialogType(type)
    setEditingItem(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (item: EducationExperienceItem) => {
    setDialogType(item.type)
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteEducationExperienceFn({
          data: { token, id },
        })
        toast.success('Item deleted successfully')
        router.invalidate()
      } catch (error) {
        console.error('Delete failed', error)
        toast.error('Failed to delete item')
      }
    }
  }

  const handleSubmit = async (data: CreateEducationExperienceInput) => {
    try {
      if (editingItem) {
        await updateEducationExperienceFn({
          data: {
            token,
            id: editingItem.id,
            data: data,
          },
        })
        toast.success('Item updated successfully')
      } else {
        await createEducationExperienceFn({
          data: {
            token,
            data: data,
          },
        })
        toast.success('Item created successfully')
      }
      router.invalidate()
      setDialogOpen(false)
    } catch (error) {
      console.error('Save failed', error)
      toast.error('Failed to save item')
    }
  }

  const RenderList = ({
    list,
    title,
    type,
  }: {
    list: Array<EducationExperienceItem>
    title: string
    type: 'Education' | 'Experience'
  }) => {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/90 hover:bg-primary/10"
            onClick={() => handleAdd(type)}
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-base">
                      {item.organizationName}
                      {item.positionMajor && (
                        <span className="text-sm text-muted-foreground font-medium">
                          {` - ${item.positionMajor}`}
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto text-sm text-muted-foreground mt-1 sm:mt-0">
                    <span>
                      {item.startDate
                        ? format(new Date(item.startDate), 'MMM dd, yyyy')
                        : 'N/A'}{' '}
                      -{' '}
                      {item.endDate
                        ? format(new Date(item.endDate), 'MMM dd, yyyy')
                        : 'Present'}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    <>
      <div className="bg-card rounded-lg px-4 sm:px-6 border shadow-sm">
        <RenderList
          list={experiences}
          title="Job information"
          type="Experience"
        />
        <Separator />
        <RenderList list={educations} title="Education" type="Education" />
      </div>

      <EducationExperienceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        initialData={
          editingItem
            ? {
                ...editingItem,
                startDate: editingItem.startDate || '',
                endDate: editingItem.endDate || '',
                description: editingItem.description || '',
                positionMajor: editingItem.positionMajor || '',
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </>
  )
}
