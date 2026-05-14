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
            id: '1f5728a8-b3f1-42e9-a40f-c343bb29d140', // REAL USER ID from database
            email: 'mario.rossi@clinicarossi.it',
            name: 'Dr. Mario Rossi',
            role: 'client',
            language: 'it',
            clientId: '34e85227-82d5-45dc-9926-2ea72c0bb18f', // Real client ID from DB
            client: {
              id: '34e85227-82d5-45dc-9926-2ea72c0bb18f',
              studioName: 'Clinica Dentale Rossi',
              contactPerson: 'Dr. Mario Rossi',
              address: 'Via Roma 123',
              city: 'Milano',
              postalCode: '20100',
              country: 'Italia',
              phone: '+39 02 1234567',
              email: 'info@clinicarossi.it',
              whatsapp: '+39 333 1234567',
              vatNumber: 'IT12345678901',
              taxCode: 'RSSMRA70A01F205X',
              active: true,
              createdAt: '2026-01-27T22:23:15.712Z',
              updatedAt: new Date().toISOString(),
            },
            createdAt: '2026-01-27T22:23:15.712Z',
            updatedAt: new Date().toISOString(),
          },
          'dev-token'
        )
        console.log('✅ Logged in with clientId: 34e85227-82d5-45dc-9926-2ea72c0bb18f')
      } else {
        console.log('🔄 Auto-logging in as Admin (REAL DATA)')
        useAuthStore.getState().login(
          {
            id: '71c008a5-009f-48de-80c5-5b7cc366f1e9', // REAL USER ID from database
            email: 'admin@shen3d.com',
            name: 'Admin Shen3D',
            role: 'admin',
            language: 'it',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'dev-token'
        )
      }
    }
  }, 100)
}
