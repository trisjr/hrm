import * as React from 'react'
import {
  IconLoader2,
  IconSearch,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'
import type { TeamMember } from '@/lib/team.schemas'
import { getRolesFn, listUsersFn } from '@/server/users.server'
import { useAuthStore } from '@/store/auth.store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

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
  teamName: string | null
}

export function AddMemberDialog({
  open,
  onOpenChange,
  currentMembers,
  onSubmit,
}: AddMemberDialogProps) {
  const { token } = useAuthStore()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedQuery, setDebouncedQuery] = React.useState('')
  const [availableUsers, setAvailableUsers] = React.useState<AvailableUser[]>([])
  const [addingUserId, setAddingUserId] = React.useState<number | null>(null)
  const [devRoleId, setDevRoleId] = React.useState<number | null>(null)
  const [userToConfirm, setUserToConfirm] = React.useState<AvailableUser | null>(
    null,
  )

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Initial setup: Get DEV role ID
  React.useEffect(() => {
    if (!token || !open) return
    const fetchRole = async () => {
      const roles = await getRolesFn()
      const dev = roles.find((r) => r.roleName === 'DEV')
      if (dev) setDevRoleId(dev.id)
    }
    fetchRole()
  }, [token, open])

  // Search users when debounced query changes
  React.useEffect(() => {
    if (!open || !token || !devRoleId) return

    const fetchUsers = async () => {
      try {
        const response = await listUsersFn({
          data: {
            page: 1,
            limit: 20, // Fetch top 20 matches
            status: 'ACTIVE',
            roleId: devRoleId,
            search: debouncedQuery || undefined,
          },
        })

        // Filter out current team members locally (to be safe)
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
            teamName: user.team?.teamName || null,
          }))

        setAvailableUsers(available)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }

    fetchUsers()
  }, [open, token, debouncedQuery, devRoleId, currentMembers])

  // Reset state on close
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setAddingUserId(null)
      setUserToConfirm(null)
    }
  }, [open])

  const initiateAdd = (user: AvailableUser) => {
    if (user.teamName) {
      setUserToConfirm(user)
    } else {
      handleAdd(user.id)
    }
  }

  const handleAdd = async (userId: number) => {
    setAddingUserId(userId)
    setUserToConfirm(null) // Close confirm dialog if open
    try {
      await onSubmit(userId)
    } finally {
      setAddingUserId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-150 p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>
              Search and add developers to your team.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border-b bg-muted/30">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-muted-foreground/20"
                autoFocus
                aria-label="Search users"
              />
            </div>
          </div>

          <ScrollArea className="h-100 p-2">
            {availableUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-75 text-muted-foreground gap-2">
                <div className="bg-muted p-4 rounded-full">
                  <IconUser className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p>
                  {searchQuery
                    ? 'No users found.'
                    : 'Start typing to search users.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <div className="font-medium truncate flex items-center gap-2">
                          {user.fullName}
                          {user.teamName && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
                            >
                              In: {user.teamName}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                          {user.email}
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1 font-normal text-muted-foreground"
                          >
                            {user.employeeCode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity gap-2 hover:bg-primary hover:text-primary-foreground"
                      disabled={addingUserId !== null}
                      onClick={() => initiateAdd(user)}
                      aria-label={`Add ${user.fullName} to team`}
                    >
                      {addingUserId === user.id ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <IconUserPlus className="h-4 w-4" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToConfirm}
        onOpenChange={(open) => !open && setUserToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Member?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {userToConfirm?.fullName}
              </span>{' '}
              is currently a member of team{' '}
              <span className="font-semibold text-foreground">
                "{userToConfirm?.teamName}"
              </span>
              .
              <br />
              <br />
              Adding them here will remove them from their current team. Do you
              want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToConfirm && handleAdd(userToConfirm.id)}
            >
              Confirm Reassignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
