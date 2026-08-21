/**
 * Route guard components.
 *
 * PrivateRoute – redirects to /login if the user is not authenticated.
 * PublicRoute  – redirects to / if the user IS authenticated (auth pages).
 * CreatorRoute – redirects to /create (upgrade prompt) if not a creator.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingScreen } from '../ui'

export function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

export function CreatorRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  const isCreator = user?.role === 'creator' || user?.role === 'admin'
  if (!isCreator) {
    return <Navigate to="/create" replace />
  }
  return children
}
