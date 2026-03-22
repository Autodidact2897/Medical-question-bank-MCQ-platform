import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-light font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚕</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <button
          onClick={() => navigate('/rapid-diagnostic')}
          className="btn-primary text-sm"
        >
          Start Free Assessment
        </button>
      </header>

      {/* ── Hero ── */}
      <section className="bg-white px-6 py-16 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-semibold text-heading leading-tight mb-4">
          One exam. One opportunity.<br />Don't leave it to chance.
        </h1>
        <p className="text-body-dark text-lg mb-8">
          Most candidates revise blindly. Identify your exact weak areas with a free diagnostic assessment.
        </p>
        <button
          onClick={() => navigate('/rapid-diagnostic')}
          className="btn-primary text-base px-8 py-4"
        >
          Start Free Assessment
        </button>

        {/* Credibility box */}
        <div className="mt-10 bg-bg-light border border-border-default rounded-card px-6 py-4 inline-block">
          <p className="text-body-dark text-sm">
            Built by an MSRA scorer in the <strong className="text-marine">top 6%</strong> — Feb 2024 sitting · 591 score
          </p>
        </div>
      </section>

      {/* ── Problem Section ── */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-heading text-center mb-8">
          Why most MSRA candidates underperform
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Random practice doesn\'t work', body: 'Doing questions without targeting your weak areas wastes precious revision time.' },
            { title: 'No clear weaknesses = no focus', body: 'Without knowing where you\'re struggling, you can\'t build a focused study plan.' },
            { title: 'Curriculum gaps stay hidden', body: 'You don\'t know what you don\'t know — until it appears in the exam.' },
          ].map((card, i) => (
            <div key={i} className="card">
              <h3 className="font-semibold text-heading mb-2">{card.title}</h3>
              <p className="text-body-dark text-sm">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Solution Section ── */}
      <section className="bg-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-heading text-center mb-8">
            A smarter way to prepare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Take LNA Assessment', body: 'Identify your weakest topics in 15 minutes with 20 targeted questions.' },
              { step: '2', title: 'Get Personal Report', body: 'See exactly what you need to study — all 79 MSRA subtopics ranked.' },
              { step: '3', title: 'Targeted Question Bank', body: 'Practice what matters most with 1,000+ curriculum-mapped questions.' },
            ].map((item, i) => (
              <div key={i} className="card flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marine text-white text-sm font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-heading mb-1">{item.title}</h3>
                  <p className="text-body-dark text-sm">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section ── */}
      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          {[
            '✓ Curriculum-mapped',
            '✓ NICE-aligned clinical guidance',
            '✓ Clinically realistic scenarios',
          ].map((item, i) => (
            <div key={i} className="card text-marine font-semibold text-sm px-6 py-3">
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-marine px-6 py-16 text-center">
        <h2 className="text-3xl font-semibold text-white mb-4">
          Ready to find your weak areas?
        </h2>
        <p className="text-blue-200 mb-8">
          Take the free 20-question diagnostic assessment. No account needed.
        </p>
        <button
          onClick={() => navigate('/rapid-diagnostic')}
          className="bg-white text-marine font-semibold px-8 py-4 rounded-btn hover:bg-bg-light transition-colors duration-200"
        >
          Start Free Assessment
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border-default px-6 py-6 text-center">
        <p className="text-body-dark text-sm">© 2024 DiscoLabs. Built for UK doctors preparing for the MSRA.</p>
      </footer>

    </div>
  )
}
