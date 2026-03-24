import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function Account() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    api.get('/progress')
      .then(res => { setStats(res.data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    setDeleting(true)
    try {
      await api.delete('/auth/account')
      await logout()
      navigate('/')
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-bg-light">

      {/* Header */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-marine text-sm font-medium hover:underline">
          &larr; Clinical Dashboard
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <h1 className="text-2xl font-semibold text-heading mb-2">My Account</h1>
        <p className="text-body-dark text-sm mb-8">Your personal details and account settings.</p>

        {/* Profile Card */}
        <div className="bg-white rounded-card border border-border-default p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: '#0c3a5c' }}>
              {(user?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-heading text-lg">{user?.email}</div>
              {memberSince && (
                <div className="text-xs text-body-dark">Member since {memberSince}</div>
              )}
            </div>
          </div>

          <div className="border-t border-border-default pt-5">
            <h2 className="font-semibold text-heading text-sm mb-3">Account Details</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-body-dark">Email</span>
                <span className="text-sm text-heading font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-body-dark">Account ID</span>
                <span className="text-sm text-heading font-medium">#{user?.id}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-body-dark">Plan</span>
                <span className="text-sm text-heading font-medium">Free Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Stats Card */}
        <div className="bg-white rounded-card border border-border-default p-6 mb-6">
          <h2 className="font-semibold text-heading text-sm mb-4">Your Study Stats</h2>
          {loading ? (
            <p className="text-sm text-body-dark">Loading...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-marine">{stats.total_attempted}</div>
                <div className="text-xs text-body-dark mt-1">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-marine">{stats.overall_percentage}%</div>
                <div className="text-xs text-body-dark mt-1">Correct Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-marine">{stats.unique_questions}</div>
                <div className="text-xs text-body-dark mt-1">Unique Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-marine">
                  {stats.total_in_bank > 0
                    ? Math.round((stats.unique_questions / stats.total_in_bank) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-body-dark mt-1">Bank Coverage</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-body-dark">No study data yet. Start an assessment to see your stats here.</p>
          )}
        </div>

        {/* Data & Privacy Card */}
        <div className="bg-white rounded-card border border-border-default p-6 mb-6">
          <h2 className="font-semibold text-heading text-sm mb-3">Data &amp; Privacy</h2>
          <p className="text-sm text-body-dark mb-4">
            We store your email, assessment answers, and progress data to provide a personalised experience.
            Your password is hashed and never stored in plain text.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/privacy')}
              className="text-sm text-marine font-medium hover:underline"
            >
              Privacy Policy
            </button>
            <span className="text-body-dark">&middot;</span>
            <button
              onClick={() => navigate('/terms')}
              className="text-sm text-marine font-medium hover:underline"
            >
              Terms &amp; Conditions
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-card border border-border-default p-6">
          <h2 className="font-semibold text-heading text-sm mb-4">Account Actions</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm w-full"
            >
              Sign Out
            </button>

            {/* Reset Question Bank */}
            <div className="border-t border-border-default pt-4 mt-1">
              <p className="text-xs text-body-dark mb-3">
                This will permanently delete all your assessment history and answer data.
                Your Diagnostic Assessment results will be preserved. This cannot be undone.
              </p>
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="text-sm font-medium px-4 py-2 rounded-btn border text-amber-600 border-amber-300 hover:bg-amber-50 transition-colors w-full"
                >
                  Reset Question Bank
                </button>
              ) : (
                <div>
                  <button
                    onClick={async () => {
                      setResetting(true)
                      try {
                        await api.delete('/auth/reset-progress')
                        navigate('/dashboard', { state: { resetSuccess: true } })
                      } catch (err) {
                        console.error('Reset failed:', err)
                        setResetting(false)
                        setResetConfirm(false)
                      }
                    }}
                    disabled={resetting}
                    className="text-sm font-medium px-4 py-2 rounded-btn border bg-amber-600 text-white border-amber-600 hover:bg-amber-700 transition-colors w-full disabled:opacity-50"
                  >
                    {resetting ? 'Resetting...' : 'Click again to confirm reset'}
                  </button>
                  {!resetting && (
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="text-xs text-body-dark mt-2 hover:underline w-full text-center"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-border-default pt-4 mt-1">
              <p className="text-xs text-body-dark mb-3">
                Deleting your account will permanently remove all your data, including assessment history and progress.
                This cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={`text-sm font-medium px-4 py-2 rounded-btn border transition-colors w-full ${
                  deleteConfirm
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                    : 'text-red-600 border-red-300 hover:bg-red-50'
                } disabled:opacity-50`}
              >
                {deleting ? 'Deleting...' : deleteConfirm ? 'Click again to confirm deletion' : 'Delete My Account'}
              </button>
              {deleteConfirm && !deleting && (
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs text-body-dark mt-2 hover:underline w-full text-center"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
