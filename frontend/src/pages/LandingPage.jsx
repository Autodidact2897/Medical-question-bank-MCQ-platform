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
      <header className="bg-white border-b border-border-default px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-xl">&#x2695;</span>
          <span className="text-marine font-semibold text-base sm:text-lg">DiscoLabs</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/login" className="text-xs sm:text-sm text-marine font-medium hover:underline">
            Sign In
          </Link>
          <button
            onClick={() => navigate('/rapid-diagnostic')}
            className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            Free Assessment
          </button>
        </div>
      </header>

      {/* ── Section 1: Above the Fold ── */}
      <section className="bg-white px-6 py-20 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-semibold text-heading leading-tight mb-4">
          Master the MSRA
        </h1>
        <p className="text-body-dark text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Built from the ground up as a dedicated MSRA preparation platform — not a generic question bank repurposed for the exam. Every question, diagnostic, and revision pathway is designed specifically around the MSRA curriculum.
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

      {/* ── Section 3b: Product Mockup Panels ── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-heading text-center mb-12">
          See what's inside
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Panel 1 — Quiz View Mockup */}
          <div>
            <div className="bg-white border border-border-default rounded-card overflow-hidden shadow-sm">
              {/* Progress bar */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between text-[10px] text-body-dark mb-1">
                  <span>Question 7 of 20</span>
                  <span>35%</span>
                </div>
                <div className="w-full h-1.5 bg-grey-light rounded-full overflow-hidden">
                  <div className="h-full bg-marine rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
              {/* Score tracker */}
              <div className="px-4 pb-2 flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  4
                </span>
                <span className="flex items-center gap-1 text-red-500 font-semibold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  2
                </span>
                <span className="text-marine font-bold ml-auto">67%</span>
              </div>
              {/* Question */}
              <div className="px-4 pb-3">
                <p className="text-xs font-semibold text-heading leading-snug">
                  A 58-year-old male presents with central crushing chest pain radiating to the left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most appropriate initial management?
                </p>
              </div>
              {/* Options */}
              <div className="px-4 pb-4 flex flex-col gap-1.5">
                {['A. Oral aspirin 300mg', 'B. IV amiodarone', 'C. Sublingual GTN', 'D. IV morphine', 'E. Thrombolysis'].map((opt, i) => (
                  <div key={i} className={`px-3 py-2 rounded border text-[11px] font-medium ${
                    i === 0 ? 'border-marine bg-marine/10 text-marine' : 'border-border-default text-heading'
                  }`}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-body-dark text-center mt-3 font-medium">Quiz Assessment View</p>
          </div>

          {/* Panel 2 — Dashboard Diagnostic Mockup */}
          <div>
            <div className="bg-white border border-border-default rounded-card overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border-default">
                <p className="text-xs font-semibold text-heading">Diagnostic Breakdown</p>
              </div>
              {/* Subject tabs */}
              <div className="px-4 pt-3 flex gap-1 overflow-x-auto pb-2">
                {['Cardio', 'Resp', 'GI', 'Endo'].map((tab, i) => (
                  <span key={i} className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                    i === 0 ? 'bg-marine text-white' : 'bg-grey-light text-body-dark'
                  }`}>{tab}</span>
                ))}
              </div>
              {/* Subject rows with traffic lights */}
              <div className="px-4 pb-4 flex flex-col gap-2 mt-2">
                {[
                  { name: 'Ischaemic Heart Disease', pct: 85, color: 'bg-green-500' },
                  { name: 'Heart Failure', pct: 62, color: 'bg-amber-500' },
                  { name: 'Arrhythmias', pct: 45, color: 'bg-red-500' },
                  { name: 'Valvular Disease', pct: 78, color: 'bg-green-500' },
                  { name: 'Hypertension', pct: 55, color: 'bg-amber-500' },
                  { name: 'Acute Coronary Syndromes', pct: 38, color: 'bg-red-500' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} />
                      <span className="text-[11px] text-heading">{row.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-body-dark">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-body-dark text-center mt-3 font-medium">Diagnostic Dashboard</p>
          </div>

          {/* Panel 3 — Clinical Brief Mockup */}
          <div>
            <div className="bg-white border border-border-default rounded-card overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
                <span className="text-[10px] font-semibold text-marine bg-blue-50 px-2 py-0.5 rounded">Cardiovascular</span>
                <span className="text-[10px] text-body-dark">CB_042</span>
              </div>
              <div className="px-4 py-3">
                <h3 className="text-xs font-semibold text-heading mb-2">Acute Coronary Syndromes</h3>
                <p className="text-[11px] text-body-dark leading-relaxed mb-3">
                  Acute coronary syndromes encompass a spectrum of presentations from unstable angina to STEMI, unified by the common pathology of coronary plaque rupture and thrombosis.
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    'NICE TA236: Dual antiplatelet therapy post-ACS',
                    'Troponin rises within 3–6 hours of onset',
                    'STEMI: primary PCI within 120 minutes',
                    'GRACE score stratifies risk in NSTEMI',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-marine text-[10px] mt-0.5">&#x2022;</span>
                      <span className="text-[11px] text-body-dark leading-snug">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-body-dark text-center mt-3 font-medium">Clinical Brief Library</p>
          </div>

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
            'Clinician validated content by practising UK doctors',
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
          <p className="text-body-dark text-center mb-10">See how DiscoLabs compares to typical question banks.</p>

          {/* Mobile: stacked cards */}
          <div className="block md:hidden flex flex-col gap-3">
            {[
              { typical: 'Start with random questions', disco: 'Start with a curriculum-wide diagnostic' },
              { typical: 'Rely on you choosing topics', disco: 'Identify your weakest areas automatically' },
              { typical: 'Focus on quantity of questions', disco: 'Focus on high-yield knowledge gaps' },
              { typical: 'Easy to miss entire topics', disco: 'Structured coverage of the full curriculum' },
              { typical: 'Progress feels uncertain', disco: 'Clear, data-driven revision plan' },
              { typical: 'Questions often added ad hoc over time', disco: 'Built systematically from the full MSRA curriculum' },
            ].map((row, i) => (
              <div key={i} className="bg-white border border-border-default rounded-card p-4">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className="text-sm text-body-dark">{row.typical}</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm text-heading font-medium">{row.disco}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: two-column comparison table */}
          <div className="hidden md:block">
            <div className="rounded-card overflow-hidden border border-border-default">
              {/* Header row */}
              <div className="grid grid-cols-2">
                <div className="bg-grey-light px-6 py-4 border-b border-r border-border-default">
                  <span className="text-sm font-semibold text-body-dark">Typical Question Banks</span>
                </div>
                <div className="bg-marine px-6 py-4 border-b border-marine">
                  <span className="text-sm font-bold text-white">DiscoLabs</span>
                </div>
              </div>
              {/* Body rows */}
              {[
                { typical: 'Start with random questions', disco: 'Start with a curriculum-wide diagnostic' },
                { typical: 'Rely on you choosing topics', disco: 'Identify your weakest areas automatically' },
                { typical: 'Focus on quantity of questions', disco: 'Focus on high-yield knowledge gaps' },
                { typical: 'Easy to miss entire topics', disco: 'Structured coverage of the full curriculum' },
                { typical: 'Progress feels uncertain', disco: 'Clear, data-driven revision plan' },
                { typical: 'Questions often added ad hoc over time', disco: 'Built systematically from the full MSRA curriculum' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2">
                  <div className="px-6 py-4 border-b border-r border-border-default flex items-center gap-3">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="text-sm text-body-dark">{row.typical}</span>
                  </div>
                  <div className="px-6 py-4 border-b border-border-default bg-blue-50/40 flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-heading font-medium">{row.disco}</span>
                  </div>
                </div>
              ))}
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
              a: 'All content is written within strict clinical and guideline-based frameworks, referenced to NICE, BNF, SIGN, and GMC guidance, and clinician validated before publication.',
            },
            {
              q: 'How is the content produced?',
              a: 'Every question follows a rigorous clinical framework mapped to the official MSRA curriculum. Content is clinician reviewed and validated to ensure accuracy, clinical relevance, and alignment with current UK practice.',
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
