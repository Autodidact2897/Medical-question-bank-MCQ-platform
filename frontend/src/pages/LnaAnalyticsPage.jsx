import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

export default function LnaAnalyticsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/lna/analytics')
      .then(res => setData(res.data.data))
      .catch(err => console.error('LNA analytics load failed:', err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading analytics...</p>
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
          <h1 className="text-2xl font-semibold text-heading mb-3">No Diagnostic Data Yet</h1>
          <p className="text-body-dark mb-6">Complete the Diagnostic Assessment to view detailed analytics.</p>
          <button onClick={() => navigate('/lna-quiz')} className="btn-primary">Begin Diagnostic Assessment</button>
        </div>
      </div>
    )
  }

  const { overallPercentage, takenAt, questions, subjectComparison } = data

  // Group questions by subject
  const bySubject = {}
  for (const q of questions) {
    if (!bySubject[q.subject]) bySubject[q.subject] = []
    bySubject[q.subject].push(q)
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/lna/results" className="btn-secondary text-sm">Diagnostic Report</Link>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">Clinical Dashboard</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold text-heading mb-2">Diagnostic Analytics</h1>
        <p className="text-sm text-body-dark mb-8">
          Full breakdown of your Diagnostic Assessment &middot; {takenAt ? new Date(takenAt).toLocaleDateString('en-GB') : ''}
          &middot; Overall: <span className="font-semibold text-marine">{overallPercentage}%</span>
        </p>

        {/* Subject comparison chart */}
        {subjectComparison.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-base font-semibold text-heading mb-4">Your Performance vs Platform Average</h2>
            <div className="flex flex-col gap-3">
              {subjectComparison.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-heading">{s.subject}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-body-dark w-8">You</span>
                      <div className="flex-1 h-2.5 bg-grey-light rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.userPercentage}%`, backgroundColor: '#0c3a5c' }} />
                      </div>
                      <span className="text-[10px] font-semibold text-heading w-8 text-right">{s.userPercentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-body-dark w-8">Avg</span>
                      <div className="flex-1 h-2.5 bg-grey-light rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gray-300" style={{ width: `${s.platformPercentage}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-body-dark w-8 text-right">{s.platformPercentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-body-dark">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#0c3a5c' }}></span> Your score</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-gray-300"></span> Platform average</span>
            </div>
          </div>
        )}

        {/* Full question breakdown by subject */}
        {Object.entries(bySubject).map(([subject, qs]) => {
          const correct = qs.filter(q => q.is_correct).length
          const pct = Math.round((correct / qs.length) * 100)
          return (
            <div key={subject} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-heading">{subject}</h2>
                <span className={`text-sm font-semibold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {correct}/{qs.length} ({pct}%)
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {qs.map((q, i) => (
                  <div key={i} className={`card border-l-4 ${q.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-heading flex-1">{q.question_text}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                        q.is_correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {q.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Answer options */}
                    <div className="flex flex-col gap-1 mb-3">
                      {['A', 'B', 'C', 'D', 'E'].map(letter => {
                        const optionText = q[`option_${letter.toLowerCase()}`]
                        if (!optionText) return null
                        const isCorrect = letter === q.correct_answer?.toUpperCase()
                        const isUserAnswer = letter === q.user_answer?.toUpperCase()
                        const isWrong = isUserAnswer && !isCorrect
                        return (
                          <div key={letter} className={`px-3 py-1.5 rounded text-xs ${
                            isCorrect ? 'bg-green-50 text-green-700 font-semibold' :
                            isWrong ? 'bg-red-50 text-red-700 font-semibold' :
                            'text-body-dark'
                          }`}>
                            <span className="font-bold mr-2">{letter}</span>{optionText}
                            {isCorrect && ' ✓'}
                            {isWrong && ' ✗'}
                          </div>
                        )
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                        <p className="text-xs text-heading">{q.explanation}</p>
                      </div>
                    )}

                    <p className="text-[10px] text-body-dark mt-2">{q.topic} &middot; {q.difficulty}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="flex gap-3">
          <Link to="/lna/results" className="btn-secondary">Diagnostic Report</Link>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Clinical Dashboard</button>
        </div>
      </div>
    </div>
  )
}
