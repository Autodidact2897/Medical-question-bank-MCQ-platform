import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function ClinicalBriefs() {
  const navigate = useNavigate()
  const [briefs, setBriefs] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/briefs').then(res => setBriefs(res.data.data || [])),
      api.get('/briefs/subjects').then(res => setSubjects(res.data.data || [])),
    ])
      .catch(err => console.error('Failed to load briefs:', err))
      .finally(() => setLoading(false))
  }, [])

  // Filter briefs
  const filtered = briefs.filter(b => {
    if (selectedSubject && b.subject !== selectedSubject) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        b.title?.toLowerCase().includes(q) ||
        b.subject?.toLowerCase().includes(q) ||
        b.topic?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Group by subject for display
  const grouped = {}
  for (const b of filtered) {
    if (!grouped[b.subject]) grouped[b.subject] = []
    grouped[b.subject].push(b)
  }
  const subjectOrder = Object.keys(grouped).sort()

  // Type badge colours
  const typeBadge = (type) => {
    if (type === 'CPS') return 'bg-blue-50 text-blue-700'
    if (type === 'PD') return 'bg-green-50 text-green-700'
    return 'bg-gray-100 text-body-dark'
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm">
          &larr; Clinical Dashboard
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-heading">Clinical Briefs</h1>
            <p className="text-body-dark text-sm mt-1">
              {briefs.length} concise revision notes mapped across the MSRA curriculum
            </p>
          </div>
          <span className="text-sm text-body-dark">{filtered.length} shown</span>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search briefs by title or topic..."
            className="flex-1 border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine"
          />
          <select
            value={selectedSubject || ''}
            onChange={e => setSelectedSubject(e.target.value || null)}
            className="border border-gray-200 rounded-btn px-3 py-2.5 text-sm text-heading focus:outline-none focus:border-marine bg-white"
          >
            <option value="">All sections ({briefs.length})</option>
            {subjects.map(s => (
              <option key={s.subject} value={s.subject}>
                {s.subject} ({s.count})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-marine font-medium">Loading briefs...</p>
        ) : filtered.length === 0 && briefs.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-4xl mb-3">&#x1F4DA;</div>
            <p className="text-heading font-semibold mb-1">Clinical Briefs coming soon</p>
            <p className="text-body-dark text-sm mb-4">We&apos;re building deep-dive learning resources for every MSRA topic.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">
              Back to Clinical Dashboard
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-heading font-semibold mb-1">No briefs match your search</p>
            <button onClick={() => { setSearch(''); setSelectedSubject(null) }} className="text-marine text-sm underline mt-2">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {subjectOrder.map(subject => (
              <div key={subject}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-semibold text-heading">{subject}</h2>
                  <span className="text-xs text-body-dark bg-grey-light px-2 py-0.5 rounded-full">
                    {grouped[subject].length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[subject].map(brief => (
                    <button
                      key={brief.brief_id || brief.id}
                      onClick={() => navigate(`/briefs/${brief.brief_id || brief.id}`)}
                      className="card text-left hover:border-marine transition-colors duration-150 py-3 px-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-heading text-sm leading-snug flex-1">
                          {brief.title}
                        </h3>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${typeBadge(brief.brief_type)}`}>
                          {brief.brief_type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          brief.source === 'v2.0' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-body-dark'
                        }`}>
                          {brief.source}
                        </span>
                        {brief.content ? (
                          <span className="text-marine text-xs font-medium">Read &rarr;</span>
                        ) : (
                          <span className="text-body-dark text-xs italic">Coming soon</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
