/**
 * Verify Account Page
 * Verify user account via token from email
 */
import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  GalleryVerticalEnd,
  Loader2,
  XCircle,
} from 'lucide-react'
import { verifyAccountFn } from '@/server/verify.server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'

export const Route = createFileRoute('/verify')({
  component: VerifyComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    }
  },
})

type VerifyState = 'loading' | 'success' | 'error'

function VerifyComponent() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [state, setState] = useState<VerifyState>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Auto verify when component mounts
    if (!token) {
      setState('error')
      setMessage('Invalid token. Please check the link.')
      return
    }

    verifyAccount()
  }, [token])

  useEffect(() => {
    // Countdown and redirect on success
    if (state === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }

    if (state === 'success' && countdown === 0) {
      navigate({ to: '/login' })
    }
  }, [state, countdown, navigate])

  const verifyAccount = async () => {
    try {
      setState('loading')
      const response = await verifyAccountFn({ data: { token } })

      setState('success')
      setMessage(response.message)

      if (response.alreadyVerified) {
        // Redirect faster if already verified
        setCountdown(3)
      }
    } catch (error) {
      setState('error')
      setMessage(
        error instanceof Error ? error.message : 'An unknown error occurred',
      )
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          HRM Inc.
        </a>

        {/* Verify Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Verify Account</CardTitle>
            <CardDescription>
              {state === 'loading' && 'Verifying your account...'}
              {state === 'success' && 'Verification successful!'}
              {state === 'error' && 'Verification failed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* Loading State */}
            {state === 'loading' && (
              <>
                <Loader2 className="text-primary size-16 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Please wait a moment...
                </p>
              </>
            )}

            {/* Success State */}
            {state === 'success' && (
              <>
                <CheckCircle2 className="size-16 text-green-600" />
                <div className="text-center">
                  <p className="text-foreground mb-2 font-medium">{message}</p>
                  <p className="text-muted-foreground text-sm">
                    Redirecting to login page in {countdown} seconds...
                  </p>
                </div>
                <Button
                  onClick={() => navigate({ to: '/login' })}
                  className="w-full"
                >
                  Login Now
                </Button>
              </>
            )}

            {/* Error State */}
            {state === 'error' && (
              <>
                <XCircle className="size-16 text-red-600" />
                <div className="text-center">
                  <p className="text-foreground mb-2 font-medium">{message}</p>
                  <p className="text-muted-foreground text-sm">
                    Token may have expired or is invalid.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <Button
                    onClick={verifyAccount}
                    variant="default"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate({ to: '/login' })}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-balance text-muted-foreground text-center text-xs">
          If you encounter any issues, please contact{' '}
          <a
            href="mailto:support@hrm.com"
            className="hover:text-primary underline"
          >
            support@hrm.com
          </a>
        </div>
      </div>
    </div>
  )
}
