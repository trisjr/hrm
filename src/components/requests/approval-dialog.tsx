'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const rejectFormSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
})

type RejectFormData = z.infer<typeof rejectFormSchema>

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'approve' | 'reject'
  requestId: number
  onApprove: (requestId: number) => Promise<void>
  onReject: (requestId: number, reason: string) => Promise<void>
}

export function ApprovalDialog({
  open,
  onOpenChange,
  mode,
  requestId,
  onApprove,
  onReject,
}: ApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      rejectionReason: '',
    },
  })

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApprove(requestId)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to approve request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async (data: RejectFormData) => {
    setIsSubmitting(true)
    try {
      await onReject(requestId, data.rejectionReason)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to reject request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (mode === 'approve') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this request? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Request</AlertDialogTitle>
          <AlertDialogDescription>
            Please provide a reason for rejecting this request.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleReject)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this request is being rejected..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reject Request
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
