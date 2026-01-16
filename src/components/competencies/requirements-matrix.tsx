import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RequirementsMatrixCell } from './requirements-matrix-cell'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'

interface CareerBand {
  id: number
  bandName: string
  description: string | null
}

interface Competency {
  id: number
  name: string
  description: string | null
}

interface CompetencyGroup {
  id: number
  name: string
  description: string | null
}

interface GroupData {
  group: CompetencyGroup
  competencies: {
    competency: Competency
    requirements: Record<number, Record<number, number | null>>
  }[]
}

interface RequirementsMatrixProps {
  careerBands: CareerBand[]
  groups: GroupData[]
  onUpdateRequirement: (
    careerBandId: number,
    competencyId: number,
    requiredLevel: number | null,
  ) => Promise<void>
}

export function RequirementsMatrix({
  careerBands,
  groups,
  onUpdateRequirement,
}: RequirementsMatrixProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    new Set(groups.map((g) => g.group.id)),
  )

  const toggleGroup = (groupId: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const getRequiredLevel = (
    requirementsMap: Record<number, Record<number, number | null>>,
    careerBandId: number,
    competencyId: number,
  ): number | null => {
    return requirementsMap[careerBandId]?.[competencyId] ?? null
  }

  if (careerBands.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <p>No career bands found.</p>
          <p className="mt-1 text-xs">Please create career bands first.</p>
        </CardContent>
      </Card>
    )
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <p>No competencies found.</p>
          <p className="mt-1 text-xs">
            Please create competency groups and competencies first.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((groupData) => {
        const isExpanded = expandedGroups.has(groupData.group.id)
        const competencyCount = groupData.competencies.length

        return (
          <Card key={groupData.group.id}>
            <CardHeader
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleGroup(groupData.group.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <IconChevronDown className="h-4 w-4" />
                  ) : (
                    <IconChevronRight className="h-4 w-4" />
                  )}
                  <CardTitle className="text-base">
                    {groupData.group.name}
                  </CardTitle>
                  <Badge variant="secondary">{competencyCount}</Badge>
                </div>
              </div>
              {groupData.group.description && (
                <p className="text-sm text-muted-foreground ml-6">
                  {groupData.group.description}
                </p>
              )}
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-64 sticky left-0 bg-background z-10">
                          Competency
                        </TableHead>
                        {careerBands.map((band) => (
                          <TableHead key={band.id} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">
                                {band.bandName}
                              </span>
                              {band.description && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  {band.description}
                                </span>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupData.competencies.map((item) => (
                        <TableRow key={item.competency.id}>
                          <TableCell className="sticky left-0 bg-background z-10 font-medium">
                            <div>
                              <div>{item.competency.name}</div>
                              {item.competency.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {item.competency.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {careerBands.map((band) => (
                            <TableCell
                              key={band.id}
                              className="text-center align-middle"
                            >
                              <div className="flex justify-center">
                                <RequirementsMatrixCell
                                  value={getRequiredLevel(
                                    item.requirements,
                                    band.id,
                                    item.competency.id,
                                  )}
                                  onChange={(value) =>
                                    onUpdateRequirement(
                                      band.id,
                                      item.competency.id,
                                      value,
                                    )
                                  }
                                />
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
