
import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { searchMasterSkillsFn, upsertUserSkillFn } from '@/server/skills.server'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

export function AddSkillDialog() {
  const [open, setOpen] = useState(false)
  const [skillOpen, setSkillOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<any>(null)
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const token = useAuthStore((state: any) => state.token)
  const queryClient = useQueryClient()

  // 1. Search Skills
  const { data: skillsResult } = useQuery({
    queryKey: ['master-skills', searchQuery],
    queryFn: () => searchMasterSkillsFn({ data: { token: token!, query: searchQuery } }),
    enabled: !!token,
  })

  // 2. Upsert Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedSkill || !selectedLevelId) return
      return upsertUserSkillFn({
        data: {
          token: token!,
          skillId: selectedSkill.id,
          levelId: selectedLevelId,
          note,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] })
      toast.success('Skill updated successfully')
      setOpen(false)
      // Reset form
      setSelectedSkill(null)
      setSelectedLevelId(null)
      setNote('')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update skill')
    },
  })

  const masterSkills = skillsResult?.data || []

  // Ensure we select a default level if skill changes (optional, here we force user to select)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Skill Selector */}
          <div className="flex flex-col space-y-2">
            <Label>Select Skill</Label>
            <Popover open={skillOpen} onOpenChange={setSkillOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={skillOpen}
                  className="w-full justify-between"
                >
                  {selectedSkill ? selectedSkill.name : "Search skills..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search framework, language..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery} 
                  />
                  <CommandList>
                    <CommandEmpty>No skill found.</CommandEmpty>
                    <CommandGroup>
                      {masterSkills.map((skill: any) => (
                        <CommandItem
                          key={skill.id}
                          value={skill.name} // fix radix value
                          onSelect={() => {
                            setSelectedSkill(skill)
                            setSelectedLevelId(null) // Reset level when skill changes
                            setSkillOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSkill?.id === skill.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{skill.name}</span>
                            <span className="text-xs text-muted-foreground">{skill.type} • {skill.category}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Level Selector */}
          {selectedSkill && (
            <div className="flex flex-col space-y-3">
              <Label>Proficiency Level</Label>
              <div className="grid grid-cols-1 gap-2">
                {selectedSkill.levels?.map((level: any) => (
                  <div
                    key={level.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent",
                      selectedLevelId === level.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border"
                    )}
                    onClick={() => setSelectedLevelId(level.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{level.name}</div>
                      {/* Optional: Show criteria here if needed */}
                      {/* <div className="text-xs text-muted-foreground mt-1">Level {level.levelOrder}</div> */}
                    </div>
                    {selectedLevelId === level.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                ))}
                {selectedSkill.levels?.length === 0 && (
                  <p className="text-sm text-yellow-600">No levels defined for this skill.</p>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="flex flex-col space-y-2">
            <Label>Note (Optional)</Label>
            <Textarea 
              placeholder="e.g. Certified in 2024..." 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={!selectedSkill || !selectedLevelId || mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
