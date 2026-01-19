import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  competencyCount: number
  onConfirm: () => Promise<void>
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  groupName,
  competencyCount,
  onConfirm,
}: DeleteGroupDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Error handled by parent (toast)
    } finally {
      setIsDeleting(false)
    }
  }

  const canDelete = competencyCount === 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Competency Group</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete the group{' '}
                <span className="font-semibold text-foreground">
                  "{groupName}"
                </span>
                ?
              </p>
              {!canDelete && (
                <p className="text-destructive font-medium">
                  ⚠️ This group cannot be deleted because it contains{' '}
                  {competencyCount} competency
                  {competencyCount === 1 ? '' : 'ies'}. Please delete or move
                  them first.
                </p>
              )}
              {canDelete && (
                <p className="text-amber-600 dark:text-amber-500">
                  This action cannot be undone.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || !canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Group'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
