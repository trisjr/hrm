import { useState } from 'react'
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
import {
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
} from '@tabler/icons-react'

interface GapAnalysisTableProps {
  details: Array<{
    competency: {
      id?: number
      name?: string
      description?: string | null
      [key: string]: any // Allow additional properties like competencyLevels
    }
    group: {
      id?: number
      name?: string
      [key: string]: any
    } | null
    requiredLevel: number | null
    finalScore: number | null
    [key: string]: any // Allow additional properties
  }>
}

type SortField = 'competency' | 'required' | 'final' | 'gap'
type SortDirection = 'asc' | 'desc'

export function GapAnalysisTable({ details }: GapAnalysisTableProps) {
  const [sortField, setSortField] = useState<SortField>('gap')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Calculate gaps and prepare data
  const tableData = details
    .filter((d) => d.finalScore !== null && d.requiredLevel !== null)
    .map((d) => ({
      ...d,
      gap: d.finalScore! - d.requiredLevel!,
    }))

  // Sort data
  const sortedData = [...tableData].sort((a, b) => {
    let aVal: number | string = 0
    let bVal: number | string = 0

    switch (sortField) {
      case 'competency':
        aVal = a.competency?.name || ''
        bVal = b.competency?.name || ''
        break
      case 'required':
        aVal = a.requiredLevel || 0
        bVal = b.requiredLevel || 0
        break
      case 'final':
        aVal = a.finalScore || 0
        bVal = b.finalScore || 0
        break
      case 'gap':
        aVal = a.gap
        bVal = b.gap
        break
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    const aNum = typeof aVal === 'number' ? aVal : 0
    const bNum = typeof bVal === 'number' ? bVal : 0
    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getGapBadge = (gap: number) => {
    if (gap >= 1) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <IconCheck className="h-3 w-3 mr-1" />
          Exceeds (+{gap.toFixed(1)})
        </Badge>
      )
    } else if (gap === 0) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <IconMinus className="h-3 w-3 mr-1" />
          Meets
        </Badge>
      )
    } else if (gap >= -1) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <IconAlertTriangle className="h-3 w-3 mr-1" />
          Slight Gap ({gap.toFixed(1)})
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <IconAlertCircle className="h-3 w-3 mr-1" />
          Critical ({gap.toFixed(1)})
        </Badge>
      )
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <IconArrowUp className="h-4 w-4 inline ml-1" />
    ) : (
      <IconArrowDown className="h-4 w-4 inline ml-1" />
    )
  }

  if (tableData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No assessment data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Gap Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click column headers to sort. Gap = Final Score - Required Level
        </p>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('competency')}
                >
                  Competency <SortIcon field="competency" />
                </TableHead>
                <TableHead>Group</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort('required')}
                >
                  Required <SortIcon field="required" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort('final')}
                >
                  Final Score <SortIcon field="final" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 text-center"
                  onClick={() => handleSort('gap')}
                >
                  Gap <SortIcon field="gap" />
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={row.competency?.id || index}>
                  <TableCell className="font-medium">
                    {row.competency?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.group?.name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.requiredLevel}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {row.finalScore}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        row.gap >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {row.gap > 0 ? '+' : ''}
                      {row.gap.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>{getGapBadge(row.gap)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {sortedData.map((row, index) => (
            <Card key={row.competency?.id || index}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">
                      {row.competency?.name || 'Unknown'}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {row.group?.name || 'N/A'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Required</p>
                      <p className="font-medium">{row.requiredLevel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Final</p>
                      <p className="font-semibold">{row.finalScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Gap</p>
                      <p
                        className={`font-medium ${
                          row.gap >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {row.gap > 0 ? '+' : ''}
                        {row.gap.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div>{getGapBadge(row.gap)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
