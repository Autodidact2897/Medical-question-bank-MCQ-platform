import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import QuestionDiscussion from '../components/QuestionDiscussion'
import QuestionFeedback from '../components/QuestionFeedback'

function QuestionDetailModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-card w-full max-w-3xl shadow-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 bg-white rounded-t-card z-10">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${item.is_correct ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-semibold text-heading">
              {item.subject} — {item.topic}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              item.difficulty === 'Easy' ? 'bg-green-50 text-green-700' :
              item.difficulty === 'Hard' ? 'bg-red-50 text-red-700' :
              'bg-amber-50 text-amber-700'
            }`}>{item.difficulty}</span>
          </div>
          <button
            onClick={onClose}
            className="text-body-dark hover:text-heading text-xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* Question body */}
        <div className="px-6 py-6">
          <h3 className="text-base font-semibold text-heading mb-5 leading-relaxed">
            {item.question_text}
          </h3>

          {/* Answer options */}
          <div className="flex flex-col gap-2 mb-5">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => {
              const optionText = item[`option_${letter.toLowerCase()}`]
              if (!optionText) return null
              const isCorrect = letter === item.correct_answer?.toUpperCase()
              const isUserAnswer = letter === item.user_answer?.toUpperCase()
              const isWrong = isUserAnswer && !isCorrect
              return (
                <div key={letter} className={`px-4 py-2.5 rounded-card border-2 text-sm ${
                  isCorrect ? 'bg-green-50 border-green-400 text-green-800 font-semibold' :
                  isWrong ? 'bg-red-50 border-red-400 text-red-800 font-semibold' :
                  'bg-white border-border-default text-body-dark'
                }`}>
                  <span className="font-bold mr-3">{letter}</span>
                  {optionText}
                  {isCorrect && <span className="ml-2">&#10003; Correct answer</span>}
                  {isWrong && <span className="ml-2">&#10007; Your answer</span>}
                  {isUserAnswer && isCorrect && <span className="ml-2"> (Your answer)</span>}
                </div>
              )
            })}
          </div>

          {/* Explanation */}
          {item.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-card px-4 py-3 mb-4">
              <h4 className="text-xs font-semibold text-marine mb-1">Explanation</h4>
              <p className="text-sm text-heading leading-relaxed">{item.explanation}</p>
            </div>
          )}

          {/* Feedback */}
          <QuestionFeedback questionId={item.question_id} />

          {/* Discussion */}
          <QuestionDiscussion questionId={item.question_id} />
        </div>
      </div>
    </div>
  )
}

export default function QuizResults() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session')

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const scrollRef = useRef(0)

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

  const openModal = (item) => {
    scrollRef.current = window.scrollY
    setSelectedQuestion(item)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setSelectedQuestion(null)
    document.body.style.overflow = ''
    requestAnimationFrame(() => window.scrollTo(0, scrollRef.current))
  }

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
            Back to Clinical Dashboard
          </button>
        </div>
      </div>
    )
  }

  const score = results.score ?? 0
  const totalQuestions = results.totalQuestions ?? 0
  const correctAnswers = results.correctAnswers ?? 0
  const answers = results.results || []
  const flaggedIds = new Set(results.flaggedIds || [])
  const flaggedAnswers = answers.filter(a => flaggedIds.has(a.question_id))

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Modal */}
      {selectedQuestion && (
        <QuestionDetailModal item={selectedQuestion} onClose={closeModal} />
      )}

      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          Clinical Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold text-heading mb-2">Assessment Complete</h1>

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

        {/* Flagged questions */}
        {flaggedAnswers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Flagged for Revision
            </h2>
            <p className="text-sm text-body-dark mb-3">You flagged {flaggedAnswers.length} question{flaggedAnswers.length !== 1 ? 's' : ''} during this assessment. Click to review in detail.</p>
            <div className="flex flex-col gap-2">
              {flaggedAnswers.map((item, i) => (
                <button
                  key={`flag-${i}`}
                  onClick={() => openModal(item)}
                  className="card border-l-4 border-l-amber-400 text-left hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-heading flex-1">{item.question_text}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        item.is_correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {item.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                      <svg className="w-4 h-4 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question review — clickable cards */}
        {answers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-heading mb-1">Question Review</h2>
            <p className="text-sm text-body-dark mb-3">Click any question to see full details, explanation, and discussion.</p>
            <div className="flex flex-col gap-2">
              {answers.map((item, i) => (
                <button
                  key={i}
                  onClick={() => openModal(item)}
                  className={`card border-l-4 text-left hover:shadow-md transition-shadow cursor-pointer ${
                    item.is_correct ? 'border-l-green-traffic' : 'border-l-red-traffic'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-heading truncate">{i + 1}. {item.question_text}</p>
                      <div className="flex gap-3 mt-1 text-xs text-body-dark">
                        <span>{item.subject}</span>
                        {item.topic && <span>&middot; {item.topic}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-semibold text-xs ${item.is_correct ? 'text-green-traffic' : 'text-red-traffic'}`}>
                        {item.user_answer}
                      </span>
                      {!item.is_correct && (
                        <span className="text-green-traffic font-semibold text-xs">{item.correct_answer}</span>
                      )}
                      {flaggedIds.has(item.question_id) && (
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                      <svg className="w-4 h-4 text-body-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Clinical Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
