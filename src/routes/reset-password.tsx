import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { GalleryVerticalEnd } from 'lucide-react'
import { ResetPasswordForm } from '@/components/reset-password-form'

const resetPasswordSearchSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search) => resetPasswordSearchSchema.parse(search),
  component: RouteComponent,
  errorComponent: ({ error }) => {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="text-center text-destructive">
                <h1 className="text-2xl font-bold">Invalid Link</h1>
                <p>{error.message}</p>
                 <a href="/login" className="underline underline-offset-4 mt-4 block">
                  Back to Login
                </a>
            </div>
        </div>
    )
  }
})

function RouteComponent() {
  const { token } = Route.useSearch()

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          HRM Inc.
        </a>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  )
}
