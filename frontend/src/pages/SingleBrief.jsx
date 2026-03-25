import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'

export default function SingleBrief() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/briefs/${id}`)
      .then(res => { setBrief(res.data.data || res.data.brief); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading brief…</p>
      </div>
    )
  }

  if (!brief) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-light gap-4">
        <p className="text-heading font-medium">Brief not found.</p>
        <button onClick={() => navigate('/briefs')} className="btn-primary text-sm">
          ← Back to Briefs
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚕</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/briefs')} className="btn-secondary text-sm">
          ← All Briefs
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Topic badge */}
        {brief.topic && (
          <span className="inline-block text-xs font-semibold text-marine bg-blue-50 px-3 py-1 rounded mb-4">
            {brief.topic}
          </span>
        )}

        <h1 className="text-3xl font-semibold text-heading mb-2">{brief.title}</h1>

        {brief.guideline_source && (
          <p className="text-sm text-body-dark mb-6">
            Source: <span className="font-medium text-marine">{brief.guideline_source}</span>
          </p>
        )}

        <div className="card">
          {brief.content ? (
            <div className="max-w-none text-body-dark text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-heading [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-heading [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-heading [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:text-heading [&_strong]:font-semibold [&_hr]:my-4 [&_hr]:border-border-default">
              <ReactMarkdown>{brief.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-body-dark text-sm">No content available for this brief.</p>
          )}
        </div>

        {/* Key points */}
        {brief.key_points && brief.key_points.length > 0 && (
          <div className="card mt-4">
            <h2 className="font-semibold text-heading mb-3">Key Points</h2>
            <ul className="flex flex-col gap-2">
              {brief.key_points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-body-dark">
                  <span className="text-marine font-bold flex-shrink-0">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related questions link */}
        <div className="mt-6">
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (brief.topic) params.set('topic', brief.topic)
              if (brief.subject) params.set('subject', brief.subject)
              params.set('count', '10')
              navigate(`/quiz/brief-${id}?${params.toString()}`)
            }}
            className="btn-primary text-sm"
          >
            Practice Questions on This Topic →
          </button>
        </div>

      </div>
    </div>
  )
}
