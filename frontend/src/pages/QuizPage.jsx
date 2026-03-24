import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const TOTAL_SECONDS = 30 * 60

export default function QuizPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [flagged, setFlagged] = useState(new Set())
  const [showEndEarly, setShowEndEarly] = useState(false)

  // Support both /quiz/subtopic?subject=X&topic=Y and /quiz/:id (legacy)
  const subject = searchParams.get('subject') || null
  const topic = searchParams.get('topic') || null
  const count = parseInt(searchParams.get('count')) || 10
  const quizLabel = topic || subject || decodeURIComponent(id || 'Assessment')

  useEffect(() => {
    const body = { questionCount: count }
    if (subject) body.subject = subject
    if (topic) body.topic = topic

    api.post('/quiz/start', body)
      .then(res => {
        const data = res.data.data || res.data
        setSessionId(data.sessionId)
        setQuestions(data.questions || [])
        if (!data.questions || data.questions.length === 0) {
          setError('No questions found for this topic.')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to start quiz', err)
        setError('Failed to load assessment. Please try again.')
        setLoading(false)
      })
  }, [id, subject, topic, count])

  useEffect(() => {
    if (loading || questions.length === 0) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loading, questions.length])

  const handleSubmit = useCallback(async () => {
    if (submitting || !sessionId) return
    setSubmitting(true)
    try {
      for (const [questionId, userAnswer] of Object.entries(answers)) {
        await api.post(`/quiz/${sessionId}/answer`, { questionId: parseInt(questionId), userAnswer })
      }
      await api.post(`/quiz/${sessionId}/complete`)
      navigate(`/quiz/${id}/results?session=${sessionId}`)
    } catch (err) {
      console.error('Submit failed', err)
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again to continue. Your answers for this assessment could not be saved.')
      } else {
        setError('Failed to submit assessment. Please try again.')
      }
      setSubmitting(false)
    }
  }, [answers, sessionId, submitting, navigate, id])

  const toggleFlag = async (questionId) => {
    if (!sessionId) return
    try {
      const res = await api.post(`/quiz/${sessionId}/flag`, { questionId })
      const isFlagged = res.data.data?.flagged
      setFlagged(prev => {
        const next = new Set(prev)
        if (isFlagged) next.add(questionId)
        else next.delete(questionId)
        return next
      })
    } catch (err) {
      console.error('Flag toggle failed:', err)
    }
  }

  const timerClass = timeLeft < 180
    ? 'text-red-traffic bg-red-traffic-bg'
    : timeLeft < 600
    ? 'text-amber-traffic bg-amber-traffic-bg'
    : 'text-marine bg-blue-50'

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const currentQ = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const selectedAnswer = currentQ ? answers[currentQ.id] : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading assessment...</p>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="card text-center max-w-md">
          <p className="text-heading font-semibold mb-2">{error || 'No questions found'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm mt-4">
            Back to Clinical Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">

      {/* Top Bar */}
      <div className="bg-white border-b border-border-default px-6 py-3">
        <div className="h-1.5 bg-grey-light rounded-full mb-3">
          <div
            className="h-full bg-marine rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-body-dark">
            {quizLabel} — Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`text-sm font-semibold px-3 py-1 rounded ${timerClass}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        {currentQ ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-heading leading-relaxed">
                {currentQ.question_text}
              </h2>
              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium border transition-all ${
                  flagged.has(currentQ.id)
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'bg-white border-border-default text-body-dark hover:border-amber-400'
                }`}
                title={flagged.has(currentQ.id) ? 'Unflag this question' : 'Flag for revision'}
              >
                <svg className="w-4 h-4" fill={flagged.has(currentQ.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {flagged.has(currentQ.id) ? 'Flagged' : 'Flag'}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
                const optionText = currentQ[`option_${letter.toLowerCase()}`]
                if (!optionText) return null
                const isSelected = selectedAnswer === letter
                return (
                  <button
                    key={letter}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: letter }))}
                    className={`w-full text-left px-4 py-3 rounded-card border-2 transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-50 border-marine'
                        : 'bg-white border-border-default hover:border-marine-mid'
                    }`}
                  >
                    <span className="font-bold text-marine mr-3">{letter}</span>
                    <span className="text-body-dark text-sm">{optionText}</span>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-body-dark">No questions found for this assessment.</p>
        )}
      </div>

      {/* End Early confirmation dialog */}
      {showEndEarly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-heading mb-2">End Assessment Early?</h3>
            <p className="text-sm text-body-dark mb-5">
              Are you sure you want to end this assessment? You will only be scored on the{' '}
              <span className="font-semibold text-heading">{Object.keys(answers).length}</span> question{Object.keys(answers).length !== 1 ? 's' : ''} you have answered.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowEndEarly(false)} className="btn-secondary text-sm">Continue Assessment</button>
              <button onClick={() => { setShowEndEarly(false); handleSubmit(); }} className="btn-primary text-sm bg-red-600 hover:bg-red-700">End &amp; View Results</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="bg-white border-t border-border-default px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {currentIndex >= 1 && Object.keys(answers).length >= 1 && !isLast && (
              <button
                onClick={() => setShowEndEarly(true)}
                className="text-xs text-body-dark hover:text-red-600 transition-colors"
              >
                End Assessment Early
              </button>
            )}
          </div>
          <p className="text-xs text-body-dark hidden sm:block">{Object.keys(answers).length} of {questions.length} answered</p>
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary text-sm disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="btn-primary text-sm"
            >
              Next
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
