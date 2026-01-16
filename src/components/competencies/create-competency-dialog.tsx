import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createCompetencySchema } from '@/lib/competency.schemas'

interface CompetencyGroup {
  id: number
  name: string
}

interface CreateCompetencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CompetencyGroup[]
  onSubmit: (data: z.infer<typeof createCompetencySchema>) => Promise<void>
}

const LEVEL_LABELS = [
  { number: 1, label: 'Beginner', description: 'Understands basic concepts, needs guidance' },
  { number: 2, label: 'Developing', description: 'Can perform with supervision' },
  { number: 3, label: 'Competent', description: 'Works independently, handles standard cases' },
  { number: 4, label: 'Advanced', description: 'Handles complex cases, mentors others' },
  { number: 5, label: 'Expert', description: 'Innovates, defines best practices, thought leader' },
]

export function CreateCompetencyDialog({
  open,
  onOpenChange,
  groups,
  onSubmit,
}: CreateCompetencyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof createCompetencySchema>>({
    resolver: zodResolver(createCompetencySchema),
    defaultValues: {
      groupId: undefined,
      name: '',
      description: '',
      levels: LEVEL_LABELS.map((level) => ({
        levelNumber: level.number,
        behavioralIndicator: level.description,
      })),
    },
  })

  const handleSubmit = async (data: z.infer<typeof createCompetencySchema>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Competency</DialogTitle>
          <DialogDescription>
            Define a competency with 5 behavioral levels
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Group Selection */}
              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competency Group *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Competency Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competency Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Problem Solving, ReactJS, Leadership"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief overview of this competency..."
                        rows={2}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Behavioral Levels */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Behavioral Indicators *</h4>
                  <Badge variant="outline">5 Levels Required</Badge>
                </div>
                <FormDescription>
                  Define observable behaviors for each proficiency level
                </FormDescription>

                <div className="space-y-4">
                  {LEVEL_LABELS.map((levelInfo, index) => (
                    <FormField
                      key={levelInfo.number}
                      control={form.control}
                      name={`levels.${index}.behavioralIndicator`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Badge
                              variant={levelInfo.number >= 4 ? 'default' : 'secondary'}
                              className="font-mono"
                            >
                              Level {levelInfo.number}
                            </Badge>
                            <span className="text-sm font-normal text-muted-foreground">
                              {levelInfo.label}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={`Describe behaviors at ${levelInfo.label} level...`}
                              rows={2}
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Competency'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
