import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

import appCss from '../styles.css?url'
import AdminLayout from '@/components/layout/admin-layout'
import { Toaster } from '@/components/ui/sonner.tsx'
import { useAuthStore } from '@/store/auth.store'
import { validateTokenFn } from '@/server/validate-token.server'
import { NotFound } from '@/components/not-found'

const publicPaths = [
  '/login',
  '/register',
  '/change-password',
  '/mailbox',
  '/verify',
  '/privacy-policy',
  '/forgot-password',
  '/reset-password',
]

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'HRM - Human Resource Management',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument() {
  const router = useRouter()
  const { queryClient } = Route.useRouteContext()
  const {
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    setAuth,
    clearAuth,
    setLoading,
    setInitialized,
    isHROrAdmin,
  } = useAuthStore()

  const currentPath = router.state.location.pathname
  const isPublicPath = publicPaths.includes(currentPath)
  const isLoginPath = currentPath === '/login'

  // Initialize auth on mount
  React.useEffect(() => {
    const initAuth = async () => {
      if (isInitialized) return

      setLoading(true)

      // Check if we have a token in storage
      if (token) {
        try {
          // Validate token with server
          const result = await validateTokenFn({ data: { token } })

          if (result.valid && result.user) {
            // Token is valid, set auth state
            setAuth(result.user, token)
          } else {
            // Token is invalid, clear auth
            clearAuth()
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          clearAuth()
        }
      }

      setLoading(false)
      setInitialized(true)
    }

    initAuth()
  }, [token, isInitialized, setAuth, clearAuth, setLoading, setInitialized])

  // Handle redirects after initialization
  React.useEffect(() => {
    if (!isInitialized || isLoading) return

    // Redirect unauthenticated users from protected routes
    if (!isAuthenticated && !isPublicPath) {
      window.location.href = '/login'
      return
    }

    console.log('TJ - __root.tsx - line 117', { isInitialized, isLoginPath })

    // Redirect authenticated users from login page based on role
    if (isAuthenticated && isLoginPath) {
      const redirectPath = isHROrAdmin() ? '/admin' : '/'
      router.navigate({ to: redirectPath })
    }
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    isPublicPath,
    isLoginPath,
    router,
    isHROrAdmin,
  ])

  // Show loading screen during initialization
  if (!isInitialized || isLoading) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
          <Scripts />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {isPublicPath ? (
            <Outlet />
          ) : (
            <AdminLayout>
              <Outlet />
            </AdminLayout>
          )}
          <Toaster position="top-right" richColors />
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
