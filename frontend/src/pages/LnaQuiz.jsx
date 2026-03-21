import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

// Timer helper: converts seconds to MM:SS display
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Total quiz time: 30 minutes
const TOTAL_SECONDS = 30 * 60

export default function LnaQuiz() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: 'A' }
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch questions on mount
  useEffect(() => {
    api.get('/questions/lna/quiz')
      .then(res => {
        setQuestions(res.data.questions)
        setSessionId(res.data.sessionId)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load questions', err)
        setLoading(false)
      })
  }, [])

  // Countdown timer
  useEffect(() => {
    if (loading) return
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
  }, [loading])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      // Submit all answers
      for (const [questionId, answer] of Object.entries(answers)) {
        await api.post(`/quiz/${sessionId}/answer`, { questionId, answer })
      }
      await api.post(`/quiz/${sessionId}/complete`)
      navigate(`/lna-results/${sessionId}`)
    } catch (err) {
      console.error('Submit failed', err)
      setSubmitting(false)
    }
  }, [answers, sessionId, submitting, navigate])

  // Timer colour logic
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
        <p className="text-marine font-medium">Loading questions…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-border-default px-6 py-3">
        {/* Progress bar */}
        <div className="h-1.5 bg-grey-light rounded-full mb-3">
          <div
            className="h-full bg-marine rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question count + timer */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-body-dark">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`text-sm font-semibold px-3 py-1 rounded ${timerClass}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* ── Question Area ── */}
      <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        {currentQ ? (
          <>
            <h2 className="text-lg font-semibold text-heading mb-6 leading-relaxed">
              {currentQ.question_text}
            </h2>

            {/* Answer Options */}
            <div className="flex flex-col gap-3">
              {['A', 'B', 'C', 'D', 'E'].map(letter => {
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
          <p className="text-body-dark">No question found.</p>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="bg-white border-t border-border-default px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <p className="text-xs text-body-dark">You can change your answer at any time</p>

          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary text-sm disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="btn-primary text-sm"
            >
              Next →
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
