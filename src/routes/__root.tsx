import {
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import AdminLayout from '@/components/layout/admin-layout'
import { Toaster } from '@/components/ui/sonner.tsx'

const publicPaths = ['/login', '/register']

export const Route = createRootRoute({
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

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const isPublicPath = publicPaths.includes(router.state.location.pathname)

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {isPublicPath ? children : <AdminLayout>{children}</AdminLayout>}
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
        <Scripts />
      </body>
    </html>
  )
}
