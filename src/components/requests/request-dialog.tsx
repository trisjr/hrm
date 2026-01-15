'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type {
  CreateRequestInput,
  RequestResponse,
} from '@/lib/request.schemas'
import { createRequestSchema } from '@/lib/request.schemas'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/common/date-picker'
import { Loader2 } from 'lucide-react'

interface RequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateRequestInput) => Promise<void>
  editRequest?: RequestResponse | null
}

export function RequestDialog({
  open,
  onOpenChange,
  onSubmit,
  editRequest,
}: RequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!editRequest

  const form = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      type: 'LEAVE',
      startDate: new Date(),
      endDate: new Date(),
      isHalfDay: false,
      reason: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editRequest && open) {
      form.reset({
        type: editRequest.type,
        startDate: new Date(editRequest.startDate),
        endDate: new Date(editRequest.endDate),
        isHalfDay: editRequest.isHalfDay,
        reason: editRequest.reason || '',
      })
    } else if (!open) {
      // Reset form when dialog closes
      form.reset({
        type: 'LEAVE',
        startDate: new Date(),
        endDate: new Date(),
        isHalfDay: false,
        reason: '',
      })
    }
  }, [editRequest, open, form])

  const isHalfDay = form.watch('isHalfDay')
  const startDate = form.watch('startDate')

  // When half-day is toggled, sync end date with start date
  const handleHalfDayChange = (checked: boolean) => {
    form.setValue('isHalfDay', checked)
    if (checked) {
      form.setValue('endDate', startDate)
    }
  }

  // When start date changes in half-day mode, sync end date
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      form.setValue('startDate', date)
      if (isHalfDay) {
        form.setValue('endDate', date)
      }
    }
  }

  const handleSubmit = async (data: CreateRequestInput) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Request' : 'Create New Request'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your request details below.'
              : 'Submit a request for leave, work from home, or other arrangements.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Request Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Request Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LEAVE">🏖️ Leave</SelectItem>
                      <SelectItem value="WFH">🏠 Work From Home</SelectItem>
                      <SelectItem value="LATE">⏰ Late Arrival</SelectItem>
                      <SelectItem value="EARLY">🚪 Early Leave</SelectItem>
                      <SelectItem value="OVERTIME">💼 Overtime</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Half Day Checkbox */}
            <FormField
              control={form.control}
              name="isHalfDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={handleHalfDayChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Half Day</FormLabel>
                    <FormDescription>
                      Check this if requesting for half a day only
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Start Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={handleStartDateChange}
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
                    <FormLabel>
                      End Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="End date"
                        disabled={isHalfDay}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for your request..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 10 characters, maximum 500 characters
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
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Update Request' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
