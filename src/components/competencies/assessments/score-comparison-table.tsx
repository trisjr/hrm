import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ScoreComparisonTableProps {
  details: any[]
}

export function ScoreComparisonTable({ details }: ScoreComparisonTableProps) {
  // Group by competency group
  const groupedDetails = details.reduce((acc: any, detail: any) => {
    const groupName = detail.group?.name || 'Other'
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(detail)
    return acc
  }, {})

  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'outline'
    if (score >= 4) return 'default'
    if (score >= 3) return 'secondary'
    return 'destructive'
  }

  const getGapColor = (gap: number) => {
    if (gap >= 1) return 'text-green-600'
    if (gap >= 0) return 'text-blue-600'
    if (gap >= -1) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Score Comparison</h2>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Self Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Leader Score</span>
          </div>
        </div>
      </div>

      {Object.entries(groupedDetails).map(([groupName, groupDetails]: [string, any]) => (
        <Card key={groupName}>
          <CardHeader>
            <CardTitle className="text-lg">{groupName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Competency</th>
                    <th className="text-center py-3 px-2 font-medium">Required</th>
                    <th className="text-center py-3 px-2 font-medium">Self Score</th>
                    <th className="text-center py-3 px-2 font-medium">Leader Score</th>
                    <th className="text-center py-3 px-2 font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {groupDetails.map((detail: any) => {
                    const selfScore = detail.selfScore
                    const leaderScore = detail.leaderScore
                    const diff = selfScore && leaderScore ? leaderScore - selfScore : null

                    return (
                      <tr key={detail.competencyId} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="font-medium">{detail.competency?.name}</div>
                          {detail.note && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {detail.note}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="outline" className="font-mono">
                            {detail.requiredLevel || '-'}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={getScoreBadgeVariant(selfScore)} className="font-mono bg-blue-500/10 text-blue-700 border-blue-300">
                            {selfScore || '-'}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant={getScoreBadgeVariant(leaderScore)} className="font-mono bg-purple-500/10 text-purple-700 border-purple-300">
                            {leaderScore || '-'}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          {diff !== null ? (
                            <span className={`font-semibold ${getGapColor(diff)}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(details.reduce((sum, d) => sum + (d.selfScore || 0), 0) / details.filter(d => d.selfScore).length).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Self Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(details.reduce((sum, d) => sum + (d.leaderScore || 0), 0) / details.filter(d => d.leaderScore).length).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Leader Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {details.filter(d => d.selfScore && d.leaderScore && d.selfScore === d.leaderScore).length}
              </div>
              <div className="text-sm text-muted-foreground">Scores Match</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {details.filter(d => d.selfScore && d.leaderScore && Math.abs(d.selfScore - d.leaderScore) >= 2).length}
              </div>
              <div className="text-sm text-muted-foreground">Large Gaps (±2)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
