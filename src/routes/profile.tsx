import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  // Ensure we have a token, though useEffect handles redirect, hooks must run
  const enabled = !!token

  useEffect(() => {
    if (!token) {
      router.navigate({ to: '/login' })
    }
  }, [token, router])

  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => getMyProfileFn({ data: { token: token! } }),
    enabled,
  })

  const eduQuery = useQuery({
    queryKey: ['education-experience', 'me'],
    queryFn: () => getMyEducationExperienceFn({ data: { token: token! } }),
    enabled,
  })

  const pendingRequestQuery = useQuery({
    queryKey: ['profile-request', 'me'],
    queryFn: () => getMyPendingProfileRequestFn({ data: { token: token! } }),
    enabled,
  })

  const isLoading =
    profileQuery.isLoading || eduQuery.isLoading || pendingRequestQuery.isLoading
  const isError =
    profileQuery.isError || eduQuery.isError || pendingRequestQuery.isError

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

  if (isError || !profileQuery.data) {
     const errorMessage = profileQuery.error?.message || "Failed to load profile data"
     
     return (
        <ProfileLayout 
           sidebar={<div className="text-red-500 font-medium">Error loading profile.</div>}
           content={
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                 <p className="mb-4">{errorMessage}</p>
                 <button 
                    onClick={() => {
                        profileQuery.refetch()
                        eduQuery.refetch()
                        pendingRequestQuery.refetch()
                    }}
                    className="underline text-primary"
                 >
                    Retry
                 </button>
              </div>
           }
        />
     )
  }

  // Safe to assume data exists here due to checks above
  const user = profileQuery.data.user as ProfileData['user']
  const items = (eduQuery.data?.items || []) as ProfileData['educationExperience']
  const pendingRequest = pendingRequestQuery.data?.request as ProfileData['pendingRequest']

  return (
    <ProfileLayout
      sidebar={
        <UserInfoSidebar
          user={user}
          pendingRequest={pendingRequest}
        />
      }
      content={<EducationExperienceList items={items} />}
    />
  )
}
