import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import {
  IconCheck,
  IconLoader2,
  IconSend,
  IconAlertTriangle,
  IconListCheck,
} from '@tabler/icons-react'
import { AssessmentForm } from './assessment-form'
import { ScoreComparisonTable } from './score-comparison-table'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  submitSelfAssessmentFn,
  submitLeaderAssessmentFn,
  finalizeAssessmentFn,
} from '@/server/assessments.server'
import { useAuthStore } from '@/store/auth.store'

interface AssessmentDetailProps {
  assessment: any
  details: any[]
  mode: 'SELF' | 'LEADER' | 'DISCUSSION' | 'VIEW'
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
  const [overallFeedback, setOverallFeedback] = useState<string>(assessment.feedback || '')

  // Initialize scores/notes from details
  useState(() => {
    const initialScores: Record<number, { score: number; note: string }> = {}
    details.forEach((d) => {
      let score
      let note = d.note // Note handling might need separation for self/leader/final notes if database supports it. Currently schema has one 'note' field in detail but spec implies separate?
      // Schema check: user_assessment_details has `note`. It seems shared? Or maybe we overwrite? 
      // If shared, that's bad for history.
      // Looking at `server/assessments.server.ts`:
      // submitSelfAssessmentFn updates `selfScore` and `note`.
      // submitLeaderAssessmentFn updates `leaderScore` and `note`. 
      // This means `note` is overwritten! This is a schema limitation I must work with or I should have checked schema better.
      // However, `user_assessment_details` usually has columns. Let's assume `note` is the active note for the current phase.
      // WAit, if checking schema in server buffer... 
      // `submitLeaderAssessmentFn` updates `leaderScore` and `note`.
      // `submitSelfAssessmentFn` updates `selfScore` and `note`.
      // So `note` is indeed shared/overwritten.
      
      if (mode === 'SELF') {
        score = d.selfScore
      } else if (mode === 'LEADER') {
        score = d.leaderScore
      } else if (mode === 'DISCUSSION') {
        score = d.finalScore || d.leaderScore // Default final to leader score
      } else { // VIEW
        score = d.finalScore || d.leaderScore || d.selfScore
      }

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
        // For finalize, we need specialized payload formatting if different?
        // submitLeaderAssessmentFn takes { assessmentId, scores: [...] }
        // finalizeAssessmentFn takes { assessmentId, finalScores: [{ competencyId, finalScore }] }
      }

      if (mode === 'SELF') {
        await submitSelfAssessmentFn({ data: { token: token!, data: payload } } as any)
      } else if (mode === 'LEADER') {
        await submitLeaderAssessmentFn({ data: { token: token!, data: payload } } as any)
      } else if (mode === 'DISCUSSION') {
         // Transform payload for finalize
         const finalizePayload = {
            assessmentId: assessment.id,
            finalScores: payload.scores.map(s => ({
                competencyId: s.competencyId,
                finalScore: s.score
            })),
            feedback: overallFeedback || "No feedback provided."
         }
         await finalizeAssessmentFn({ data: { token: token!, data: finalizePayload } } as any)
      }
    },
    onSuccess: () => {
      toast.success('Assessment submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['assessment', assessment.id.toString()] })
      // Also invalidate list queries properly?
      // queryClient.invalidateQueries({ queryKey: ['team-assessments'] })
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
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold mb-2">
                {mode === 'SELF' && 'Self Assessment'}
                {mode === 'LEADER' && 'Leader Assessment'}
                {mode === 'DISCUSSION' && 'Finalize Assessment'}
                {mode === 'VIEW' && 'Assessment Details'}
                </h1>
                <p className="text-muted-foreground text-lg">
                {assessment.cycle.name} • {assessment.user?.profile?.fullName || 'User'}
                </p>
            </div>
            {/* Legend for scores OR View Results button */}
             {assessment.status === 'DONE' ? (
                 <Button variant="outline" asChild>
                   <Link 
                     to="/competencies/idp/create" 
                     search={{ assessmentId: assessment.id }}
                     className="flex items-center gap-2"
                   >
                     <IconListCheck className="h-4 w-4" />
                     Create Development Plan
                   </Link>
                 </Button>
             ) : (mode === 'LEADER' || mode === 'DISCUSSION') && (
                 <div className="bg-muted p-3 rounded-md text-xs space-y-1">
                     <div className="font-semibold text-muted-foreground mb-1">Legend</div>
                     {mode === 'LEADER' && <div>User Self Score shown for reference</div>}
                     {mode === 'DISCUSSION' && <div>Leader Score shown for reference</div>}
                 </div>
             )}
        </div>
        
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

      {/* Score Comparison Table (DISCUSSION Mode) */}
      {mode === 'DISCUSSION' && !isReadOnly && (
        <ScoreComparisonTable details={details} />
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
          
          {groupDetails.map((detail: any) => {
            // Determine props based on mode
            let initialScore = null
            let referenceScore = null
            let referenceLabel = undefined
            let referenceNote = undefined // Note handling is tricky as discussed. 

            if (mode === 'SELF') {
                initialScore = detail.selfScore
            } else if (mode === 'LEADER') {
                initialScore = detail.leaderScore
                referenceScore = detail.selfScore
                referenceLabel = "Employee Self-Rating"
                // referenceNote = detail.note? // If note was self-note.
            } else if (mode === 'DISCUSSION') {
                initialScore = detail.finalScore || detail.leaderScore
                referenceScore = detail.leaderScore // Show what leader rated previously
                referenceLabel = "Leader's Draft Rating"
            } else { // VIEW
                initialScore = detail.finalScore || detail.leaderScore || detail.selfScore
            }

            return (
                <AssessmentForm
                key={detail.competencyId}
                competency={detail.competency}
                levels={detail.competency.competencyLevels || []}
                requiredLevel={detail.requiredLevel}
                initialScore={initialScore}
                initialNote={detail.note} // This note is shared, so it shows latest note
                referenceScore={referenceScore}
                referenceLabel={referenceLabel}
                referenceNote={referenceNote}
                mode={isReadOnly ? 'VIEW' : mode}
                onChange={(s, n) => handleScoreChange(detail.competencyId, s, n)}
                />
            )
          })}
        </div>
      ))}

      {/* Overall Feedback (DISCUSSION Mode) */}
      {mode === 'DISCUSSION' && !isReadOnly && (
        <div className="mb-24 p-6 border rounded-lg bg-card shadow-sm">
           <h3 className="text-lg font-semibold mb-4">Final Summary & Feedback</h3>
           <p className="text-sm text-muted-foreground mb-3">
             Please provide an overall summary of the discussion and final feedback for the employee.
           </p>
           <textarea 
             className="w-full min-h-[120px] p-3 rounded-md border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
             placeholder="Enter final summary feedback..."
             value={overallFeedback}
             onChange={(e) => setOverallFeedback(e.target.value)}
           />
        </div>
      )}

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
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            {mode === 'DISCUSSION' ? 'Finalizing...' : 'Submitting...'}
                        </>
                    ) : (
                        <>
                            {mode === 'DISCUSSION' ? 'Finalize Assessment' : 'Submit Assessment'} 
                            <IconSend className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
      )}
    </div>
  )
}
