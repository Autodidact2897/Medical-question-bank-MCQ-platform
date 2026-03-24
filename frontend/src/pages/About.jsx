import { useNavigate } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </button>
        <button onClick={() => navigate(-1)} className="text-marine text-sm font-medium hover:underline">
          &larr; Back
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/images/founder.jpg"
            alt="Ben Popham"
            className="w-28 h-28 rounded-full object-cover mb-4 shadow-md"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div
            className="w-28 h-28 rounded-full items-center justify-center text-white text-3xl font-bold mb-4 shadow-md hidden"
            style={{ backgroundColor: '#0c3a5c' }}
          >
            BP
          </div>
          <h1 className="text-2xl font-semibold text-heading mb-1">Ben Popham</h1>
          <p className="text-sm text-body-dark">Founder, DiscoLabs</p>
          <span className="inline-block text-xs font-medium text-marine bg-blue-50 px-3 py-1 rounded-full mt-2">
            MSRA Score: 591 — February 2024 Cohort
          </span>
        </div>

        <div className="card">
          <p className="text-sm text-heading leading-relaxed mb-4">
            Hi, I'm Ben. When I prepared for the MSRA, I realised the biggest challenge wasn't effort — it was uncertainty. I had no clear way of knowing which topics I was weakest in, or whether my revision was actually addressing the gaps that mattered most.
          </p>
          <p className="text-sm text-heading leading-relaxed mb-4">
            DiscoLabs is built to fix that. It gives you a personalised breakdown of your weakest areas, so you can focus your revision where it will make the biggest difference — without guesswork or wasting hours on topics you already know.
          </p>
          <p className="text-sm text-heading leading-relaxed mb-4">
            DiscoLabs starts with a curriculum-wide assessment to identify your weakest areas, so your revision is targeted rather than random.
          </p>
          <p className="text-sm text-heading leading-relaxed">
            The goal is simple: help you target the right topics, close your gaps, and walk into the exam with confidence.
          </p>
        </div>
      </div>
    </div>
  )
}
