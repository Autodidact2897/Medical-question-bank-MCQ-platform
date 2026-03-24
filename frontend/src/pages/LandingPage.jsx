import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-bg-light font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-lg">DiscoLabs</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-marine font-medium hover:underline hidden sm:inline">
            Sign In
          </Link>
          <button
            onClick={() => navigate('/rapid-diagnostic')}
            className="btn-primary text-sm"
          >
            Start Free Assessment
          </button>
        </div>
      </header>

      {/* ── Section 1: Above the Fold ── */}
      <section className="bg-white px-6 py-20 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-semibold text-heading leading-tight mb-6">
          Stop guessing what to revise for the MSRA.
        </h1>
        <p className="text-body-dark text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Take a free 15-minute diagnostic assessment. Get a personalised, curriculum-mapped report
          showing your weakest areas — and a targeted plan to fix them.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/rapid-diagnostic')}
            className="btn-primary text-base px-8 py-4"
          >
            Start Free Assessment
          </button>
          <button
            onClick={scrollToHow}
            className="btn-secondary text-base px-8 py-4"
          >
            See How It Works
          </button>
        </div>
      </section>

      {/* ── Section 2: The Problem ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-heading text-center mb-4">
          Most candidates revise the wrong way
        </h2>
        <p className="text-body-dark text-center mb-10 max-w-2xl mx-auto leading-relaxed">
          You do random questions with no structure. You gravitate towards topics you already know.
          You skip entire areas of the curriculum without realising. You walk into the exam hoping
          you've covered enough.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Random practice wastes time',
              body: 'You repeat topics you already know while entire curriculum areas go untouched.',
            },
            {
              title: 'No clarity on weaknesses',
              body: 'Without knowing where you\'re struggling, you can\'t build a focused study plan.',
            },
            {
              title: 'Gaps stay hidden until the exam',
              body: 'You don\'t know what you don\'t know — until it appears on the paper.',
            },
          ].map((card, i) => (
            <div key={i} className="card">
              <h3 className="font-semibold text-heading mb-2">{card.title}</h3>
              <p className="text-body-dark text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-heading font-semibold">
          That's not a knowledge problem. That's a strategy problem.
        </p>
      </section>

      {/* ── Section 3: The Mechanism ── */}
      <section id="how-it-works" className="bg-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-heading text-center mb-12">
            Start with clarity, not guesswork
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Take the Diagnostic Assessment',
                body: 'A focused diagnostic that samples the entire MSRA curriculum. Identifies your weak areas rapidly, without requiring hours of your time.',
              },
              {
                step: '2',
                title: 'Get your personalised report',
                body: 'A topic-by-topic breakdown of your performance, ranked by clinical importance and exam weighting. You see exactly where you stand.',
              },
              {
                step: '3',
                title: 'Follow a targeted revision plan',
                body: 'Questions mapped directly to your weaknesses. No wasted time on topics you already understand. Every session moves you forward.',
              },
            ].map((item, i) => (
              <div key={i} className="card flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-marine text-white text-base font-bold flex items-center justify-center">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-heading mb-2">{item.title}</h3>
                  <p className="text-body-dark text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-10 text-marine font-semibold">
            You don't just practise questions — you systematically eliminate weaknesses.
          </p>
        </div>
      </section>

      {/* ── Section 4: Product Proof ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-heading text-center mb-10">
          Built for how the MSRA is actually examined
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            'Fully mapped to the official MSRA curriculum blueprint',
            'All explanations referenced to NICE, BNF, SIGN, and GMC guidance',
            'Clinically realistic question style reflecting actual exam format',
            'Content validated by practising UK clinicians',
            '2,000 curriculum-mapped questions across CPS and Professional Dilemmas',
            'Continuous content review and updates',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-border-default rounded-card px-5 py-4">
              <span className="text-green-traffic font-bold mt-0.5">&#x2713;</span>
              <span className="text-body-dark text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-bg-light border border-border-default rounded-card px-6 py-4 text-center">
          <p className="text-body-dark text-sm">
            Built by an MSRA scorer in the <strong className="text-marine">top 6%</strong> — Feb 2024 sitting
          </p>
        </div>
      </section>

      {/* ── Section 5: Feature Comparison ── */}
      <section className="bg-white px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-heading text-center mb-3">
            How this is different
          </h2>
          <p className="text-body-dark text-center mb-10">See how DiscoLabs compares to other MSRA preparation platforms.</p>

          {/* Mobile: stacked cards */}
          <div className="block md:hidden">
            {[
              { feature: 'Personalised Diagnostic Assessment', disco: true, pass: false, bmj: false },
              { feature: 'MSRA-specific content', disco: true, pass: 'partial', bmj: false },
              { feature: 'UK guidelines only', disco: true, pass: true, bmj: true },
              { feature: 'Community question discussion', disco: true, pass: false, bmj: false },
              { feature: 'Performance comparison analytics', disco: true, pass: false, bmj: 'partial' },
              { feature: 'Adaptive revision based on weak areas', disco: true, pass: false, bmj: false },
              { feature: 'Price', disco: 'Free', pass: '£35/mo', bmj: '£60/yr' },
            ].map((row, i) => (
              <div key={i} className="border-b border-border-default py-3 last:border-0">
                <p className="text-sm font-semibold text-heading mb-2">{row.feature}</p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1"><span className="font-semibold text-marine">DiscoLabs:</span> {typeof row.disco === 'string' ? row.disco : row.disco ? <span className="text-green-600">&#x2713;</span> : <span className="text-red-400">&#x2717;</span>}</span>
                  <span className="flex items-center gap-1"><span className="text-body-dark">PM:</span> {typeof row.pass === 'string' ? row.pass : row.pass === 'partial' ? <span className="text-amber-500">~</span> : row.pass ? <span className="text-green-600">&#x2713;</span> : <span className="text-red-400">&#x2717;</span>}</span>
                  <span className="flex items-center gap-1"><span className="text-body-dark">BMJ:</span> {typeof row.bmj === 'string' ? row.bmj : row.bmj === 'partial' ? <span className="text-amber-500">~</span> : row.bmj ? <span className="text-green-600">&#x2713;</span> : <span className="text-red-400">&#x2717;</span>}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: comparison table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-0 rounded-card overflow-hidden border border-border-default">
              {/* Header row */}
              <div className="bg-grey-light px-5 py-4 border-b border-border-default">
                <span className="text-sm font-semibold text-body-dark">Feature</span>
              </div>
              <div className="bg-marine px-5 py-4 border-b border-marine text-center">
                <span className="text-sm font-bold text-white">DiscoLabs</span>
              </div>
              <div className="bg-grey-light px-5 py-4 border-b border-border-default text-center">
                <span className="text-sm font-semibold text-heading">PassMedicine</span>
              </div>
              <div className="bg-grey-light px-5 py-4 border-b border-border-default text-center">
                <span className="text-sm font-semibold text-heading">BMJ OnExamination</span>
              </div>

              {/* Feature rows */}
              {[
                { feature: 'Personalised Diagnostic Assessment', disco: true, pass: false, bmj: false },
                { feature: 'MSRA-specific content', disco: true, pass: 'partial', bmj: false },
                { feature: 'UK guidelines only', disco: true, pass: true, bmj: true },
                { feature: 'Community question discussion', disco: true, pass: false, bmj: false },
                { feature: 'Performance comparison analytics', disco: true, pass: false, bmj: 'partial' },
                { feature: 'Adaptive revision based on weak areas', disco: true, pass: false, bmj: false },
                { feature: 'Price', disco: 'Free', pass: '£35/mo', bmj: '£60/yr' },
              ].map((row, i) => {
                const renderCell = (val) => {
                  if (typeof val === 'string') return <span className="text-sm font-semibold text-heading">{val}</span>
                  if (val === 'partial') return <span className="text-amber-500 text-lg">~</span>
                  if (val === true) return <span className="text-green-600 text-lg">&#x2713;</span>
                  return <span className="text-red-300 text-lg">&#x2717;</span>
                }
                return [
                  <div key={`f-${i}`} className="px-5 py-3 border-b border-border-default flex items-center">
                    <span className="text-sm text-heading font-medium">{row.feature}</span>
                  </div>,
                  <div key={`d-${i}`} className="px-5 py-3 border-b border-border-default text-center bg-blue-50/40 flex items-center justify-center">
                    {renderCell(row.disco)}
                  </div>,
                  <div key={`p-${i}`} className="px-5 py-3 border-b border-border-default text-center flex items-center justify-center">
                    {renderCell(row.pass)}
                  </div>,
                  <div key={`b-${i}`} className="px-5 py-3 border-b border-border-default text-center flex items-center justify-center">
                    {renderCell(row.bmj)}
                  </div>,
                ]
              })}
            </div>
          </div>

          <p className="text-center mt-8 text-heading font-semibold">
            More questions &#x2260; better preparation. Better targeting = better results.
          </p>
        </div>
      </section>

      {/* ── Section 6: Objection Handling / FAQ ── */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-heading text-center mb-10">
          Common questions
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              q: 'Is this content accurate?',
              a: 'All content is written within strict clinical and guideline-based frameworks, referenced to NICE, BNF, SIGN, and GMC guidance, and validated by practising UK clinicians before publication.',
            },
            {
              q: 'How is the content produced?',
              a: 'Every question follows a rigorous clinical framework mapped to the official MSRA curriculum. Content is reviewed and validated by real clinicians to ensure accuracy, clinical relevance, and alignment with current UK practice.',
            },
            {
              q: 'What makes this better than just doing random questions?',
              a: 'If you already know exactly where your weaknesses are, any practice will help. If you don\'t — you\'re guessing. DiscoLabs diagnoses your gaps first, then targets them. That\'s a fundamentally different approach.',
            },
            {
              q: 'Is this worth the money?',
              a: 'The MSRA determines your specialty training allocation for the next two or more years. The question isn\'t whether preparation is worth investing in — it\'s whether you can afford to leave gaps in your revision.',
            },
          ].map((faq, i) => (
            <div key={i} className="card">
              <h3 className="font-semibold text-heading mb-2">{faq.q}</h3>
              <p className="text-body-dark text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 7: Final CTA ── */}
      <section className="bg-marine px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          One exam. One opportunity.<br />Don't leave it to chance.
        </h2>
        <p className="text-blue-200 mb-10 max-w-xl mx-auto">
          The MSRA decides your next two years. Start with a free diagnostic that shows you exactly where to focus.
        </p>
        <button
          onClick={() => navigate('/rapid-diagnostic')}
          className="bg-white text-marine font-semibold px-8 py-4 rounded-btn hover:bg-bg-light transition-colors duration-200 text-base"
        >
          Start Free Assessment
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border-default px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">&#x2695;</span>
            <span className="text-marine font-semibold">DiscoLabs</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-body-dark hover:text-marine">Privacy Policy</Link>
            <Link to="/terms" className="text-body-dark hover:text-marine">Terms & Conditions</Link>
          </div>
          <p className="text-body-dark text-xs">&copy; 2026 DiscoLabs. Built for UK doctors preparing for the MSRA.</p>
        </div>
      </footer>

    </div>
  )
}
