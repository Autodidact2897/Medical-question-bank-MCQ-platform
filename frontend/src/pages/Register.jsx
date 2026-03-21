import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Grab plan from URL if coming from paywall (e.g. /register?plan=4months)
  const plan = searchParams.get('plan')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      // If they came from paywall, send to Stripe (placeholder)
      if (plan) {
        // TODO: redirect to Stripe checkout
        navigate('/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
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
        <p className="text-body-dark text-sm">
          {plan ? 'Create your account to unlock your full results' : 'Create your account'}
        </p>
      </div>

      <div className="card w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-traffic-bg border border-red-traffic text-red-traffic text-sm px-4 py-3 rounded-btn">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
              placeholder="Dr Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
              placeholder="you@nhs.net"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-body-dark mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-marine font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

    </div>
  )
}
