import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { IconLoader2 } from '@tabler/icons-react'
import type { CreateEducationExperienceInput } from '@/lib/profile.schemas'
import { createEducationExperienceSchema } from '@/lib/profile.schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/common/date-picker'

interface EducationExperienceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'Education' | 'Experience'
  initialData?: CreateEducationExperienceInput & { id?: number }
  onSubmit: (data: CreateEducationExperienceInput) => Promise<void>
}

export function EducationExperienceDialog({
  open,
  onOpenChange,
  type,
  initialData,
  onSubmit,
}: EducationExperienceDialogProps) {
  const form = useForm<CreateEducationExperienceInput>({
    resolver: zodResolver(createEducationExperienceSchema),
    defaultValues: {
      type: type,
      organizationName: '',
      positionMajor: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        type: type,
        organizationName: initialData?.organizationName || '',
        positionMajor: initialData?.positionMajor || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        description: initialData?.description || '',
      })
    }
  }, [open, initialData, type, form])

  const handleSubmit = async (data: CreateEducationExperienceInput) => {
    await onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  const isEditing = !!initialData?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit' : 'Add'} {type}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update your ${type.toLowerCase()} details here.`
              : `Add new ${type.toLowerCase()} to your profile.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {type === 'Education' ? 'School / University' : 'Company'}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        type === 'Education'
                          ? 'Harvard University'
                          : 'Acme Corp'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="positionMajor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {type === 'Education'
                      ? 'Degree / Major'
                      : 'Position / Role'}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        type === 'Education'
                          ? 'Bachelor of Science'
                          : 'Software Engineer'
                      }
                      {...field}
                      value={field.value || ''}
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
                    <FormLabel>
                      Start Date<span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(
                            date ? format(date, 'yyyy-MM-dd') : undefined,
                          )
                        }
                        placeholder="Start date"
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
                      <DatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(
                            date ? format(date, 'yyyy-MM-dd') : undefined,
                          )
                        }
                        placeholder="End date"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Leave empty if present
                    </p>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
