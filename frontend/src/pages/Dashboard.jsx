import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

function TrafficBadge({ level }) {
  const classes = {
    red: 'traffic-red',
    amber: 'traffic-amber',
    green: 'traffic-green',
  }
  const labels = { red: 'Weak', amber: 'Moderate', green: 'Strong' }
  return <span className={classes[level] || 'traffic-amber'}>{labels[level] || level}</span>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [resetBanner, setResetBanner] = useState(location.state?.resetSuccess || false)
  const scrollRestored = useRef(false)

  // Restore scroll position on mount
  useEffect(() => {
    if (!scrollRestored.current) {
      const saved = sessionStorage.getItem('dashboard_scroll')
      if (saved) {
        requestAnimationFrame(() => window.scrollTo(0, parseInt(saved)))
        sessionStorage.removeItem('dashboard_scroll')
      }
      scrollRestored.current = true
    }
  }, [])
  const [lnaResults, setLnaResults] = useState([])
  const [email, setEmail] = useState(user?.email || '')
  const [briefsEnabled, setBriefsEnabled] = useState(false)
  const [memberMenuOpen, setMemberMenuOpen] = useState(false)


  const [progressData, setProgressData] = useState(null)
  const [studyHistory, setStudyHistory] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)

  // AI Study Suggestion state
  const [aiMinutes, setAiMinutes] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ai_study_suggestion')) } catch { return null }
  })
  const [aiError, setAiError] = useState('')

  // Load LNA results for the subtopic rankings
  useEffect(() => {
    Promise.all([
      api.get('/progress/lna-results')
        .then(res => {
          const data = res.data.data
          if (data && data.topic_scores) {
            const areas = data.topic_scores
              .filter(t => t.level !== 'green')
              .map(t => ({ topic: t.topic, subject: t.subject, level: t.level, percentage: t.percentage }))
            setLnaResults(areas.length > 0 ? areas : [])
          } else {
            setLnaResults([])
          }
        })
        .catch(() => setLnaResults([])),

      api.get('/progress')
        .then(res => setProgressData(res.data.data))
        .catch(err => console.error('Progress load failed:', err.message)),

      api.get('/progress/study-history')
        .then(res => setStudyHistory(res.data.data))
        .catch(err => console.error('Study history load failed:', err.message)),

      api.get('/email/status')
        .then(res => setBriefsEnabled(res.data.data?.subscribed || false))
        .catch(err => console.error('Email status load failed:', err.message)),

      api.get('/analytics/comparison')
        .then(res => setComparison(res.data.data))
        .catch(err => console.error('Comparison load failed:', err.message)),
    ]).finally(() => setLoading(false))
  }, [])

  // Save scroll position before navigating away
  const navAway = (path) => {
    sessionStorage.setItem('dashboard_scroll', String(window.scrollY))
    navigate(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const startTopicQuiz = (topicName) => {
    const params = new URLSearchParams()
    params.set('topic', topicName)
    params.set('count', 10)
    navAway(`/quiz/practice?${params.toString()}`)
  }

  const fetchAiSuggestion = async (minutes) => {
    setAiMinutes(minutes)
    setAiLoading(true)
    setAiError('')
    setAiResult(null)
    try {
      const res = await api.post('/ai/study-suggestion', { available_minutes: minutes })
      const data = res.data.data
      setAiResult(data)
      sessionStorage.setItem('ai_study_suggestion', JSON.stringify(data))
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate suggestion'
      setAiError(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const startAiSession = () => {
    if (!aiResult) return
    const params = new URLSearchParams()
    params.set('subtopics', aiResult.subtopics.join(','))
    params.set('count', aiResult.question_count)
    navAway(`/quiz/ai-session?${params.toString()}`)
  }

  const firstName = user?.name?.split(' ')[0] || 'Doctor'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading clinical dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light">

      {/* Header */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <div className="flex items-center gap-4 relative">
          {user?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              className="text-xs bg-marine text-white px-2 py-0.5 rounded-full font-medium hover:opacity-90"
            >
              Admin
            </button>
          )}

          {/* Member avatar button */}
          <button
            onClick={() => setMemberMenuOpen(!memberMenuOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: '#0c3a5c' }}>
              {(user?.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-body-dark text-sm font-medium hidden sm:inline">{user?.email}</span>
            <svg className="w-3.5 h-3.5 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {memberMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMemberMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-card border border-border-default shadow-lg z-50 py-1">
                <div className="px-4 py-3 border-b border-border-default">
                  <div className="text-sm font-semibold text-heading truncate">{user?.email}</div>
                  <div className="text-xs text-body-dark mt-0.5">Free Plan</div>
                </div>
                <button
                  onClick={() => { setMemberMenuOpen(false); navigate('/account') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-heading hover:bg-bg-light transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Account
                </button>

                <button
                  onClick={() => { setMemberMenuOpen(false); navigate('/about') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-heading hover:bg-bg-light transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About DiscoLabs
                </button>

                <button
                  onClick={() => { setMemberMenuOpen(false); navigate('/privacy') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-heading hover:bg-bg-light transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Privacy Policy
                </button>
                <button
                  onClick={() => { setMemberMenuOpen(false); navigate('/terms') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-heading hover:bg-bg-light transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Terms &amp; Conditions
                </button>
                <div className="border-t border-border-default mt-1 pt-1">
                  <button
                    onClick={() => { setMemberMenuOpen(false); handleLogout() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Reset success banner */}
        {resetBanner && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-card flex items-center justify-between">
            <p className="text-sm text-green-800">Your question bank has been reset. Your Diagnostic Assessment results have been preserved.</p>
            <button onClick={() => setResetBanner(false)} className="text-green-600 hover:text-green-800 text-lg ml-3">&times;</button>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-heading">Welcome back, {firstName}</h1>
          <p className="text-body-dark mt-1">Your personalised revision plan is ready. Choose how you want to study.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '&#x1F4DA;', title: 'Revise by Specialty', desc: 'Pick a topic and practise', action: () => navAway('/subjects') },
            { icon: '&#x1F3AF;', title: 'Rapid Assessment', desc: '10 random questions', action: () => navAway('/quiz/practice?count=10') },
            { icon: '&#x1F393;', title: 'Clinical Briefs', desc: 'Deep learning resources', action: () => navigate('/briefs') },
          ].map((card, i) => (
            <button
              key={i}
              onClick={card.action}
              className="text-left p-6 rounded-card text-white transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0c3a5c 0%, #082a46 100%)' }}
            >
              <div className="text-2xl mb-2" dangerouslySetInnerHTML={{ __html: card.icon }} />
              <div className="font-semibold text-base mb-1">{card.title}</div>
              <div className="text-blue-200 text-sm">{card.desc}</div>
            </button>
          ))}
        </div>

        {/* Progress Overview */}
        {progressData && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-1">Your Progress</h2>

            {/* Summary bar */}
            <p className="text-body-dark text-sm mb-4">
              {progressData.total_attempted} questions attempted, {progressData.overall_percentage}% correct
              {progressData.unique_questions > 0 && (
                <span> &middot; {progressData.unique_questions} unique out of {progressData.total_in_bank} in the bank</span>
              )}
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card text-center py-4">
                <div className="text-2xl font-bold text-marine">{progressData.overall_percentage}%</div>
                <div className="text-xs text-body-dark mt-1">Overall Performance Score</div>
              </div>
              <div className="card text-center py-4">
                <div className="text-2xl font-bold text-marine">{progressData.total_attempted}</div>
                <div className="text-xs text-body-dark mt-1">Questions Done</div>
              </div>
              <div className="card text-center py-4">
                <div className="text-2xl font-bold text-marine">{progressData.unique_questions}</div>
                <div className="text-xs text-body-dark mt-1">Unique Questions</div>
              </div>
              <div className="card text-center py-4">
                <div className="text-2xl font-bold text-marine">
                  {progressData.total_in_bank > 0
                    ? Math.round((progressData.unique_questions / progressData.total_in_bank) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-body-dark mt-1">Bank Coverage</div>
              </div>
            </div>

            {/* Subject performance bars */}
            {progressData.by_subject && progressData.by_subject.length > 0 && (
              <div className="card mt-4">
                <h3 className="font-semibold text-heading text-sm mb-3">Performance by Subject</h3>
                <div className="flex flex-col gap-3">
                  {progressData.by_subject.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${s.percentage < 60 ? 'text-red-600' : 'text-heading'}`}>
                          {s.subject}{s.percentage < 60 ? ' — needs work' : ''}
                        </span>
                        <span className="text-xs text-body-dark">{s.correct}/{s.attempted} ({s.percentage}%)</span>
                      </div>
                      <div className="h-2.5 bg-grey-light rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${s.percentage}%`,
                            backgroundColor: s.percentage >= 60 ? '#059669' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty breakdown */}
            {progressData.by_difficulty && progressData.by_difficulty.length > 0 && (
              <div className="card mt-4">
                <h3 className="font-semibold text-heading text-sm mb-3">Performance by Difficulty</h3>
                <div className="grid grid-cols-3 gap-3">
                  {progressData.by_difficulty.map((d, i) => (
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
              </div>
            )}

            {/* Recent Activity — last 5 quizzes */}
            {progressData.recent_sessions && progressData.recent_sessions.length > 0 && (
              <div className="card mt-4">
                <h3 className="font-semibold text-heading text-sm mb-3">Recent Activity</h3>
                <div className="flex flex-col gap-2">
                  {progressData.recent_sessions.map((session, i) => {
                    const date = session.completed_at
                      ? new Date(session.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : '—'
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-body-dark w-16">{date}</span>
                          <span className="text-sm font-medium text-heading">{session.subject || 'Mixed'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-body-dark">{session.total_questions} Qs</span>
                          <span className={`text-sm font-semibold ${
                            session.score >= 60 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {session.score}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* How Do I Compare? */}
        {comparison && comparison.subjectComparison && comparison.subjectComparison.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-1">How Do I Compare?</h2>
            <p className="text-sm text-body-dark mb-4">
              You are performing better than <span className="font-semibold text-marine">{comparison.percentile}%</span> of users on the platform.
            </p>

            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-heading">Overall</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#0c3a5c' }}></span> You: {comparison.userPercentage}%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-gray-300"></span> Platform avg: {comparison.platformPercentage}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {comparison.subjectComparison.map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-heading">{s.subject}</span>
                      <span className="text-xs text-body-dark">{s.attempted} Qs</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-body-dark w-8">You</span>
                        <div className="flex-1 h-2 bg-grey-light rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.userPercentage}%`, backgroundColor: '#0c3a5c' }} />
                        </div>
                        <span className="text-[10px] font-semibold text-heading w-8 text-right">{s.userPercentage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-body-dark w-8">Avg</span>
                        <div className="flex-1 h-2 bg-grey-light rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gray-300" style={{ width: `${s.platformPercentage}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-body-dark w-8 text-right">{s.platformPercentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Suggested Study Session */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-heading mb-1">Suggested Study Session</h2>
          <p className="text-sm text-body-dark mb-4">AI-powered personalised revision based on your performance data.</p>

          {!progressData && lnaResults.length === 0 ? (
            <div className="card border-2 border-dashed border-border-default text-center py-6">
              <p className="text-sm text-body-dark">Complete your Rapid Diagnostic Assessment first to unlock personalised study suggestions.</p>
            </div>
          ) : (
            <div className="card">
              {/* Time selector */}
              {!aiResult && !aiLoading && (
                <>
                  <p className="text-sm text-heading font-medium mb-3">How much time do you have?</p>
                  <div className="flex flex-wrap gap-2">
                    {[15, 30, 45, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => fetchAiSuggestion(mins)}
                        className="px-4 py-2.5 rounded-btn border-2 border-border-default text-sm font-semibold text-heading hover:border-marine hover:bg-blue-50 transition-all"
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Loading state */}
              {aiLoading && (
                <div className="text-center py-6">
                  <div className="inline-block w-6 h-6 border-2 border-marine border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-sm text-marine font-medium">Generating your personalised session...</p>
                </div>
              )}

              {/* Error state */}
              {aiError && (
                <div className="text-center py-4">
                  <p className="text-sm text-red-600 mb-2">{aiError}</p>
                  <button onClick={() => { setAiError(''); setAiMinutes(null) }} className="text-xs text-marine underline">Try again</button>
                </div>
              )}

              {/* Result */}
              {aiResult && !aiLoading && (
                <div>
                  <p className="text-sm text-heading leading-relaxed mb-4">{aiResult.summary}</p>

                  <div className="flex flex-col gap-2 mb-4">
                    {aiResult.subtopics.map((topic, i) => (
                      <div key={i} className="flex items-start gap-3 bg-blue-50 rounded-card px-3 py-2.5">
                        <span className="w-5 h-5 rounded-full bg-marine text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-heading">{topic}</span>
                          {aiResult.reasoning?.[i] && (
                            <p className="text-xs text-body-dark mt-0.5">{aiResult.reasoning[i]}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-body-dark mb-3">
                    {aiResult.question_count} questions &middot; ~{aiMinutes} minutes
                  </p>

                  <div className="flex items-center gap-3">
                    <button onClick={startAiSession} className="btn-primary text-sm">
                      Begin This Session
                    </button>
                    <button
                      onClick={() => fetchAiSuggestion(aiMinutes || 30)}
                      className="btn-secondary text-sm"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => { setAiResult(null); setAiMinutes(null); sessionStorage.removeItem('ai_study_suggestion') }}
                      className="text-xs text-body-dark hover:text-heading ml-auto"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LNA Results — clickable to start quizzes */}
        {lnaResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-1">
              Your Weak Areas
            </h2>
            <p className="text-sm text-body-dark mb-4">
              Click any topic to practise questions on it.
              <button onClick={() => navAway('/lna/results')} className="text-marine underline ml-2 text-sm">View full Diagnostic Report</button>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lnaResults.slice(0, 8).map((area, i) => (
                <button
                  key={i}
                  onClick={() => startTopicQuiz(area.topic)}
                  className="card flex items-center justify-between py-3 hover:border-marine transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-heading">{area.topic}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrafficBadge level={area.level} />
                    <span className="text-marine text-xs font-medium">Practise &#x2192;</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No LNA yet — prompt to take the assessment */}
        {lnaResults.length === 0 && !progressData && (
          <div className="mb-8 card border-2 border-dashed border-marine">
            <h2 className="text-lg font-semibold text-heading mb-1">Take the Diagnostic Assessment</h2>
            <p className="text-body-dark text-sm mb-4">
              Complete the Diagnostic Assessment to identify your weak areas and get a personalised study plan.
            </p>
            <button
              onClick={() => navAway('/lna-quiz')}
              className="btn-primary text-sm"
            >
              Start Diagnostic Assessment
            </button>
          </div>
        )}

        {/* Ways to Study Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-heading mb-4">Ways to study</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '&#x1F4DA;', title: 'Revise by Subtopic', desc: 'Master one topic in isolation', link: '/subjects' },
              { icon: '&#x26A1;', title: 'Rapid Assessment', desc: '10 random questions', link: '/quiz/practice?count=10' },
              { icon: '&#x1F4CA;', title: 'By Difficulty', desc: 'Easy, Medium, Hard', link: '/study/difficulty' },
              { icon: '&#x1F3E5;', title: 'Full Subject', desc: 'All questions in a subject', link: '/subjects' },
              { icon: '&#x1F393;', title: 'Clinical Briefs', desc: 'Deep learning resources', link: '/briefs' },
            ].map((mode, i) => (
              <button
                key={i}
                onClick={() => navAway(mode.link)}
                className="card text-left hover:border-marine transition-colors duration-150"
              >
                <div className="text-xl mb-2" dangerouslySetInnerHTML={{ __html: mode.icon }} />
                <div className="font-semibold text-heading text-sm mb-1">{mode.title}</div>
                <div className="text-body-dark text-xs mb-3">{mode.desc}</div>
                <div className="text-marine text-xs font-medium">&#x2192; Start</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Study History */}
        {studyHistory && studyHistory.studied && studyHistory.studied.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-1">Recent Study History</h2>
            <p className="text-sm text-body-dark mb-4">
              {studyHistory.total_topics_studied} of {studyHistory.total_topics_available} topics studied
            </p>
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-grey-light border-b border-border-default">
                    <th className="px-4 py-2 text-left font-semibold text-heading">Topic</th>
                    <th className="px-4 py-2 text-left font-semibold text-heading hidden md:table-cell">Subject</th>
                    <th className="px-4 py-2 text-center font-semibold text-heading">Performance Score</th>
                    <th className="px-4 py-2 text-center font-semibold text-heading hidden sm:table-cell">Coverage</th>
                    <th className="px-4 py-2 text-right font-semibold text-heading">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studyHistory.studied.slice(0, 10).map((item, i) => (
                    <tr key={i} className="border-b border-border-default last:border-0">
                      <td className="px-4 py-2.5 text-heading font-medium">{item.topic}</td>
                      <td className="px-4 py-2.5 text-body-dark hidden md:table-cell">{item.subject}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-semibold ${
                          item.percentage >= 70 ? 'text-green-600' :
                          item.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-body-dark hidden sm:table-cell">
                        {item.coverage}%
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => startTopicQuiz(item.topic)}
                          className="text-marine text-xs font-medium hover:underline"
                        >
                          Practise
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daily Briefs Email Signup */}
        <div className="card">
          <h2 className="text-lg font-semibold text-heading mb-1">Get clinical briefs in your inbox</h2>
          <p className="text-body-dark text-sm mb-4">
            Receive clinical briefs on subtopics you were weak in.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading bg-grey-light">
              {user?.email}
            </div>
            <button
              onClick={async () => {
                try {
                  if (briefsEnabled) {
                    await api.post('/email/unsubscribe')
                    setBriefsEnabled(false)
                  } else {
                    await api.post('/email/subscribe')
                    setBriefsEnabled(true)
                  }
                } catch (err) {
                  console.error('Email toggle error:', err)
                }
              }}
              className={`text-sm font-semibold px-4 py-2.5 rounded-btn border transition-colors whitespace-nowrap ${
                briefsEnabled
                  ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                  : 'btn-secondary'
              }`}
            >
              {briefsEnabled ? 'Unsubscribe' : 'Subscribe'}
            </button>
          </div>
          {briefsEnabled && (
            <p className="text-xs text-green-600 mt-2">You're subscribed to clinical briefs.</p>
          )}
        </div>


      </div>
    </div>
  )
}
