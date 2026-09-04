import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tsm-gray-50 pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-tsm-red-600/30 border-t-tsm-red-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-tsm-navy-800">Verifying session...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    toast.error('Please login to continue.')
    return <Navigate to="/account" replace />
  }

  // Admin access required
  if (adminOnly && !isAdmin) {
    toast.error('Access Denied: Admin privileges required.')
    return <Navigate to="/" replace />
  }

  return children
}
