
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserSkillsFn, deleteUserSkillFn } from '@/server/skills.server'
import { useAuthStore } from '@/store/auth.store'
import { AddSkillDialog } from '@/components/skills/add-skill-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, TrendingUp, Brain, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export const Route = createFileRoute('/competencies/my-skills/')({
  component: MySkillsPage,
})

function MySkillsPage() {
  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()

  // 1. Fetch Skills
  const { data: skillsResult } = useSuspenseQuery({
    queryKey: ['user-skills'],
    queryFn: () => getUserSkillsFn({ data: { token: token! } }),
  })

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return deleteUserSkillFn({ data: { token: token!, id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] })
      toast.success('Skill removed')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove skill')
    },
  })

  const skills = skillsResult.data || []

  // Group skills
  const hardSkills = skills.filter((s: any) => s.skill.type === 'HARD_SKILL')
  const softSkills = skills.filter((s: any) => s.skill.type === 'SOFT_SKILL')

  // Sort by level (desc)
  hardSkills.sort((a: any, b: any) => (b.level?.levelOrder || 0) - (a.level?.levelOrder || 0))
  softSkills.sort((a: any, b: any) => (b.level?.levelOrder || 0) - (a.level?.levelOrder || 0))

  // Prepare Chart Data (Top 6 skills by level)
  const chartData = [...skills]
    .sort((a: any, b: any) => (b.level?.levelOrder || 0) - (a.level?.levelOrder || 0))
    .slice(0, 6)
    .map((s: any) => ({
      subject: s.skill.name,
      A: s.level?.levelOrder || 0,
      fullMark: 5,
    }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
          <p className="text-muted-foreground mt-2">
            Manage your professional skills and proficiency levels.
          </p>
        </div>
        <AddSkillDialog />
      </div>

      {/* Overview Stats & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skills.length}</div>
              <p className="text-xs text-muted-foreground">
                {hardSkills.length} Hard / {softSkills.length} Soft
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Proficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {skills.length > 0 ? (Math.max(...skills.map((s: any) => s.level?.levelOrder || 0))) + '/5' : 'N/A'} 
              </div>
              <p className="text-xs text-muted-foreground">Highest level achieved</p>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Skill Profile Radar</CardTitle>
            <CardDescription>Visual representation of your top skills</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] w-full flex justify-center">
            {chartData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name="My Skill"
                    dataKey="A"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
                <GraduationCap className="h-10 w-10 mb-2 opacity-20" />
                <p>Not enough data for chart (add specific skills)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skill Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hard Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               🖥️ Hard Skills
              <Badge variant="secondary" className="ml-auto">{hardSkills.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hardSkills.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No hard skills added yet.</p>
            )}
            {hardSkills.map((item: any) => (
              <SkillItem 
                key={item.id} 
                item={item} 
                onDelete={() => deleteMutation.mutate(item.id)} 
              />
            ))}
          </CardContent>
        </Card>

        {/* Soft Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               🤝 Soft Skills
              <Badge variant="secondary" className="ml-auto">{softSkills.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {softSkills.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No soft skills added yet.</p>
            )}
            {softSkills.map((item: any) => (
              <SkillItem 
                key={item.id} 
                item={item} 
                onDelete={() => deleteMutation.mutate(item.id)} 
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SkillItem({ item, onDelete }: { item: any, onDelete: () => void }) {
  const levelColor = (level: number) => {
    if (level === 5) return "bg-purple-100 text-purple-700 border-purple-200"
    if (level === 4) return "bg-blue-100 text-blue-700 border-blue-200"
    if (level === 3) return "bg-green-100 text-green-700 border-green-200"
    return "bg-gray-100 text-gray-700 border-gray-200"
  }

  return (
    <div className="flex items-start justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all group">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{item.skill.name}</h3>
          <Badge variant="outline" className={cn("text-[10px] h-5", levelColor(item.level?.levelOrder || 0))}>
            {item.level?.name}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{item.skill.category}</p>
        {item.note && <p className="text-xs mt-2 italic text-gray-500">"{item.note}"</p>}
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Simple Helper for styles
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(" ")
