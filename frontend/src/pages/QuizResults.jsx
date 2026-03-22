import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

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
      .then(res => {
        const data = res.data.data || res.data
        setResults(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading results...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="card text-center max-w-md">
          <p className="text-heading font-semibold mb-2">Results not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const score = results.score ?? 0
  const totalQuestions = results.totalQuestions ?? 0
  const correctAnswers = results.correctAnswers ?? 0
  const answers = results.results || []

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold text-heading mb-2">Quiz Complete</h1>

        {/* Score summary */}
        <div className="card mb-6 flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-marine">{score}%</div>
            <div className="text-xs text-body-dark mt-1">{correctAnswers} / {totalQuestions} correct</div>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-grey-light rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  backgroundColor: score >= 70 ? '#059669' : score >= 50 ? '#d97706' : '#ef4444'
                }}
              />
            </div>
            <p className="text-sm text-body-dark mt-2">
              {score >= 70
                ? 'Good performance — keep it up!'
                : score >= 50
                ? 'Room to improve — review the questions below'
                : 'Focus needed — prioritise this topic in your study plan'}
            </p>
          </div>
        </div>

        {/* Question review */}
        {answers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-3">Question Review</h2>
            <div className="flex flex-col gap-4">
              {answers.map((item, i) => (
                <div key={i} className={`card border-l-4 ${item.is_correct ? 'border-l-green-traffic' : 'border-l-red-traffic'}`}>
                  <p className="text-sm font-medium text-heading mb-3">{i + 1}. {item.question_text}</p>
                  <div className="flex gap-4 text-sm">
                    <span className={`font-semibold ${item.is_correct ? 'text-green-traffic' : 'text-red-traffic'}`}>
                      Your answer: {item.user_answer}
                    </span>
                    {!item.is_correct && (
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
        </div>
      </div>
    </div>
  )
}
