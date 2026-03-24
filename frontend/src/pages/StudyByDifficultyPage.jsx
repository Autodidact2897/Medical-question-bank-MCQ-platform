import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const DIFFICULTIES = [
  { value: 'Easy', label: 'Foundation', desc: 'Core knowledge questions', color: 'border-green-400 bg-green-50 text-green-800' },
  { value: 'Medium', label: 'Core', desc: 'Standard MSRA difficulty', color: 'border-amber-400 bg-amber-50 text-amber-800' },
  { value: 'Hard', label: 'Advanced', desc: 'Challenging clinical scenarios', color: 'border-red-400 bg-red-50 text-red-800' },
]

export default function StudyByDifficultyPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState({})
  const [selectedDifficulties, setSelectedDifficulties] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [expandedSubject, setExpandedSubject] = useState(null)
  const [selectedSubtopics, setSelectedSubtopics] = useState([])
  const [questionCount, setQuestionCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(false)
  const [starting, setStarting] = useState(false)

  // Load subjects
  useEffect(() => {
    api.get('/subjects-topics')
      .then(res => {
        const data = res.data.data || res.data
        setSubjects(data.subjects || {})
      })
      .catch(err => console.error('Failed to load subjects:', err))
  }, [])

  // Live question count
  useEffect(() => {
    if (selectedDifficulties.length === 0) {
      setQuestionCount(0)
      return
    }

    setLoadingCount(true)
    const params = new URLSearchParams()
    params.set('difficulty', selectedDifficulties.join(','))
    if (selectedSubtopics.length > 0) {
      params.set('subtopics', selectedSubtopics.join(','))
    } else if (selectedSubjects.length > 0) {
      params.set('subjects', selectedSubjects.join(','))
    }

    api.get(`/questions/count?${params.toString()}`)
      .then(res => setQuestionCount(res.data.data?.count || 0))
      .catch(() => setQuestionCount(0))
      .finally(() => setLoadingCount(false))
  }, [selectedDifficulties, selectedSubjects, selectedSubtopics])

  const toggleDifficulty = (val) => {
    setSelectedDifficulties(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    )
  }

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      const next = prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
      // Remove subtopics for deselected subjects
      if (!next.includes(subject)) {
        const topicsForSubject = (subjects[subject] || []).map(t => t.topic)
        setSelectedSubtopics(st => st.filter(t => !topicsForSubject.includes(t)))
      }
      return next
    })
  }

  const toggleSubtopic = (topic) => {
    setSelectedSubtopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const startQuiz = async () => {
    if (selectedDifficulties.length === 0 || questionCount === 0) return
    setStarting(true)
    try {
      const body = {
        difficulty: selectedDifficulties,
        questionCount: Math.min(questionCount, 50),
      }
      if (selectedSubtopics.length > 0) {
        body.subtopics = selectedSubtopics
      } else if (selectedSubjects.length > 0) {
        body.subject = selectedSubjects[0] // quiz start accepts single subject for now
      }
      const res = await api.post('/quiz/start', body)
      const data = res.data.data || res.data
      navigate(`/quiz/${data.sessionId}`)
    } catch (err) {
      console.error('Failed to start quiz:', err)
      setStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">Clinical Dashboard</button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold text-heading mb-2">Revise by Difficulty</h1>
        <p className="text-body-dark text-sm mb-8">Choose difficulty levels and optionally filter by specialty.</p>

        {/* Step 1: Choose difficulty */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-heading mb-3">Step 1 — Choose Difficulty</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map(d => {
              const isSelected = selectedDifficulties.includes(d.value)
              return (
                <button
                  key={d.value}
                  onClick={() => toggleDifficulty(d.value)}
                  className={`rounded-card border-2 p-4 text-left transition-all ${
                    isSelected ? d.color : 'border-border-default bg-white text-heading hover:border-marine-mid'
                  }`}
                >
                  <div className="font-semibold text-base mb-1">{d.label}</div>
                  <div className="text-xs opacity-80">{d.desc}</div>
                  <div className="text-[10px] mt-2 opacity-60">{d.value}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Refine by specialty (optional) */}
        {selectedDifficulties.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-heading mb-1">Step 2 — Refine by Specialty (optional)</h2>
            <p className="text-xs text-body-dark mb-3">Leave empty to include all specialties.</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(subjects).map(subject => {
                const isSelected = selectedSubjects.includes(subject)
                return (
                  <button
                    key={subject}
                    onClick={() => {
                      toggleSubject(subject)
                      setExpandedSubject(isSelected ? null : subject)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      isSelected
                        ? 'bg-marine text-white border-marine'
                        : 'bg-white text-heading border-border-default hover:border-marine'
                    }`}
                  >
                    {subject}
                  </button>
                )
              })}
            </div>

            {/* Subtopics for expanded subject */}
            {expandedSubject && selectedSubjects.includes(expandedSubject) && subjects[expandedSubject] && (
              <div className="card mb-3">
                <p className="text-xs font-semibold text-heading mb-2">{expandedSubject} subtopics</p>
                <div className="flex flex-wrap gap-1.5">
                  {subjects[expandedSubject].map((t, i) => {
                    const isSelected = selectedSubtopics.includes(t.topic)
                    return (
                      <button
                        key={i}
                        onClick={() => toggleSubtopic(t.topic)}
                        className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                          isSelected
                            ? 'bg-marine/10 border-marine text-marine font-semibold'
                            : 'bg-white border-border-default text-body-dark hover:border-marine-mid'
                        }`}
                      >
                        {t.topic} ({t.count})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Question count and start */}
        {selectedDifficulties.length > 0 && (
          <div className="card flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-heading">Questions available: </span>
              <span className="text-lg font-bold text-marine">
                {loadingCount ? '...' : questionCount}
              </span>
            </div>
            <button
              onClick={startQuiz}
              disabled={questionCount === 0 || starting}
              className="btn-primary disabled:opacity-40"
            >
              {starting ? 'Starting...' : `Begin Assessment (${Math.min(questionCount, 50)})`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
