import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If they were redirected here from a protected page, go back there after login
  const returnTo = location.state?.returnTo || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(returnTo)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center px-4">

      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">⚕</span>
          <span className="text-marine font-semibold text-xl">DiscoLabs</span>
        </div>
        <p className="text-body-dark text-sm">Sign in to your account</p>
      </div>

      <div className="card w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-traffic-bg border border-red-traffic text-red-traffic text-sm px-4 py-3 rounded-btn">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-body-dark mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-marine font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-center text-sm text-body-dark mt-3">
          Not sure if you need this?{' '}
          <Link to="/rapid-diagnostic" className="text-marine font-medium hover:underline">
            Take the free assessment first
          </Link>
        </p>
      </div>

    </div>
  )
}
