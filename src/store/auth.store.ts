import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSession } from '@/types/auth.types'

interface AuthState {
  // State
  user: UserSession | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean

  // Actions
  login: (user: UserSession, token: string) => void
  logout: () => void
  setAuth: (user: UserSession, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void

  // Computed/Helper methods
  isHROrAdmin: () => boolean
  canAccessAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Actions
      login: (user: UserSession, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setAuth: (user: UserSession, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized })
      },

      // Helper methods
      isHROrAdmin: () => {
        const { user } = get()
        if (!user || !user.roleName) return false
        return user.roleName === 'ADMIN' || user.roleName === 'HR'
      },

      canAccessAdmin: () => {
        const { isAuthenticated } = get()
        return isAuthenticated && get().isHROrAdmin()
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
