import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '../../lib/types'

interface AuthState {
  user: Member | null
  isAuthenticated: boolean
  setupToken: string | null
  onboardingPhone: string | null
  setAuth: (user: Member) => void
  setSetupToken: (token: string, phone: string) => void
  clearSetupToken: () => void
  logout: () => void
}

// Tokens are no longer handled here — they live only in the httpOnly
// cookies the backend sets, invisible to this (or any) JS. This store just
// tracks who's logged in for UI purposes; the cookie is the actual source
// of truth for whether a request is authenticated.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setupToken: null,
      onboardingPhone: null,
      setAuth: (user) => {
        set({ user, isAuthenticated: true, setupToken: null, onboardingPhone: null })
      },
      setSetupToken: (token, phone) => set({ setupToken: token, onboardingPhone: phone }),
      clearSetupToken: () => set({ setupToken: null, onboardingPhone: null }),
      logout: () => {
        set({ user: null, isAuthenticated: false, setupToken: null, onboardingPhone: null })
      },
    }),
    {
      name: 'mutan-member-auth',
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)
