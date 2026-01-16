import * as React from 'react'
import { IconUserPlus, IconTrash, IconCrown } from '@tabler/icons-react'
import type { TeamMember } from '@/lib/team.schemas'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface TeamMembersTableProps {
  members: TeamMember[]
  currentLeaderId: number | null
  onAddMember: () => void
  onRemoveMember: (member: TeamMember) => void
}

export function TeamMembersTable({
  members,
  currentLeaderId,
  onAddMember,
  onRemoveMember,
}: TeamMembersTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Members ({members.length})</CardTitle>
          <Button size="sm" onClick={onAddMember}>
            <IconUserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No members in this team yet. Add members to get started.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const isLeader = member.id === currentLeaderId
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback>
                                {member.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {member.fullName}
                                </span>
                                {isLeader && (
                                  <IconCrown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.employeeCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.roleName || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.status === 'ACTIVE'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveMember(member)}
                          >
                            <IconTrash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {members.map((member) => {
                const isLeader = member.id === currentLeaderId
                return (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>
                            {member.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.fullName}
                            </span>
                            {isLeader && (
                              <IconCrown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveMember(member)}
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Employee ID:</span>
                        <div>{member.employeeCode}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <div>
                          <Badge variant="outline">
                            {member.roleName || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div>
                          <Badge
                            variant={
                              member.status === 'ACTIVE'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
