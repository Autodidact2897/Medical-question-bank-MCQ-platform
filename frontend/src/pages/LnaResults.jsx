import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

// Traffic light badge component — used throughout the site
function TrafficBadge({ level }) {
  const classes = {
    red: 'traffic-red',
    amber: 'traffic-amber',
    green: 'traffic-green',
  }
  const labels = { red: '⬤ Weak', amber: '⬤ Moderate', green: '⬤ Strong' }
  return <span className={classes[level] || classes.amber}>{labels[level] || level}</span>
}

export default function LnaResults() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('4months')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/quiz/${sessionId}/results`)
      .then(res => {
        const data = res.data.data || res.data
        // Build weak areas from results if available
        if (data.results) {
          const topicMap = {}
          for (const r of data.results) {
            const key = r.topic || 'General'
            if (!topicMap[key]) topicMap[key] = { topic: key, correct: 0, total: 0 }
            topicMap[key].total++
            if (r.is_correct) topicMap[key].correct++
          }
          const areas = Object.values(topicMap).map(t => {
            const pct = Math.round((t.correct / t.total) * 100)
            let level = 'green'
            if (pct < 40) level = 'red'
            else if (pct < 70) level = 'amber'
            return { topic: t.topic, level, percentage: pct }
          }).sort((a, b) => a.percentage - b.percentage)
          data.weakAreas = areas
        }
        setResults(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  const plans = [
    { id: '4months', label: '£25 for 4 months', badge: 'Most popular' },
    { id: 'monthly', label: '£10 per month', badge: null },
    { id: 'yearly', label: '£60 per year', badge: 'Best value' },
  ]

  const handleUpgrade = () => {
    // Routes to register (which will link to Stripe)
    navigate(`/register?plan=${selectedPlan}&session=${sessionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <p className="text-marine font-medium">Loading your results…</p>
      </div>
    )
  }

  // Use placeholder data if no real results yet
  const weakAreas = results?.weakAreas || [
    { topic: 'Acute Coronary Syndromes', level: 'red' },
    { topic: 'Diabetes Management', level: 'amber' },
    { topic: 'Respiratory Emergencies', level: 'red' },
  ]

  return (
    <div className="min-h-screen bg-bg-light">

      {/* ── Header ── */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚕</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Results Header ── */}
        <h1 className="text-3xl font-semibold text-heading mb-2">Your Results</h1>
        <p className="text-body-dark mb-8">Here's what the diagnostic identified as your top weak areas.</p>

        {/* ── Top 3 Weak Areas ── */}
        <div className="flex flex-col gap-3 mb-8">
          {weakAreas.slice(0, 3).map((area, i) => (
            <div key={i} className="card flex items-center justify-between">
              <span className="font-medium text-heading">{area.topic}</span>
              <TrafficBadge level={area.level} />
            </div>
          ))}
        </div>

        {/* ── Insight Callout ── */}
        <div className="bg-blue-50 border border-marine rounded-card px-5 py-4 mb-8">
          <h3 className="font-semibold text-marine mb-1">Here's what your results mean</h3>
          <p className="text-body-dark text-sm mb-3">
            Your results show gaps in high-yield MSRA topics. Targeted practice in these areas
            can meaningfully improve your score.
          </p>
          <p className="text-body-dark text-sm font-medium">
            Unlock your full assessment to see all 79 subtopics ranked and get your 12-week personalised study plan.
          </p>
        </div>

        {/* ── Comparison Table ── */}
        <div className="card mb-8 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="bg-grey-light px-5 py-3 text-left font-semibold text-heading border-b border-border-default">
                  FREE ASSESSMENT
                </th>
                <th className="bg-marine px-5 py-3 text-left font-semibold text-white border-b border-marine-dark">
                  FULL ASSESSMENT
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['20 sampler questions', '94 comprehensive questions'],
                ['Top 3 weak areas', 'All 79 subtopics ranked'],
                ['Traffic lights only', 'Ranked & detailed breakdown'],
                ['—', '12-week study plan'],
                ['—', '1,000+ question bank'],
                ['—', 'Progress tracking'],
              ].map(([free, paid], i) => (
                <tr key={i} className="border-b border-border-default last:border-0">
                  <td className="px-5 py-3 text-body-dark">{free}</td>
                  <td className="px-5 py-3 text-body-dark font-medium">{paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pricing Selector ── */}
        <div className="card mb-6">
          <h3 className="font-semibold text-heading mb-4">Choose your plan</h3>
          <div className="flex flex-col gap-3">
            {plans.map(plan => (
              <label
                key={plan.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-btn border-2 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-marine bg-blue-50'
                    : 'border-border-default bg-white hover:border-marine-mid'
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlan === plan.id}
                  onChange={() => setSelectedPlan(plan.id)}
                  className="accent-marine"
                />
                <span className="font-medium text-heading">{plan.label}</span>
                {plan.badge && (
                  <span className="ml-auto text-xs bg-marine text-white px-2 py-0.5 rounded font-semibold">
                    {plan.badge}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={handleUpgrade}
          className="w-full btn-primary text-base py-4 text-center"
        >
          Sign Up & Unlock Full LNA
        </button>

        <p className="text-center text-xs text-body-dark mt-3">
          Secure payment via Stripe · Cancel anytime
        </p>

      </div>
    </div>
  )
}
