import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import type { UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'client') {
      return <Navigate to="/portal" replace />
    }
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
