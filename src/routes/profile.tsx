import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  getMyEducationExperienceFn,
  getMyProfileFn,
} from '@/server/profile.server'
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
      const [profileRes, eduRes] = await Promise.all([
        getMyProfileFn({ data: { token } }),
        getMyEducationExperienceFn({ data: { token } }),
      ])
      return { user: profileRes.user, educationExperience: eduRes.items }
    } catch (error) {
      console.error('Failed to load profile', error)
      // Potentially redirect to login if unauthorized
      throw error
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { user, educationExperience } = Route.useLoaderData()

  return (
    <ProfileLayout
      sidebar={<UserInfoSidebar user={user} />}
      content={<EducationExperienceList items={educationExperience} />}
    />
  )
}
