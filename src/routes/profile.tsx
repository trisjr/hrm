import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getMyEducationExperienceFn,
  getMyProfileFn,
} from '@/server/profile.server'
import { getMyPendingProfileRequestFn } from '@/server/profile-request.server'
import { useAuthStore } from '@/store/auth.store'
import { EducationExperienceList } from '@/components/profile/education-experience-list'
import { ProfileLayout } from '@/components/profile/profile-layout'
import { UserInfoSidebar } from '@/components/profile/user-info-sidebar'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/profile')({
  component: RouteComponent,
})

// Define types locally based on component expectations
// Ideally these should be shared types, but for now we define them here to avoid 'any'
interface ProfileData {
  user: {
    employeeCode: string
    email: string
    phone?: string | null
    role?: { roleName: string } | null
    profile?: {
      fullName: string
      avatarUrl?: string | null
      address?: string | null
      dob?: string | null
      gender?: string | null
      joinDate?: string | null
      unionJoinDate?: string | null
      unionPosition?: string | null
      idCardNumber?: string | null
    } | null
    careerBand?: {
      title: string
    } | null
  }
  educationExperience: Array<{
    id: number
    organizationName: string
    positionMajor: string | null
    startDate: string | null
    endDate: string | null
    description: string | null
    type: 'Education' | 'Experience'
  }>
  pendingRequest: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  } | null
}

function RouteComponent() {
  const token = useAuthStore((state) => state.token)
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If no token immediately, redirect
    if (!token) {
      router.navigate({ to: '/login' })
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [profileRes, eduRes, pendingReqRes] = await Promise.all([
          getMyProfileFn({ data: { token } }),
          getMyEducationExperienceFn({ data: { token } }),
          getMyPendingProfileRequestFn({ data: { token } }),
        ])

        setData({
          user: profileRes.user as ProfileData['user'],
          educationExperience: eduRes.items as ProfileData['educationExperience'],
          pendingRequest: pendingReqRes.request as ProfileData['pendingRequest'],
        })
      } catch (err: any) {
        console.error('Failed to load profile', err)
        setError('Failed to load profile data.')
        
        // Handle unauthorized specifically if possible, generic for now
        if (err.message && err.message.includes('Unauthorized')) {
           toast.error('Session expired. Please login again.')
           router.navigate({ to: '/login' })
        } else {
           toast.error('Failed to load profile. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, router])

  if (isLoading) {
    return (
      <ProfileLayout
        sidebar={
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        }
        content={
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        }
      />
    )
  }

  if (error || !data) {
     return (
        <ProfileLayout 
           sidebar={<div className="text-red-500 font-medium">Error loading profile.</div>}
           content={
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                 <p className="mb-4">{error || "Profile not found"}</p>
                 <button 
                    onClick={() => window.location.reload()}
                    className="underline text-primary"
                 >
                    Retry
                 </button>
              </div>
           }
        />
     )
  }

  return (
    <ProfileLayout
      sidebar={
        <UserInfoSidebar
          user={data.user}
          pendingRequest={data.pendingRequest}
        />
      }
      content={<EducationExperienceList items={data.educationExperience} />}
    />
  )
}
