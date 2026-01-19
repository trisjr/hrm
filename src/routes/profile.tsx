import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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

function RouteComponent() {
  const token = useAuthStore((state) => state.token)
  const router = useRouter()
  const [data, setData] = useState<{
    user: any
    educationExperience: any[]
    pendingRequest: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Nếu không có token, chuyển hướng về login
      if (!token) {
        router.navigate({ to: '/login' })
        return
      }

      try {
        const [profileRes, eduRes, pendingReqRes] = (await Promise.all([
          getMyProfileFn({ data: { token } }),
          getMyEducationExperienceFn({ data: { token } }),
          getMyPendingProfileRequestFn({ data: { token } }),
        ])) as any

        setData({
          user: profileRes.user,
          educationExperience: eduRes.items,
          pendingRequest: pendingReqRes.request,
        })
      } catch (error) {
        console.error('Failed to load profile', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token, router])

  if (isLoading || !data) {
    return (
      <ProfileLayout
        sidebar={
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        }
        content={
          <div className="space-y-6">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        }
      />
    )
  }

  return (
    <ProfileLayout
      sidebar={
        <UserInfoSidebar user={data.user} pendingRequest={data.pendingRequest} />
      }
      content={<EducationExperienceList items={data.educationExperience} />}
    />
  )
}
