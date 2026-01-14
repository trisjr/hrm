import { ChangePasswordForm } from '@/components/change-password-form'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { GalleryVerticalEnd } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/change-password')({
  component: RouteComponent,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
})

function RouteComponent() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          HRM Inc.
        </Link>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
