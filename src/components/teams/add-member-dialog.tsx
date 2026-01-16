import * as React from 'react'
import { IconSearch } from '@tabler/icons-react'
import type { TeamMember } from '@/lib/team.schemas'
import { listUsersFn } from '@/server/users.server'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: number
  currentMembers: TeamMember[]
  onSubmit: (userId: number) => Promise<void>
}

interface AvailableUser {
  id: number
  employeeCode: string
  email: string
  fullName: string
  avatarUrl: string | null
  roleName: string | null
}

export function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  currentMembers,
  onSubmit,
}: AddMemberDialogProps) {
  const { token } = useAuthStore()
  const [selectedUserId, setSelectedUserId] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [availableUsers, setAvailableUsers] = React.useState<AvailableUser[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Fetch available users (not in current team)
  React.useEffect(() => {
    if (!open || !token) return

    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await listUsersFn({
          data: {
            page: 1,
            limit: 100,
            status: 'ACTIVE',
          },
        })

        // Filter out current team members
        const currentMemberIds = new Set(currentMembers.map((m) => m.id))
        const available = response.users
          .filter((user) => !currentMemberIds.has(user.id))
          .map((user) => ({
            id: user.id,
            employeeCode: user.employeeCode,
            email: user.email,
            fullName: user.profile.fullName,
            avatarUrl: user.profile.avatarUrl,
            roleName: user.role?.roleName || null,
          }))

        setAvailableUsers(available)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [open, token, currentMembers])

  // Filter users by search query
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return availableUsers

    const query = searchQuery.toLowerCase()
    return availableUsers.filter(
      (user) =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.employeeCode.toLowerCase().includes(query),
    )
  }, [availableUsers, searchQuery])

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setSelectedUserId('')
      setSearchQuery('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedUserId) return

    setIsSubmitting(true)
    try {
      await onSubmit(Number(selectedUserId))
      setSelectedUserId('')
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
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select a user to add to this team. Only active users who are not
            already members can be added.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'No users found matching your search.'
                : 'No available users to add.'}
            </div>
          ) : (
            <RadioGroup
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              className="space-y-3 max-h-[400px] overflow-y-auto"
            >
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem
                    value={user.id.toString()}
                    id={user.id.toString()}
                  />
                  <Label
                    htmlFor={user.id.toString()}
                    className="flex flex-1 items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {user.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {user.employeeCode} • Role: {user.roleName || 'N/A'}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
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
            disabled={isSubmitting || !selectedUserId}
          >
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
