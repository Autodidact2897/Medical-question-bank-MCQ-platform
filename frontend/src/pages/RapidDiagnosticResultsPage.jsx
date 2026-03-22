import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const COLOUR_MAP = {
  RED: { dot: '#dc2626', bg: '#fee2e2', text: '#dc2626', label: 'Weak' },
  AMBER: { dot: '#f59e0b', bg: '#fef3c7', text: '#d97706', label: 'Moderate' },
  GREEN: { dot: '#16a34a', bg: '#dcfce7', text: '#16a34a', label: 'Strong' },
}

function ScoreCircle({ percentage }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const colour = percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#dc2626'

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={colour} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="70" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill="#1a1a1a">
          {percentage}%
        </text>
        <text x="70" y="88" textAnchor="middle" fontSize="12" fill="#2d2d2d">
          overall
        </text>
      </svg>
    </div>
  )
}

function SubjectBar({ subject, correct, total, colour }) {
  const pct = total > 0 ? (correct / total) * 100 : 0
  const c = COLOUR_MAP[colour] || COLOUR_MAP.AMBER
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-heading">{subject}</span>
        <span className="text-xs font-semibold" style={{ color: c.text }}>
          {correct}/{total}
        </span>
      </div>
      <div className="h-3 bg-grey-light rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: c.dot }}
        />
      </div>
    </div>
  )
}

export default function RapidDiagnosticResultsPage() {
  const { sessionToken } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/rapid-diagnostic/results/${sessionToken}`)
      .then(res => {
        setResults(res.data.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load results:', err)
        setLoading(false)
      })
  }, [sessionToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading your results...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="card text-center max-w-md">
          <p className="text-heading font-semibold mb-2">Results not found</p>
          <p className="text-body-dark text-sm mb-4">This assessment may not have been completed yet.</p>
          <button onClick={() => navigate('/rapid-diagnostic')} className="btn-primary text-sm">
            Take the Assessment
          </button>
        </div>
      </div>
    )
  }

  const { overall_percentage, total_correct, total_questions, subject_scores, weak_areas, locked_features } = results
  const gapCount = (subject_scores || []).filter(s => s.colour !== 'GREEN').length
  const totalAreas = (subject_scores || []).length

  return (
    <div className="min-h-screen bg-bg-light">

      {/* Header */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Score ── */}
        <div className="card text-center mb-6">
          <h1 className="text-2xl font-semibold text-heading mb-4">Your Rapid Diagnostic Results</h1>
          <ScoreCircle percentage={overall_percentage} />
          <p className="mt-4 text-body-dark">
            You scored <strong className="text-heading">{total_correct}</strong> out of <strong className="text-heading">{total_questions}</strong>
          </p>
        </div>

        {/* ── Subject Bar Chart ── */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-heading mb-4">Performance by Subject</h2>
          {(subject_scores || []).map((s, i) => (
            <SubjectBar key={i} subject={s.subject} correct={s.correct} total={s.total} colour={s.colour} />
          ))}
        </div>

        {/* ── Weak Areas Callout ── */}
        {weak_areas && weak_areas.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-heading mb-3">Your biggest gaps are in:</h2>
            <div className="flex flex-col gap-3">
              {weak_areas.map((wa, i) => {
                const c = COLOUR_MAP[wa.colour] || COLOUR_MAP.AMBER
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-card" style={{ backgroundColor: c.bg }}>
                    <span className="mt-0.5 text-lg" style={{ color: c.dot }}>&#x25CF;</span>
                    <div>
                      <span className="font-semibold text-heading">{wa.subject}</span>
                      <span className="text-body-dark text-sm"> — {wa.teaser}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Gap Count ── */}
        <div className="card mb-8 text-center">
          <p className="text-body-dark">
            You have gaps in <strong className="text-heading">{gapCount}</strong> out of <strong className="text-heading">{totalAreas}</strong> areas.
          </p>
        </div>

        {/* ── Paywall Section ── */}
        <div className="card mb-6 p-0 overflow-hidden">
          {/* Blurred preview */}
          <div className="relative px-6 py-6">
            <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
              <h3 className="text-lg font-semibold text-heading mb-3">Full Subtopic Breakdown</h3>
              <div className="space-y-2">
                {['Acute Coronary Syndromes', 'DKA Management', 'Asthma Stepwise Therapy', 'Heart Failure Pharmacology', 'Electrolyte Emergencies', 'Overdose Protocols'].map((topic, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-body-dark">{topic}</span>
                    <div className="w-32 h-2.5 bg-grey-light rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${30 + Math.random() * 60}%`,
                        backgroundColor: ['#dc2626', '#f59e0b', '#16a34a'][i % 3]
                      }} />
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="text-lg font-semibold text-heading mt-6 mb-2">Your 12-Week Study Plan</h3>
              <div className="space-y-1">
                {['Week 1-2: Cardiovascular emergencies', 'Week 3-4: Endocrinology deep dive', 'Week 5-6: Pharmacology & prescribing'].map((item, i) => (
                  <p key={i} className="text-sm text-body-dark">{item}</p>
                ))}
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-60 px-6">
              <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-heading mb-2">Your full performance breakdown is ready.</h3>
                <p className="text-body-dark text-sm mb-4">
                  We've identified exactly which subtopics you need to work on — and built a personalised study plan to get you there.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Locked Features ── */}
        <div className="card mb-6">
          <ul className="space-y-2">
            {(locked_features || []).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-body-dark text-sm">
                <span className="text-green-traffic font-bold">&#x2705;</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => navigate('/register')}
          className="w-full btn-primary text-base py-4 text-center mb-3"
        >
          Unlock My Full Report & Study Plan
        </button>

        <p className="text-center text-xs text-body-dark mb-8">
          Secure payment via Stripe &middot; Cancel anytime
        </p>

      </div>
    </div>
  )
}
