import * as React from 'react'
import { IconUserCog, IconUserOff } from '@tabler/icons-react'
import type { TeamDetail } from '@/lib/team.schemas'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TeamLeaderCardProps {
  leader: TeamDetail['leader']
  onAssignLeader: () => void
}

export function TeamLeaderCard({
  leader,
  onAssignLeader,
}: TeamLeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Leader</CardTitle>
          <Button
            variant={leader ? 'outline' : 'default'}
            size="sm"
            onClick={onAssignLeader}
          >
            <IconUserCog className="mr-2 h-4 w-4" />
            {leader ? 'Change Leader' : 'Assign Leader'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {leader ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={leader.avatarUrl || undefined} />
              <AvatarFallback className="text-lg">
                {leader.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{leader.fullName}</h3>
                <Badge>Leader</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{leader.email}</p>
              <p className="text-sm text-muted-foreground">
                ID: {leader.employeeCode}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconUserOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No leader assigned to this team yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Assign a team member as the leader to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
