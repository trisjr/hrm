import * as React from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { TeamMember } from '@/lib/team.schemas'
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

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TeamMember
  isLeader: boolean
  onConfirm: () => Promise<void>
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  isLeader,
  onConfirm,
}: RemoveMemberDialogProps) {
  const [isRemoving, setIsRemoving] = React.useState(false)

  const handleConfirm = async () => {
    setIsRemoving(true)
    try {
      await onConfirm()
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to remove{' '}
                <span className="font-semibold text-foreground">
                  {member.fullName}
                </span>{' '}
                from this team?
              </p>

              {isLeader && (
                <div className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-900 dark:text-amber-200">
                  <IconAlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">This member is the team leader!</p>
                    <p className="mt-1">
                      Removing them will also clear the team's leader assignment.
                      Their role may be reverted to DEV if they're not leading other teams.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm">This action cannot be undone.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving ? 'Removing...' : 'Yes, Remove Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
