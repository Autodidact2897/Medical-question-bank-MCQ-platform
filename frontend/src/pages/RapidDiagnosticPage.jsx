import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function RapidDiagnosticPage() {
  const navigate = useNavigate()

  // Assessment states: 'landing' | 'quiz' | 'email-capture'
  const [phase, setPhase] = useState('landing')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionToken, setSessionToken] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [email, setEmail] = useState('')
  const [submittingEmail, setSubmittingEmail] = useState(false)
  const [error, setError] = useState(null)
  const [sjtRanking, setSjtRanking] = useState({}) // { position: letter }
  const timerRef = useRef(null)

  // Elapsed timer
  useEffect(() => {
    if (phase === 'quiz') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const startAssessment = async () => {
    setError(null)
    try {
      const res = await api.get('/rapid-diagnostic/start')
      const data = res.data.data
      setQuestions(data.questions)
      setSessionToken(data.session_token)
      setPhase('quiz')
    } catch (err) {
      console.error('Failed to start assessment:', err)
      setError('Failed to start assessment. Please try again.')
    }
  }

  const currentQ = questions[currentIndex]
  const isSJT = currentQ?.question_type === 'SJT'
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  // Get available options for this question
  const getOptions = () => {
    if (!currentQ) return []
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    return letters
      .filter(l => currentQ[`option_${l.toLowerCase()}`])
      .map(l => ({ letter: l, text: currentQ[`option_${l.toLowerCase()}`] }))
  }

  // Build SJT answer string from ranking
  const getSjtAnswer = () => {
    const options = getOptions()
    const positions = Object.keys(sjtRanking).map(Number).sort((a, b) => a - b)
    if (positions.length !== options.length) return null
    return positions.map(p => sjtRanking[p]).join('')
  }

  const handleSubmitAnswer = async () => {
    if (submittingAnswer) return

    let answer
    if (isSJT) {
      answer = getSjtAnswer()
      if (!answer) return
    } else {
      if (!selectedAnswer) return
      answer = selectedAnswer
    }

    setSubmittingAnswer(true)
    try {
      await api.post('/rapid-diagnostic/answer', {
        session_token: sessionToken,
        question_id: currentQ.id,
        user_answer: answer,
      })

      // Move straight to the next question — no feedback shown
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1)
        setSelectedAnswer(null)
        setSjtRanking({})
      } else {
        setPhase('email-capture')
        clearInterval(timerRef.current)
      }
      setSubmittingAnswer(false)
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setSubmittingAnswer(false)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (submittingEmail) return
    setSubmittingEmail(true)
    setError(null)
    try {
      await api.post('/rapid-diagnostic/complete', {
        session_token: sessionToken,
        email,
      })
      navigate(`/rapid-diagnostic/results/${sessionToken}`)
    } catch (err) {
      console.error('Failed to complete assessment:', err)
      setError('Failed to submit. Please try again.')
      setSubmittingEmail(false)
    }
  }

  // ─── Landing Phase ───
  if (phase === 'landing') {
    return (
      <div className="min-h-screen bg-bg-light font-sans">
        <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl">&#x2695;</span>
            <span className="text-marine font-semibold text-lg">DiscoLabs</span>
          </div>
        </header>

        <section className="bg-white px-6 py-16 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-semibold text-heading leading-tight mb-4">
            Find out where you really stand — in under 15 minutes.
          </h1>
          <p className="text-body-dark text-lg mb-8">
            20 questions. Instant results. No sign-up required.
          </p>
          <button onClick={startAssessment} className="btn-primary text-base px-8 py-4">
            Start Free Assessment
          </button>
          {error && (
            <p className="mt-4 text-red-traffic text-sm">{error}</p>
          )}
          <p className="mt-6 text-body-dark text-sm">
            Covers all 12 MSRA clinical topics and all 3 professional dilemma domains.
          </p>
        </section>
      </div>
    )
  }

  // ─── Email Capture Phase ───
  if (phase === 'email-capture') {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center px-4">
        <div className="card w-full max-w-md text-center">
          <div className="text-4xl mb-4">&#x2705;</div>
          <h2 className="text-2xl font-semibold text-heading mb-2">Your results are ready.</h2>
          <p className="text-body-dark mb-6">
            Enter your email to see your personalised performance breakdown.
          </p>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-traffic-bg border border-red-traffic text-red-traffic text-sm px-4 py-3 rounded-btn">
                {error}
              </div>
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
            />
            <button
              type="submit"
              disabled={submittingEmail}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submittingEmail ? 'Loading results...' : 'See My Results'}
            </button>
          </form>

          <p className="text-xs text-body-dark mt-4">
            We'll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </div>
    )
  }

  // ─── Quiz Phase ───
  const options = getOptions()

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
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-body-dark">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        {currentQ ? (
          <>
            {/* Paper + type badge */}
            <div className="flex gap-2 mb-4">
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-grey-light text-body-dark">
                {currentQ.paper}
              </span>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-grey-light text-body-dark">
                {currentQ.question_type}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-heading mb-6 leading-relaxed">
              {currentQ.question_text}
            </h2>

            {isSJT ? (
              /* ── SJT Ranking Interface ── */
              <div className="flex flex-col gap-3">
                <p className="text-sm text-body-dark mb-2 font-medium">
                  Rank the options in order of most appropriate (1) to least appropriate ({options.length}):
                </p>
                {options.map(opt => {
                  // Find what position this letter is assigned to
                  const assignedPosition = Object.entries(sjtRanking).find(([, v]) => v === opt.letter)?.[0]

                  return (
                    <div key={opt.letter} className="flex items-center gap-3 bg-white border border-border-default rounded-card px-4 py-3">
                      <select
                        value={assignedPosition || ''}
                        onChange={(e) => {
                          const newPos = e.target.value
                          setSjtRanking(prev => {
                            const updated = { ...prev }
                            // Remove this letter from any existing position
                            for (const [k, v] of Object.entries(updated)) {
                              if (v === opt.letter) delete updated[k]
                            }
                            // Remove any letter already at this position
                            if (newPos) {
                              delete updated[newPos]
                              updated[newPos] = opt.letter
                            }
                            return updated
                          })
                        }}
                        className="w-14 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-marine"
                      >
                        <option value="">-</option>
                        {options.map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <span className="font-bold text-marine mr-2">{opt.letter}</span>
                      <span className="text-body-dark text-sm">{opt.text}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ── SBA Options ── */
              <div className="flex flex-col gap-3">
                {options.map(opt => {
                  const borderClass = selectedAnswer === opt.letter
                    ? 'bg-blue-50 border-marine'
                    : 'bg-white border-border-default hover:border-marine-mid'

                  return (
                    <button
                      key={opt.letter}
                      onClick={() => setSelectedAnswer(opt.letter)}
                      className={`w-full text-left px-4 py-3 rounded-card border-2 transition-all duration-150 ${borderClass}`}
                    >
                      <span className="font-bold text-marine mr-3">{opt.letter}</span>
                      <span className="text-body-dark text-sm">{opt.text}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-body-dark">No question found.</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="bg-white border-t border-border-default px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={handleSubmitAnswer}
            disabled={submittingAnswer || (isSJT ? Object.keys(sjtRanking).length !== options.length : !selectedAnswer)}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
