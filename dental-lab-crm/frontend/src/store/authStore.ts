import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean

  // Actions
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  login: (user: User, accessToken: string, refreshToken?: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      setRefreshToken: (refreshToken) =>
        set({ refreshToken }),

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
          isLoading: false, // Set loading to false after hydration
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// For development: auto-login based on current URL
// Set VITE_DISABLE_AUTO_LOGIN=true to disable auto-login even in DEV
const disableAutoLogin = import.meta.env.VITE_DISABLE_AUTO_LOGIN === 'true' || import.meta.env.PROD

if (import.meta.env.DEV && !disableAutoLogin) {
  // Force clear old localStorage data (migration from old structure)
  const STORAGE_VERSION = '7.0'; // FORCE CLEAR - Unified auth storage with refreshToken
  const currentVersion = localStorage.getItem('auth-storage-version');

  if (currentVersion !== STORAGE_VERSION) {
    console.log('🔄 Upgrading auth storage to v' + STORAGE_VERSION);
    localStorage.removeItem('auth-storage');
    localStorage.setItem('auth-storage-version', STORAGE_VERSION);
  }

  setTimeout(() => {
    const state = useAuthStore.getState()
    const currentUser = state.user

    // Check if user has fake/old data - force re-login
    const hasFakeData = currentUser?.id === 'client-1' ||
                        currentUser?.id === 'dev-client-user' ||
                        currentUser?.id === 'dev-admin' ||
                        !currentUser?.clientId && currentUser?.role === 'client'

    if (hasFakeData) {
      console.log('🧹 Detected fake/old user data, clearing and re-logging...')
      localStorage.removeItem('auth-storage')
      useAuthStore.getState().logout()
    }

    if (!state.isAuthenticated || state.isLoading || hasFakeData) {
      // Check URL to determine which user to login as
      const isPortal = window.location.pathname.startsWith('/portal')

      if (isPortal) {
        console.log('🔄 Auto-logging in as Dr. Mario Rossi (REAL DATA)')
        useAuthStore.getState().login(
          {
            id: '450736b5-271f-4a5d-b39d-e5ffe44ca1a8', // REAL USER ID from database (seed)
            email: 'mario.rossi@clinicarossi.it',
            name: 'Dr. Mario Rossi',
            role: 'client',
            language: 'it',
            clientId: 'cd31937c-5447-416a-8062-883d300bb542', // Real client ID from DB (seed)
            client: {
              id: 'cd31937c-5447-416a-8062-883d300bb542',
              studioName: 'Clinica Dentale Rossi',
              contactPerson: 'Dr. Mario Rossi',
              address: 'Via Roma 123',
              city: 'Milano',
              postalCode: '20100',
              country: 'Israel',
              phone: '+972 3 1234567',
              email: 'info@clinic-rossi.co.il',
              whatsapp: '+972 50 1234567',
              vatNumber: '514123456',
              taxCode: '',
              active: true,
              createdAt: '2026-02-05T00:20:45.208Z',
              updatedAt: new Date().toISOString(),
            },
            createdAt: '2026-02-05T00:20:45.208Z',
            updatedAt: new Date().toISOString(),
          },
          'dev-token'
        )
        console.log('✅ Logged in with clientId: cd31937c-5447-416a-8062-883d300bb542')
      } else {
        console.log('🔄 Auto-logging in as Admin (REAL DATA)')
        useAuthStore.getState().login(
          {
            id: 'a0bbc133-f60d-40f8-899e-6fdaebad043f', // REAL USER ID from database (seed)
            email: 'admin@shen3d.com',
            name: 'Admin Principale',
            role: 'admin',
            language: 'it',
            createdAt: '2026-02-05T00:20:45.208Z',
            updatedAt: new Date().toISOString(),
          },
          'dev-token'
        )
      }
    }
  }, 100)
}
