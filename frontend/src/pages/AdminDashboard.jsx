import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-card border border-border-default p-5 text-center">
      <div className="text-2xl font-bold text-marine">{value}</div>
      <div className="text-xs text-body-dark mt-1">{label}</div>
      {sub && <div className="text-xs text-body-dark mt-0.5 opacity-70">{sub}</div>}
    </div>
  )
}

function BarRow({ label, value, max, percentage, color }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-heading truncate mr-2">{label}</span>
        <span className="text-xs text-body-dark whitespace-nowrap">
          {value} attempts &middot; {percentage}%
        </span>
      </div>
      <div className="h-2.5 bg-grey-light rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color || '#0c3a5c' }}
        />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/admin/metrics')
      .then(res => {
        setMetrics(res.data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Admin metrics error:', err)
        const status = err.response?.status
        const serverMsg = err.response?.data?.error
        if (status === 403) {
          setError('Admin access required.')
        } else if (status === 401) {
          setError('Session expired. Please log out and log back in.')
        } else {
          setError(`Failed to load metrics (${status || 'network error'}): ${serverMsg || err.message}`)
        }
        setLoading(false)
      })
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading admin metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
            Back to Clinical Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Null-safe access — API may return partial data
  const m = {
    users: metrics.users || {},
    answers: metrics.answers || {},
    quiz_sessions: metrics.quiz_sessions || {},
    question_bank: metrics.question_bank || {},
    rapid_diagnostic: metrics.rapid_diagnostic || {},
    by_subject: metrics.by_subject || [],
    by_difficulty: metrics.by_difficulty || [],
    daily_activity: metrics.daily_activity || [],
    top_topics: metrics.top_topics || [],
    active_learners: metrics.active_learners || [],
    recent_users: metrics.recent_users || [],
  }
  const maxSubjectAttempts = m.by_subject.length > 0
    ? Math.max(...m.by_subject.map(s => s.attempted))
    : 1

  // Build a simple sparkline from daily_activity
  const maxDailyAnswers = m.daily_activity.length > 0
    ? Math.max(...m.daily_activity.map(d => d.answers))
    : 1

  return (
    <div className="min-h-screen bg-bg-light">

      {/* Header */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
          <span className="text-xs bg-marine text-white px-2 py-0.5 rounded-full ml-2 font-medium">ADMIN</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <button onClick={() => navigate('/admin/emails')} className="text-body-dark text-sm hover:text-marine">
            Email Briefs
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-body-dark text-sm hover:text-marine">
            User Clinical Dashboard
          </button>
          <span className="text-body-dark text-sm font-medium hidden sm:inline">{user?.email}</span>
          <button onClick={handleLogout} className="text-body-dark font-semibold text-sm hover:text-marine">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <h1 className="text-2xl font-semibold text-heading mb-2">Admin Clinical Dashboard</h1>
        <p className="text-body-dark text-sm mb-8">Site-wide metrics and user activity.</p>

        {/* ── Row 1: Key numbers ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total Users" value={m.users.total} />
          <StatCard label="New (7d)" value={m.users.new_7d} />
          <StatCard label="New (30d)" value={m.users.new_30d} />
          <StatCard label="Questions Answered" value={m.answers.total} />
          <StatCard label="Overall Correct %" value={`${m.answers.overall_correct_pct}%`} />
          <StatCard label="Assessment Sessions" value={m.quiz_sessions.total_sessions} sub={`${m.quiz_sessions.completed_sessions} completed`} />
        </div>

        {/* ── Row 2: Question Bank + Rapid Diagnostic ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-card border border-border-default p-5">
            <h2 className="font-semibold text-heading text-sm mb-3">Question Bank</h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-marine">{m.question_bank.total_questions}</div>
                <div className="text-xs text-body-dark">Total Questions</div>
              </div>
              <div>
                <div className="text-xl font-bold text-marine">{m.question_bank.lna_questions}</div>
                <div className="text-xs text-body-dark">Rapid Diagnostic Questions</div>
              </div>
              <div>
                <div className="text-xl font-bold text-marine">{m.question_bank.total_subjects}</div>
                <div className="text-xs text-body-dark">Subjects</div>
              </div>
              <div>
                <div className="text-xl font-bold text-marine">{m.question_bank.total_topics}</div>
                <div className="text-xs text-body-dark">Topics</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card border border-border-default p-5">
            <h2 className="font-semibold text-heading text-sm mb-3">Rapid Diagnostic (Free Assessment)</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-marine">{m.rapid_diagnostic.total_started}</div>
                <div className="text-xs text-body-dark">Started</div>
              </div>
              <div>
                <div className="text-xl font-bold text-marine">{m.rapid_diagnostic.total_completed}</div>
                <div className="text-xs text-body-dark">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-marine">{m.rapid_diagnostic.avg_score}%</div>
                <div className="text-xs text-body-dark">Avg Performance Score</div>
              </div>
            </div>
            {m.rapid_diagnostic.total_started > 0 && (
              <div className="mt-3 text-xs text-body-dark text-center">
                {Math.round((m.rapid_diagnostic.total_completed / m.rapid_diagnostic.total_started) * 100)}% completion rate
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Daily Activity Chart ── */}
        {m.daily_activity.length > 0 && (
          <div className="bg-white rounded-card border border-border-default p-5 mb-8">
            <h2 className="font-semibold text-heading text-sm mb-4">Daily Activity (Last 30 Days)</h2>
            <div className="flex items-end gap-px" style={{ height: '120px' }}>
              {m.daily_activity.map((day, i) => {
                const height = maxDailyAnswers > 0 ? Math.max((day.answers / maxDailyAnswers) * 100, 3) : 3
                const date = new Date(day.day)
                const label = `${date.getDate()}/${date.getMonth() + 1}`
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-heading text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {label}: {day.answers} answers, {day.active_users} users
                    </div>
                    <div
                      className="w-full rounded-t transition-all duration-200 hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        backgroundColor: '#0c3a5c',
                        minWidth: '4px',
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-body-dark">
                {m.daily_activity.length > 0 && new Date(m.daily_activity[0].day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              <span className="text-xs text-body-dark">
                {m.daily_activity.length > 0 && new Date(m.daily_activity[m.daily_activity.length - 1].day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        )}

        {/* ── Row 4: Subject Performance + Difficulty ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 bg-white rounded-card border border-border-default p-5">
            <h2 className="font-semibold text-heading text-sm mb-4">Performance by Subject</h2>
            {m.by_subject.length > 0 ? (
              m.by_subject.map((s, i) => (
                <BarRow
                  key={i}
                  label={s.subject}
                  value={s.attempted}
                  max={maxSubjectAttempts}
                  percentage={s.percentage}
                  color={s.percentage >= 60 ? '#059669' : '#ef4444'}
                />
              ))
            ) : (
              <p className="text-sm text-body-dark">No data yet.</p>
            )}
          </div>

          <div className="bg-white rounded-card border border-border-default p-5">
            <h2 className="font-semibold text-heading text-sm mb-4">By Difficulty</h2>
            {m.by_difficulty.length > 0 ? (
              <div className="flex flex-col gap-3">
                {m.by_difficulty.map((d, i) => (
                  <div key={i} className="text-center py-3 rounded-card" style={{
                    backgroundColor: d.percentage >= 60 ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${d.percentage >= 60 ? '#059669' : '#ef4444'}20`
                  }}>
                    <div className={`text-lg font-bold ${d.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                      {d.percentage}%
                    </div>
                    <div className="text-xs text-body-dark mt-0.5">{d.difficulty}</div>
                    <div className="text-xs text-body-dark">{d.correct}/{d.attempted}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-body-dark">No data yet.</p>
            )}
          </div>
        </div>

        {/* ── Row 5: Top Topics + Active Learners ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-card border border-border-default p-5">
            <h2 className="font-semibold text-heading text-sm mb-3">Top 10 Most Attempted Topics</h2>
            {m.top_topics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-2 text-xs font-semibold text-heading">Topic</th>
                      <th className="text-right py-2 text-xs font-semibold text-heading">Attempts</th>
                      <th className="text-right py-2 text-xs font-semibold text-heading">Performance Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.top_topics.map((t, i) => (
                      <tr key={i} className="border-b border-border-default last:border-0">
                        <td className="py-2 text-xs text-heading">{t.topic}</td>
                        <td className="py-2 text-xs text-body-dark text-right">{t.attempted}</td>
                        <td className={`py-2 text-xs text-right font-semibold ${t.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-body-dark">No data yet.</p>
            )}
          </div>

          <div className="bg-white rounded-card border border-border-default p-5">
            <h2 className="font-semibold text-heading text-sm mb-3">Most Active Learners</h2>
            {m.active_learners.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left py-2 text-xs font-semibold text-heading">User</th>
                      <th className="text-right py-2 text-xs font-semibold text-heading">Answers</th>
                      <th className="text-right py-2 text-xs font-semibold text-heading">Sessions</th>
                      <th className="text-right py-2 text-xs font-semibold text-heading">Performance Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.active_learners.map((u, i) => (
                      <tr key={i} className="border-b border-border-default last:border-0">
                        <td className="py-2 text-xs text-heading truncate max-w-[160px]">{u.email}</td>
                        <td className="py-2 text-xs text-body-dark text-right">{u.total_answers}</td>
                        <td className="py-2 text-xs text-body-dark text-right">{u.sessions}</td>
                        <td className={`py-2 text-xs text-right font-semibold ${u.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                          {u.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-body-dark">No data yet.</p>
            )}
          </div>
        </div>

        {/* ── Row 6: Recent Signups ── */}
        <div className="bg-white rounded-card border border-border-default p-5 mb-8">
          <h2 className="font-semibold text-heading text-sm mb-3">Recent Signups</h2>
          {m.recent_users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-2 text-xs font-semibold text-heading">ID</th>
                    <th className="text-left py-2 text-xs font-semibold text-heading">Email</th>
                    <th className="text-right py-2 text-xs font-semibold text-heading">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {m.recent_users.map((u, i) => (
                    <tr key={i} className="border-b border-border-default last:border-0">
                      <td className="py-2 text-xs text-body-dark">{u.id}</td>
                      <td className="py-2 text-xs text-heading">{u.email}</td>
                      <td className="py-2 text-xs text-body-dark text-right">
                        {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}
                        {new Date(u.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-body-dark">No users yet.</p>
          )}
        </div>

      </div>
    </div>
  )
}
