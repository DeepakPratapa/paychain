import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

export const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [hasShownToast, setHasShownToast] = useState(false)

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If route requires auth and user is not authenticated, redirect to home
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // If route requires NO auth (like login page) and user IS authenticated, redirect to dashboard
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Role-based access control
  if (isAuthenticated && allowedRoles && user) {
    const userRole = user.user_type
    
    if (!allowedRoles.includes(userRole)) {
      // Show toast only once
      if (!hasShownToast) {
        if (userRole === 'employer') {
          toast.error('Employers cannot browse jobs. You can create jobs from your dashboard.')
        } else {
          toast.error('Workers cannot create jobs. Browse available jobs instead.')
        }
        setHasShownToast(true)
      }
      
      // Redirect based on role
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute
