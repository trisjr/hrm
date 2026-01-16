import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { TeamWithStats, UpdateTeamInput } from '@/lib/team.schemas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Schema for the update form (subset of updateTeamSchema)
const editTeamFormSchema = z.object({
  teamName: z
    .string()
    .min(3, 'Team name must be at least 3 characters')
    .max(100, 'Team name must not exceed 100 characters')
    .trim(),
  description: z.string().trim().optional(),
})

type EditTeamFormData = z.infer<typeof editTeamFormSchema>

interface EditTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: TeamWithStats
  onSubmit: (data: UpdateTeamInput['data']) => Promise<void>
}

export function EditTeamDialog({
  open,
  onOpenChange,
  team,
  onSubmit,
}: EditTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<EditTeamFormData>({
    resolver: zodResolver(editTeamFormSchema),
    defaultValues: {
      teamName: team.teamName,
      description: team.description || '',
    },
  })

  // Reset form when team changes
  React.useEffect(() => {
    form.reset({
      teamName: team.teamName,
      description: team.description || '',
    })
  }, [team, form])

  const handleSubmit = async (data: EditTeamFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team information. To change the leader, please use the team
            detail page.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Team Name<span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Engineering Team, Sales Team"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the team's purpose or responsibilities"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Describe what this team does.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
