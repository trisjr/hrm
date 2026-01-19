/**
 * Edit Summary Dialog
 * Allows user to quickly update their professional summary
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateProfileSummaryFn } from '@/server/cv.server'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

interface EditSummaryDialogProps {
  currentSummary?: string | null
}

export function EditSummaryDialog({ currentSummary }: EditSummaryDialogProps) {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState(currentSummary || '')
  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      return updateProfileSummaryFn({
        data: {
          token: token!,
          summary,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv-data'] })
      toast.success('Summary updated successfully')
      setOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update summary')
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4 mr-2" />
          Edit Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Professional Summary</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label>Summary</Label>
            <Textarea
              placeholder="Write a brief professional summary (1-3 sentences)..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {summary.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
