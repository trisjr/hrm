import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { createIDPSchema, CreateIDPInput, activityTypeEnum } from '@/lib/competency.schemas'
import { createIDPFn } from '@/server/idp.server'
import { getAssessmentByIdFn } from '@/server/assessments.server'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconPlus, IconTrash } from '@tabler/icons-react'

// Define search params schema
const searchSchema = z.object({
  assessmentId: z.number().optional(),
})

export const Route = createFileRoute('/competencies/idp/create')({
  component: RouteComponent,
  validateSearch: (search) => searchSchema.parse(search),
})

function RouteComponent() {
  const { assessmentId } = Route.useSearch()
  const token = useAuthStore((state: any) => state.token)
  const navigate = useNavigate()

  // Fetch assessment to get competencies list
  const { data: assessmentData } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => assessmentId ? getAssessmentByIdFn({ data: { token: token!, params: { assessmentId } } } as any) : null,
    enabled: !!assessmentId,
  })

  // Prepare competency options (from assessment details if available)
  const competencies = assessmentData?.data?.details.map((d: any) => ({
    id: d.competencyId,
    name: d.competency.name,
    isWeakness: (d.finalScore || 0) < (d.requiredLevel || 0)
  })) || []

  const form = useForm<CreateIDPInput>({
    resolver: zodResolver(createIDPSchema),
    defaultValues: {
      assessmentId: assessmentId,
      goal: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], // Default 6 months
      activities: [{
        competencyId: 0, // Placeholder
        activityType: 'TRAINING',
        description: '',
        targetDate: '',
      }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'activities',
  })

  const createMutation = useMutation({
    mutationFn: async (values: CreateIDPInput) => {
      await createIDPFn({ data: { token: token!, data: values } } as any)
    },
    onSuccess: () => {
      toast.success('IDP created successfully')
      navigate({ to: '/competencies/idp' })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create IDP')
    },
  })

  const onSubmit = (values: CreateIDPInput) => {
    // Basic validation for competencyId
    if (values.activities.some(a => !a.competencyId || a.competencyId === 0)) {
        toast.error("Please select a competency for all activities")
        return
    }
    createMutation.mutate(values)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Create Individual Development Plan</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
                <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Development Goal</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g. Prepare for Senior Developer role..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Development Activities</h2>
                <Button type="button" size="sm" onClick={() => append({ 
                    competencyId: 0, 
                    activityType: 'TRAINING', 
                    description: '',
                    targetDate: '' 
                })}>
                    <IconPlus className="mr-2 h-4 w-4" /> Add Activity
                </Button>
            </div>

            {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardContent className="pt-6 relative">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            onClick={() => remove(index)}
                        >
                            <IconTrash className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name={`activities.${index}.competencyId`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Competency To Improve</FormLabel>
                                        <Select 
                                            onValueChange={(val) => field.onChange(parseInt(val))} 
                                            value={field.value ? field.value.toString() : undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select competency" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {competencies.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name} {c.isWeakness ? '(Gap)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`activities.${index}.activityType`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Activity Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {activityTypeEnum.options.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                             <FormField
                                control={form.control}
                                name={`activities.${index}.description`}
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Description & Actions</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="What specifically will you do?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`activities.${index}.targetDate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Date (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4">
             <Button variant="outline" type="button" onClick={() => navigate({ to: '/competencies/my-assessment' })}>Cancel</Button>
             <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create IDP'}
             </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
