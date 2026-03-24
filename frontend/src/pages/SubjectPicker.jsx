import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SubjectPicker() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedSubject, setExpandedSubject] = useState(null)
  const [mode, setMode] = useState(null) // null | 'entire' | 'subtopics'
  const [selectedTopics, setSelectedTopics] = useState([])
  const [questionCount, setQuestionCount] = useState(10)

  useEffect(() => {
    api.get('/subjects-topics')
      .then(res => {
        const data = res.data.data || res.data
        setSubjects(data.subjects || {})
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load subjects:', err)
        setLoading(false)
      })
  }, [])

  const openSubject = (subject) => {
    if (expandedSubject === subject) {
      setExpandedSubject(null)
      setMode(null)
      setSelectedTopics([])
    } else {
      setExpandedSubject(subject)
      setMode(null)
      setSelectedTopics([])
      setQuestionCount(10)
    }
  }

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const maxQuestions = () => {
    if (!expandedSubject || !subjects[expandedSubject]) return 50
    if (mode === 'subtopics' && selectedTopics.length > 0) {
      return subjects[expandedSubject]
        .filter(t => selectedTopics.includes(t.topic))
        .reduce((sum, t) => sum + t.count, 0)
    }
    return subjects[expandedSubject].reduce((sum, t) => sum + t.count, 0)
  }

  const startQuiz = () => {
    const body = { subject: expandedSubject }
    if (mode === 'subtopics' && selectedTopics.length > 0) {
      body.subtopics = selectedTopics
    }
    body.questionCount = Math.min(questionCount, maxQuestions())

    api.post('/quiz/start', body)
      .then(res => {
        const data = res.data.data || res.data
        navigate(`/quiz/${data.sessionId}`)
      })
      .catch(err => console.error('Failed to start quiz:', err))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading subjects...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          Clinical Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-heading mb-2">Revise by Specialty</h1>
        <p className="text-body-dark text-sm mb-8">Choose a specialty, then decide how you want to revise.</p>

        <div className="flex flex-col gap-3">
          {Object.entries(subjects).map(([subject, topics]) => {
            const isExpanded = expandedSubject === subject
            const totalCount = topics.reduce((sum, t) => sum + t.count, 0)

            return (
              <div key={subject} className="card p-0 overflow-hidden">
                {/* Subject header */}
                <button
                  onClick={() => openSubject(subject)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-light transition-colors"
                >
                  <div className="text-left">
                    <div className="font-semibold text-heading text-sm">{subject}</div>
                    <div className="text-xs text-body-dark">{totalCount} questions across {topics.length} subtopics</div>
                  </div>
                  <span className="text-body-dark text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Expanded: choose mode */}
                {isExpanded && !mode && (
                  <div className="border-t border-border-default px-5 py-5">
                    <p className="text-sm text-body-dark mb-4">How would you like to revise <span className="font-semibold text-heading">{subject}</span>?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => { setMode('entire'); setQuestionCount(Math.min(totalCount, 20)); }}
                        className="card border-2 border-border-default hover:border-marine transition-colors text-left p-4"
                      >
                        <div className="font-semibold text-heading text-sm mb-1">Revise Entire Specialty</div>
                        <div className="text-xs text-body-dark">Questions from all {topics.length} subtopics, proportionally selected</div>
                      </button>
                      <button
                        onClick={() => setMode('subtopics')}
                        className="card border-2 border-border-default hover:border-marine transition-colors text-left p-4"
                      >
                        <div className="font-semibold text-heading text-sm mb-1">Choose Subtopics</div>
                        <div className="text-xs text-body-dark">Select specific subtopics to focus on</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Entire specialty mode */}
                {isExpanded && mode === 'entire' && (
                  <div className="border-t border-border-default px-5 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => setMode(null)} className="text-xs text-marine hover:underline">&larr; Back</button>
                      <span className="text-xs text-body-dark">{totalCount} questions available</span>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-heading block mb-2">
                        Number of questions: <span className="text-marine">{questionCount}</span>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={Math.min(totalCount, 100)}
                        value={questionCount}
                        onChange={e => setQuestionCount(parseInt(e.target.value))}
                        className="w-full accent-marine"
                      />
                      <div className="flex justify-between text-[10px] text-body-dark mt-1">
                        <span>5</span>
                        <span>{Math.min(totalCount, 100)}</span>
                      </div>
                    </div>
                    <button onClick={startQuiz} className="btn-primary w-full">Begin Assessment</button>
                  </div>
                )}

                {/* Subtopic selection mode */}
                {isExpanded && mode === 'subtopics' && (
                  <div className="border-t border-border-default px-5 py-5">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={() => { setMode(null); setSelectedTopics([]); }} className="text-xs text-marine hover:underline">&larr; Back</button>
                      <span className="text-xs text-body-dark">
                        {selectedTopics.length} subtopic{selectedTopics.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mb-4 max-h-60 overflow-y-auto">
                      {topics.map((t, i) => {
                        const isSelected = selectedTopics.includes(t.topic)
                        return (
                          <button
                            key={i}
                            onClick={() => toggleTopic(t.topic)}
                            className={`flex items-center justify-between px-3 py-2 rounded-card text-left transition-colors text-sm ${
                              isSelected ? 'bg-marine/10 border border-marine' : 'hover:bg-bg-light border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${
                                isSelected ? 'bg-marine border-marine text-white' : 'border-gray-300'
                              }`}>
                                {isSelected && '✓'}
                              </span>
                              <span className="text-heading">{t.topic}</span>
                            </div>
                            <span className="text-xs text-body-dark">{t.count} Qs</span>
                          </button>
                        )
                      })}
                    </div>

                    {selectedTopics.length > 0 && (
                      <>
                        <div className="mb-4">
                          <label className="text-sm font-medium text-heading block mb-2">
                            Number of questions: <span className="text-marine">{Math.min(questionCount, maxQuestions())}</span>
                            <span className="text-xs text-body-dark ml-1">({maxQuestions()} available)</span>
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={Math.min(maxQuestions(), 100)}
                            value={Math.min(questionCount, maxQuestions())}
                            onChange={e => setQuestionCount(parseInt(e.target.value))}
                            className="w-full accent-marine"
                          />
                        </div>
                        <button onClick={startQuiz} className="btn-primary w-full">
                          Begin Assessment ({Math.min(questionCount, maxQuestions())} questions)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
