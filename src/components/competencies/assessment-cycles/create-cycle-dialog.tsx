import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  createAssessmentCycleFn,
  updateAssessmentCycleFn,
} from '@/server/competencies.server'
import {
  CreateAssessmentCycleInput,
  createAssessmentCycleSchema,
} from '@/lib/competency.schemas'
import { useEffect } from 'react'

interface CreateCycleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycleToEdit?: any
}

export function CreateCycleDialog({
  open,
  onOpenChange,
  cycleToEdit,
}: CreateCycleDialogProps) {
  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()

  const form = useForm<CreateAssessmentCycleInput>({
    resolver: zodResolver(createAssessmentCycleSchema),
    defaultValues: {
      name: '',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  })

  useEffect(() => {
    if (cycleToEdit) {
      form.reset({
        name: cycleToEdit.name,
        startDate: new Date(cycleToEdit.startDate),
        endDate: new Date(cycleToEdit.endDate),
      })
    } else {
      form.reset({
        name: '',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      })
    }
  }, [cycleToEdit, form, open])

  const createMutation = useMutation({
    mutationFn: async (data: CreateAssessmentCycleInput) => {
      await createAssessmentCycleFn({
        data: {
          token: token!,
          data,
        },
      } as any)
    },
    onSuccess: () => {
      toast.success('Assessment cycle created successfully')
      queryClient.invalidateQueries({ queryKey: ['assessment-cycles'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessment cycle')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CreateAssessmentCycleInput) => {
      await updateAssessmentCycleFn({
        data: {
          token: token!,
          data: {
            cycleId: cycleToEdit.id,
            data: {
              name: data.name,
              startDate: data.startDate,
              endDate: data.endDate,
            },
          },
        },
      } as any)
    },
    onSuccess: () => {
      toast.success('Assessment cycle updated successfully')
      queryClient.invalidateQueries({ queryKey: ['assessment-cycles'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assessment cycle')
    },
  })

  const handleSubmit = (data: CreateAssessmentCycleInput) => {
    if (cycleToEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>
            {cycleToEdit ? 'Edit Assessment Cycle' : 'Create Assessment Cycle'}
          </DialogTitle>
          <DialogDescription>
            Defines the period for performance assessments.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cycle Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Q1 2024 Performance Review"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split('T')[0]
                            : field.value
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split('T')[0]
                            : field.value
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Saving...'
                  : cycleToEdit
                    ? 'Update Cycle'
                    : 'Create Cycle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
