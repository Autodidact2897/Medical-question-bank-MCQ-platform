import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function SubjectPicker() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedSubject, setExpandedSubject] = useState(null)

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

  const startQuiz = (subject, topic, count) => {
    const params = new URLSearchParams()
    if (topic) {
      params.set('topic', topic)
      params.set('subject', subject)
    } else {
      params.set('subject', subject)
    }
    params.set('count', count || 10)
    navigate(`/quiz/practice?${params.toString()}`)
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
          Dashboard
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-heading mb-2">Study by Subject</h1>
        <p className="text-body-dark text-sm mb-8">Choose a subject or drill into a specific subtopic.</p>

        <div className="flex flex-col gap-3">
          {Object.entries(subjects).map(([subject, topics]) => {
            const isExpanded = expandedSubject === subject
            const totalCount = topics.reduce((sum, t) => sum + t.count, 0)

            return (
              <div key={subject} className="card p-0 overflow-hidden">
                {/* Subject header */}
                <button
                  onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-light transition-colors"
                >
                  <div className="text-left">
                    <div className="font-semibold text-heading text-sm">{subject}</div>
                    <div className="text-xs text-body-dark">{totalCount} questions across {topics.length} subtopics</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); startQuiz(subject, null, 10); }}
                      className="text-xs text-marine font-semibold hover:underline"
                    >
                      Quick 10
                    </button>
                    <span className="text-body-dark text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Subtopics */}
                {isExpanded && (
                  <div className="border-t border-border-default">
                    {topics.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => startQuiz(subject, t.topic, Math.min(t.count, 10))}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-bg-light transition-colors border-b border-border-default last:border-0 text-left"
                      >
                        <span className="text-sm text-heading">{t.topic}</span>
                        <span className="text-xs text-body-dark">{t.count} Qs</span>
                      </button>
                    ))}
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
