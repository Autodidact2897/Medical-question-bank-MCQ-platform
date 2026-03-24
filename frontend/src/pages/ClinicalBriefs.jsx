import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

function TrafficBadge({ level }) {
  const classes = { red: 'traffic-red', amber: 'traffic-amber', green: 'traffic-green' }
  return <span className={classes[level] || 'traffic-amber'}>{level}</span>
}

export default function ClinicalBriefs() {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/briefs')
      .then(res => { setBriefs(res.data.data || res.data.briefs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = briefs.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.topic?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚕</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          ← Clinical Dashboard
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-heading">Clinical Briefs</h1>
            <p className="text-body-dark text-sm mt-1">Deep-dive learning resources for each MSRA topic</p>
          </div>
          <span className="text-sm text-body-dark">{briefs.length} briefs</span>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search briefs…"
            className="w-full border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
          />
        </div>

        {loading ? (
          <p className="text-marine font-medium">Loading briefs…</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">&#x1F4DA;</div>
            <p className="text-heading font-semibold mb-1">Clinical Briefs coming soon</p>
            <p className="text-body-dark text-sm mb-4">We're building deep-dive learning resources for every MSRA topic. Check back soon.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
              Back to Clinical Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(brief => (
              <button
                key={brief.id}
                onClick={() => navigate(`/briefs/${brief.id}`)}
                className="card text-left hover:border-marine transition-colors duration-150"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-heading text-sm leading-snug pr-2">{brief.title}</h3>
                  {brief.level && <TrafficBadge level={brief.level} />}
                </div>
                {brief.topic && (
                  <p className="text-xs text-body-dark mb-2">{brief.topic}</p>
                )}
                {brief.summary && (
                  <p className="text-xs text-body-dark line-clamp-2">{brief.summary}</p>
                )}
                <p className="text-marine text-xs font-medium mt-3">Read brief →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
