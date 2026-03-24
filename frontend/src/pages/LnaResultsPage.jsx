import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

const STATUS_COLORS = {
  GREEN: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Strong' },
  AMBER: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Moderate' },
  RED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Weak' },
}

export default function LnaResultsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/lna/results')
      .then(res => setData(res.data.data))
      .catch(err => console.error('LNA results load failed:', err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading Diagnostic Report...</p>
      </div>
    )
  }

  if (!data || !data.completed) {
    return (
      <div className="min-h-screen bg-bg-light">
        <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">&#x2695;</span>
            <span className="text-marine font-semibold text-lg">DiscoLabs</span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">Clinical Dashboard</button>
        </header>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-heading mb-3">No Diagnostic Assessment Found</h1>
          <p className="text-body-dark mb-6">Complete the Diagnostic Assessment first to see your results here.</p>
          <button onClick={() => navigate('/lna-quiz')} className="btn-primary">Begin Diagnostic Assessment</button>
        </div>
      </div>
    )
  }

  const { overallPercentage, totalCorrect, totalQuestions, bySubject, focusAreas, takenAt } = data

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/lna/analytics" className="btn-secondary text-sm">Full Analytics</Link>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">Clinical Dashboard</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold text-heading mb-2">Diagnostic Report</h1>
        <p className="text-sm text-body-dark mb-8">
          Completed {takenAt ? new Date(takenAt).toLocaleDateString('en-GB') : ''}
        </p>

        {/* Overall readiness score */}
        <div className="card mb-8 text-center">
          <p className="text-sm text-body-dark mb-2">Overall Readiness</p>
          <div className="text-5xl font-bold text-marine mb-2">{overallPercentage}%</div>
          <p className="text-sm text-body-dark">{totalCorrect} / {totalQuestions} correct</p>
          <div className="w-full max-w-md mx-auto mt-4 h-3 bg-grey-light rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${overallPercentage}%`,
                backgroundColor: overallPercentage >= 70 ? '#059669' : overallPercentage >= 50 ? '#d97706' : '#ef4444'
              }}
            />
          </div>
        </div>

        {/* Traffic light breakdown by subject */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-heading mb-4">Performance by Specialty</h2>
          {Object.entries(bySubject).map(([subject, topics]) => (
            <div key={subject} className="card mb-4">
              <h3 className="text-base font-semibold text-heading mb-3">{subject}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topics.map((t, i) => {
                  const style = STATUS_COLORS[t.status] || STATUS_COLORS.AMBER
                  return (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-card ${style.bg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                        <span className={`text-sm font-medium ${style.text}`}>{t.topic}</span>
                      </div>
                      <span className={`text-xs font-semibold ${style.text}`}>
                        {t.percentage !== null ? `${t.percentage}%` : style.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Focus areas */}
        {focusAreas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Focus Areas
            </h2>
            <p className="text-sm text-body-dark mb-3">These subtopics need the most attention. Click to start revising.</p>
            <div className="flex flex-col gap-2">
              {focusAreas.map((area, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/study/subject/${encodeURIComponent(area.subject)}`)}
                  className="card flex items-center justify-between py-3 hover:border-marine transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-heading">{area.topic}</span>
                    <span className="text-xs text-body-dark ml-2">{area.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-600">{area.percentage}%</span>
                    <span className="text-marine text-xs font-medium">Revise &#x2192;</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Retake button */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/lna-quiz')} className="btn-primary">
            Retake Diagnostic Assessment
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Clinical Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
