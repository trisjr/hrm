import * as React from 'react'
import { IconCrown, IconUserOff } from '@tabler/icons-react'
import type { TeamMember } from '@/lib/team.schemas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface AssignLeaderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: number
  currentLeaderId: number | null
  members: TeamMember[]
  onSubmit: (leaderId: number | null) => Promise<void>
}

export function AssignLeaderDialog({
  open,
  onOpenChange,
  teamId,
  currentLeaderId,
  members,
  onSubmit,
}: AssignLeaderDialogProps) {
  const [selectedLeaderId, setSelectedLeaderId] = React.useState<string>(
    currentLeaderId?.toString() || 'none',
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedLeaderId(currentLeaderId?.toString() || 'none')
    }
  }, [open, currentLeaderId])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const leaderId =
        selectedLeaderId === 'none' ? null : Number(selectedLeaderId)
      await onSubmit(leaderId)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Team Leader</DialogTitle>
          <DialogDescription>
            Select a team member to be the leader. Only existing team members
            can be assigned as leaders. Their role will automatically be
            upgraded to LEADER.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedLeaderId}
            onValueChange={setSelectedLeaderId}
            className="space-y-3"
          >
            {/* No Leader Option */}
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
              <RadioGroupItem value="none" id="none" />
              <Label
                htmlFor="none"
                className="flex flex-1 items-center gap-3 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <IconUserOff className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">No Leader</div>
                  <div className="text-sm text-muted-foreground">
                    Remove current leader
                  </div>
                </div>
              </Label>
            </div>

            {/* Team Members */}
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No team members available. Add members first.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem
                    value={member.id.toString()}
                    id={member.id.toString()}
                  />
                  <Label
                    htmlFor={member.id.toString()}
                    className="flex flex-1 items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>
                        {member.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.fullName}</span>
                        {member.id === currentLeaderId && (
                          <IconCrown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {member.employeeCode} • Role: {member.roleName || 'N/A'}
                      </div>
                    </div>
                  </Label>
                </div>
              ))
            )}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              selectedLeaderId === currentLeaderId?.toString() ||
              (selectedLeaderId === 'none' && currentLeaderId === null)
            }
          >
            {isSubmitting ? 'Assigning...' : 'Assign Leader'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
