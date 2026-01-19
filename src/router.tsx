import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

// Polyfill Buffer for client-side (fixes 'Buffer is not defined' from leaked server imports)
import { Buffer } from 'buffer'

if (typeof window !== 'undefined') {
  if (!window.Buffer) {
    window.Buffer = Buffer as any
  }
}

// Import the generated route tree
import { routeTree } from './routeTree.gen'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  })

// Create a new router instance
export const getRouter = () => {
  const queryClient = createQueryClient()

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
