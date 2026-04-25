import { authStore } from '@/lib/auth-store'

import { Navigate, Outlet } from 'react-router-dom'

export function AuthGuard() {
  const token = authStore((state) => state.token)
  if (!token) {
    return <Navigate to='/login' replace />
  }
  return <Outlet />
}
