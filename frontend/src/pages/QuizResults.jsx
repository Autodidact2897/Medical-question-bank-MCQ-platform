import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

function TrafficBadge({ level }) {
  const classes = { red: 'traffic-red', amber: 'traffic-amber', green: 'traffic-green' }
  const labels = { red: 'Weak', amber: 'Moderate', green: 'Strong' }
  return <span className={classes[level] || 'traffic-amber'}>{labels[level] || level}</span>
}

export default function QuizResults() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session')

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    api.get(`/quiz/${sessionId}/results`)
      .then(res => { setResults(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading results…</p>
      </div>
    )
  }

  const score = results?.score ?? 0
  const total = results?.total ?? 0
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const weakAreas = results?.weakAreas || []
  const answers = results?.answers || []

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚕</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          ← Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold text-heading mb-2">Quiz Complete</h1>

        {/* Score summary */}
        <div className="card mb-6 flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-marine">{percentage}%</div>
            <div className="text-xs text-body-dark mt-1">{score} / {total} correct</div>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-grey-light rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: percentage >= 70 ? '#059669' : percentage >= 50 ? '#d97706' : '#ef4444'
                }}
              />
            </div>
            <p className="text-sm text-body-dark mt-2">
              {percentage >= 70
                ? '✓ Good performance — keep it up!'
                : percentage >= 50
                ? '⚠ Room to improve — review the questions below'
                : '✗ Focus needed — prioritise this topic in your study plan'}
            </p>
          </div>
        </div>

        {/* Weak areas identified */}
        {weakAreas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-heading mb-3">Areas to focus on</h2>
            <div className="flex flex-col gap-2">
              {weakAreas.map((area, i) => (
                <div key={i} className="card flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-heading">{area.topic}</span>
                  <TrafficBadge level={area.level} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question review */}
        {answers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-3">Question Review</h2>
            <div className="flex flex-col gap-4">
              {answers.map((item, i) => (
                <div key={i} className={`card border-l-4 ${item.correct ? 'border-l-green-traffic' : 'border-l-red-traffic'}`}>
                  <p className="text-sm font-medium text-heading mb-3">{i + 1}. {item.question_text}</p>
                  <div className="flex gap-4 text-sm">
                    <span className={`font-semibold ${item.correct ? 'text-green-traffic' : 'text-red-traffic'}`}>
                      Your answer: {item.user_answer}
                    </span>
                    {!item.correct && (
                      <span className="text-green-traffic font-semibold">Correct: {item.correct_answer}</span>
                    )}
                  </div>
                  {item.explanation && (
                    <p className="text-xs text-body-dark mt-2 border-t border-border-default pt-2">
                      {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
          <button onClick={() => navigate(`/quiz/${id}`)} className="btn-secondary">
            Retry Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
