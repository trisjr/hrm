import * as React from 'react'
import type { TeamWithStats } from '@/lib/team.schemas'
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

interface DeleteTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: TeamWithStats
  onConfirm: () => Promise<void>
}

export function DeleteTeamDialog({
  open,
  onOpenChange,
  team,
  onConfirm,
}: DeleteTeamDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This will permanently delete the team{' '}
                <span className="font-semibold text-foreground">
                  "{team.teamName}"
                </span>
                .
              </p>
              {team.memberCount > 0 && (
                <p className="text-amber-600 dark:text-amber-500">
                  ⚠️ Warning: This team has{' '}
                  <span className="font-semibold">{team.memberCount}</span>{' '}
                  member{team.memberCount > 1 ? 's' : ''}. They will be
                  automatically unassigned from this team.
                </p>
              )}
              <p className="text-sm">This action cannot be undone.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Team'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
