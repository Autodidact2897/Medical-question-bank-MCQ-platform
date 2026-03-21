import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

const STUDY_MODES = [
  { icon: '📚', title: 'Study by Subtopic', desc: 'Master one topic in isolation', link: '/quiz/subtopic' },
  { icon: '🎯', title: 'AI Session', desc: '5 Qs + clinical brief', link: '/quiz/ai' },
  { icon: '⚡', title: 'Quick Session', desc: 'Timed rapid-fire', link: '/quiz/quick' },
  { icon: '🎛', title: 'Custom Subtopics', desc: 'Build your own quiz', link: '/quiz/custom' },
  { icon: '📊', title: 'Custom Difficulty', desc: 'Easy, Medium, Hard mix', link: '/quiz/difficulty' },
  { icon: '🔄', title: 'Redo Wrong Answers', desc: 'Review your mistakes', link: '/quiz/wrong' },
  { icon: '🏥', title: 'Mock Exam', desc: '97 questions, 2.5 hrs', link: '/quiz/mock' },
  { icon: '📖', title: 'Questions Only', desc: 'Self-test, no timers', link: '/quiz/open' },
  { icon: '🎓', title: 'Clinical Briefs', desc: 'Deep learning resources', link: '/briefs' },
]

const STUDY_PLAN = [
  { weeks: 'Week 1–2', topic: 'ACS & Arrhythmias', current: true },
  { weeks: 'Week 3–4', topic: 'Heart Failure', current: false },
  { weeks: 'Week 5–6', topic: 'Diabetes', current: false },
  { weeks: 'Week 7–8', topic: 'Respiratory', current: false },
  { weeks: 'Week 9–10', topic: 'GI & Renal', current: false },
  { weeks: 'Week 11–12', topic: 'Full mock & review', current: false },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [lnaResults, setLnaResults] = useState([])
  const [email, setEmail] = useState(user?.email || '')
  const [briefsEnabled, setBriefsEnabled] = useState(false)

  // Load LNA results for the subtopic rankings
  useEffect(() => {
    api.get('/briefs/weak-areas/recommend')
      .then(res => setLnaResults(res.data.weakAreas || []))
      .catch(() => {
        // Use placeholder data
        setLnaResults([
          { topic: 'Acute Coronary Syndromes', level: 'red' },
          { topic: 'Heart Failure', level: 'amber' },
          { topic: 'Diabetes', level: 'amber' },
          { topic: 'Respiratory Emergencies', level: 'red' },
        ])
      })
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const firstName = user?.name?.split(' ')[0] || 'Doctor'

  return (
    <div className="min-h-screen bg-bg-light">

      {/* ── Header ── */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚕</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-body-dark text-sm font-medium">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-body-dark font-semibold text-sm hover:text-marine transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Welcome ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-heading">Welcome back, {firstName}</h1>
          <p className="text-body-dark mt-1">Your personalised revision plan is ready. Choose how you want to study.</p>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🤖', title: 'AI Study Session', desc: '5 Qs + clinical brief', action: () => navigate('/quiz/ai') },
            { icon: '📋', title: 'Mock Exam', desc: 'Full MSRA simulation', action: () => navigate('/quiz/mock') },
            { icon: '❌', title: 'Redo Wrong Answers', desc: 'Reinforce weak areas', action: () => navigate('/quiz/wrong') },
          ].map((card, i) => (
            <button
              key={i}
              onClick={card.action}
              className="text-left p-6 rounded-card text-white transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0c3a5c 0%, #082a46 100%)' }}
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="font-semibold text-base mb-1">{card.title}</div>
              <div className="text-blue-200 text-sm">{card.desc}</div>
            </button>
          ))}
        </div>

        {/* ── LNA Results ── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-heading mb-4">
            Your LNA results
            <span className="text-sm font-normal text-body-dark ml-2">All 79 subtopics ranked by weakness</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lnaResults.slice(0, 8).map((area, i) => (
              <div key={i} className="card flex items-center justify-between py-3">
                <span className="text-sm font-medium text-heading">{area.topic}</span>
                <TrafficBadge level={area.level} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Ways to Study Grid ── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-heading mb-4">Ways to study</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {STUDY_MODES.map((mode, i) => (
              <button
                key={i}
                onClick={() => navigate(mode.link)}
                className="card text-left hover:border-marine transition-colors duration-150"
              >
                <div className="text-xl mb-2">{mode.icon}</div>
                <div className="font-semibold text-heading text-sm mb-1">{mode.title}</div>
                <div className="text-body-dark text-xs mb-3">{mode.desc}</div>
                <div className="text-marine text-xs font-medium">→ Start</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 12-Week Study Plan ── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-heading mb-4">12-Week Study Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {STUDY_PLAN.map((week, i) => (
              <div
                key={i}
                className={`rounded-card p-4 border-2 ${
                  week.current
                    ? 'border-marine bg-blue-50'
                    : 'border-border-default bg-white'
                }`}
              >
                {week.current && (
                  <span className="text-xs font-bold text-marine bg-blue-100 px-2 py-0.5 rounded mb-2 inline-block">
                    CURRENT
                  </span>
                )}
                <div className="text-xs font-medium text-body-dark mb-1">{week.weeks}</div>
                <div className="font-semibold text-heading text-sm">{week.topic}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Daily Briefs Email Signup ── */}
        <div className="card">
          <h2 className="text-lg font-semibold text-heading mb-1">Get clinical briefs in your inbox</h2>
          <p className="text-body-dark text-sm mb-4">
            Receive one clinical brief daily on a subtopic you were weak in.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
              placeholder="your@email.com"
            />
            <button
              onClick={() => setBriefsEnabled(true)}
              className={`btn-secondary text-sm ${briefsEnabled ? 'opacity-60' : ''}`}
              disabled={briefsEnabled}
            >
              {briefsEnabled ? '✓ Enabled' : 'Enable daily briefs'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
