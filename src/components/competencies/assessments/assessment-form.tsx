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
  mode: 'SELF' | 'LEADER' | 'VIEW'
  onChange: (score: number, note: string) => void
}

export function AssessmentForm({
  competency,
  levels,
  requiredLevel,
  initialScore,
  initialNote,
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
        {/* Level Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            Select Proficiency Level
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
                  score === level.levelNumber ? 'border-primary bg-accent/20' : '',
                  requiredLevel === level.levelNumber ? 'ring-2 ring-primary/20 bg-primary/5' : ''
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
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Required</span>
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
            {mode === 'SELF' ? 'Self-Assessment Notes' : 'Leader Feedback'}
          </Label>
          <Textarea
            id={`note-${competency.id}`}
            placeholder={
              mode === 'SELF'
                ? "Describe specific examples demonstrating this competency..."
                : "Provide feedback and observations..."
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
