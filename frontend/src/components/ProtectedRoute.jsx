import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// This works like a bouncer at a door:
// if you're logged in, you go through; if not, you're sent to /login
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-marine font-medium text-lg">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
