import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AssessmentFormProps {
  competency: any
  levels: any[]
  requiredLevel: number | null
  initialScore: number | null
  initialNote: string | null
  referenceScore?: number | null
  referenceNote?: string | null
  referenceLabel?: string
  mode: 'SELF' | 'LEADER' | 'DISCUSSION' | 'VIEW'
  onChange: (score: number, note: string) => void
}

export function AssessmentForm({
  competency,
  levels,
  requiredLevel,
  initialScore,
  initialNote,
  referenceScore,
  referenceNote,
  referenceLabel = "Employee's Score",
  mode,
  onChange,
}: AssessmentFormProps) {
  const [score, setScore] = useState<number | null>(initialScore)
  const [note, setNote] = useState<string>(initialNote || '')

  const handleScoreChange = (value: string) => {
    const numValue = parseInt(value)
    setScore(numValue)
    onChange(numValue, note)
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNote(value)
    if (score !== null) {
      onChange(score, value)
    }
  }

  const isReadOnly = mode === 'VIEW'

  return (
    <Card className="mb-6 border-l-4 border-l-primary/50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{competency.name}</CardTitle>
            <CardDescription className="mt-1">
              {competency.description}
            </CardDescription>
          </div>
          {requiredLevel && (
            <Badge variant="outline" className="ml-2">
              Target Level: {requiredLevel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Reference Score Display (for Leader/Discussion View) */}
        {(mode === 'LEADER' || mode === 'DISCUSSION') && (referenceScore !== undefined && referenceScore !== null) && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {referenceLabel}
              </span>
              <Badge variant={referenceScore >= (requiredLevel || 0) ? "default" : "secondary"}>
                Rated: Level {referenceScore}
              </Badge>
            </div>
            {referenceNote ? (
              <p className="text-sm italic text-muted-foreground">"{referenceNote}"</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes provided</p>
            )}
          </div>
        )}

        {/* Level Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            {mode === 'DISCUSSION' ? 'Final Agreed Level' : 'Select Proficiency Level'}
          </Label>
          <RadioGroup
            onValueChange={handleScoreChange}
            value={score?.toString()}
            disabled={isReadOnly}
            className="grid gap-4"
          >
            {levels.map((level: any) => (
              <div
                key={level.levelNumber}
                className={cn(
                  'relative flex items-start space-x-3 rounded-md border p-4 hover:bg-accent/50 transition-colors',
                  score === level.levelNumber
                    ? 'border-primary bg-accent/20'
                    : '',
                  requiredLevel === level.levelNumber
                    ? 'ring-2 ring-primary/20 bg-primary/5'
                    : '',
                )}
              >
                <RadioGroupItem
                  value={level.levelNumber.toString()}
                  id={`c-${competency.id}-l-${level.levelNumber}`}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none w-full">
                  <Label
                    htmlFor={`c-${competency.id}-l-${level.levelNumber}`}
                    className="font-medium cursor-pointer flex justify-between"
                  >
                    <span>Level {level.levelNumber}</span>
                    {requiredLevel === level.levelNumber && (
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {level.behavioralIndicator}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Notes */}
        <div className="mt-6 space-y-2">
          <Label htmlFor={`note-${competency.id}`}>
            {mode === 'SELF' && 'Self-Assessment Notes'}
            {mode === 'LEADER' && 'Leader Feedback'}
            {mode === 'DISCUSSION' && 'Final Discussion Notes'}
          </Label>
          <Textarea
            id={`note-${competency.id}`}
            placeholder={
              mode === 'SELF'
                ? 'Describe specific examples demonstrating this competency...'
                : mode === 'LEADER'
                ? 'Provide feedback and observations...'
                : 'Summarize the discussion and final agreement...'
            }
            value={note}
            onChange={handleNoteChange}
            disabled={isReadOnly}
            className="resize-none"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
