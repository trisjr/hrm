import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  IconCheck,
  IconLoader2,
  IconSend,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { AssessmentForm } from './assessment-form'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  submitSelfAssessmentFn,
  submitLeaderAssessmentFn,
} from '@/server/assessments.server'
import { useAuthStore } from '@/store/auth.store'

interface AssessmentDetailProps {
  assessment: any
  details: any[]
  mode: 'SELF' | 'LEADER'
  isReadOnly?: boolean
}

export function AssessmentDetail({
  assessment,
  details,
  mode,
  isReadOnly = false,
}: AssessmentDetailProps) {
  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()
  const [scores, setScores] = useState<Record<number, { score: number; note: string }>>({})

  // Initialize scores/notes from details
  useState(() => {
    const initialScores: Record<number, { score: number; note: string }> = {}
    details.forEach((d) => {
      const score = mode === 'SELF' ? d.selfScore : d.leaderScore
      const note = d.note
      if (score) {
        initialScores[d.competencyId] = { score, note: note || '' }
      }
    })
    setScores(initialScores)
  })

  // Group competencies by group
  const groupedDetails = details.reduce((acc: any, detail: any) => {
    const groupName = detail.group?.name || 'Other'
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(detail)
    return acc
  }, {})

  // Calculate progress
  const totalCompetencies = details.length
  const completedCompetencies = Object.keys(scores).length
  const progress = (completedCompetencies / totalCompetencies) * 100
  const isComplete = completedCompetencies === totalCompetencies

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        assessmentId: assessment.id,
        scores: Object.entries(scores).map(([competencyId, data]) => ({
          competencyId: parseInt(competencyId),
          score: data.score,
          note: data.note,
        })),
      }

      if (mode === 'SELF') {
        await submitSelfAssessmentFn({ data: { token: token!, data: payload } } as any)
      } else {
        await submitLeaderAssessmentFn({ data: { token: token!, data: payload } } as any)
      }
    },
    onSuccess: () => {
      toast.success('Assessment submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['my-assessment'] })
      queryClient.invalidateQueries({ queryKey: ['team-assessments'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit assessment')
    },
  })

  const handleScoreChange = (competencyId: number, score: number, note: string) => {
    setScores((prev) => ({
      ...prev,
      [competencyId]: { score, note },
    }))
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
           {mode === 'SELF' ? 'Self Assessment' : 'Leader Assessment'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {assessment.cycle.name} • {assessment.user?.profile?.fullName || 'User'}
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <span className="font-semibold mr-2">Status:</span>
            <span className="uppercase tracking-wider font-medium text-primary">
              {assessment.status.replace('_', ' ')}
            </span>
          </div>
          <div>•</div>
          <div>
            Due: {format(new Date(assessment.cycle.endDate), 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!isReadOnly && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 mb-8 border-b">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span>Progress</span>
            <span>{completedCompetencies}/{totalCompetencies} Competencies</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Competency Groups */}
      {Object.entries(groupedDetails).map(([groupName, groupDetails]: [string, any]) => (
        <div key={groupName} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {groupName}
            <span className="ml-3 text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {groupDetails.length} skills
            </span>
          </h2>
          
          {groupDetails.map((detail: any) => (
            <AssessmentForm
              key={detail.competencyId}
              competency={detail.competency}
              levels={detail.competency.competencyLevels || []} // Assuming levels are joined, need to check query
              requiredLevel={detail.requiredLevel}
              initialScore={mode === 'SELF' ? detail.selfScore : detail.leaderScore}
              initialNote={detail.note}
              mode={isReadOnly ? 'VIEW' : mode}
              onChange={(s, n) => handleScoreChange(detail.competencyId, s, n)}
            />
          ))}
        </div>
      ))}

      {/* Action Footer */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {isComplete ? (
                        <span className="text-green-600 flex items-center font-medium">
                            <IconCheck className="mr-1 h-4 w-4" /> All competencies assessed
                        </span>
                    ) : (
                        <span className="text-amber-600 flex items-center font-medium">
                            <IconAlertTriangle className="mr-1 h-4 w-4" /> {totalCompetencies - completedCompetencies} remaining
                        </span>
                    )}
                </div>
                <Button 
                    size="lg" 
                    onClick={() => submitMutation.mutate()}
                    disabled={!isComplete || submitMutation.isPending}
                >
                    {submitMutation.isPending ? (
                        <>
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                    ) : (
                        <>
                            Submit Assessment <IconSend className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
      )}
    </div>
  )
}
