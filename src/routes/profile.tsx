import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  getMyEducationExperienceFn,
  getMyProfileFn,
} from '@/server/profile.server'
import { getMyPendingProfileRequestFn } from '@/server/profile-request.server'
import { useAuthStore } from '@/store/auth.store'
import { EducationExperienceList } from '@/components/profile/education-experience-list'
import { ProfileLayout } from '@/components/profile/profile-layout'
import { UserInfoSidebar } from '@/components/profile/user-info-sidebar'

export const Route = createFileRoute('/profile')({
  loader: async () => {
    const token = useAuthStore.getState().token

    if (!token) {
      throw redirect({ to: '/login' })
    }

    try {
      const [profileRes, eduRes, pendingReqRes] = await Promise.all([
        getMyProfileFn({ data: { token } }),
        getMyEducationExperienceFn({ data: { token } }),
        getMyPendingProfileRequestFn({ data: { token } }),
      ]) as [any, any, { request: { status: 'PENDING' | 'APPROVED' | 'REJECTED' | null } | undefined | null }]

      return {
        user: profileRes.user,
        educationExperience: eduRes.items,
        pendingRequest: pendingReqRes.request,
      }
    } catch (error) {
      console.error('Failed to load profile', error)
      // Potentially redirect to login if unauthorized
      throw error
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { user, educationExperience, pendingRequest } = Route.useLoaderData()

  return (
    <ProfileLayout
      sidebar={
        <UserInfoSidebar user={user} pendingRequest={pendingRequest} />
      }
      content={<EducationExperienceList items={educationExperience} />}
    />
  )
}
