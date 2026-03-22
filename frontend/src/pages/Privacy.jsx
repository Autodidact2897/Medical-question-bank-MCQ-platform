import { useNavigate } from 'react-router-dom'

export default function Privacy() {
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

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-heading mb-6">Privacy Policy</h1>
        <p className="text-body-dark text-sm mb-2">Last updated: 22 March 2026</p>

        <div className="prose-sm text-body-dark leading-relaxed flex flex-col gap-5 mt-6">

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">1. Who we are</h2>
            <p>
              DiscoLabs ("we", "us", "our") operates the DiscoLabs MSRA revision platform at discolabs.co.uk.
              We are a UK-based educational technology company. For data protection purposes, we are the data controller.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">2. What data we collect</h2>
            <ul className="list-disc ml-5 flex flex-col gap-1">
              <li><strong>Account data:</strong> email address and a securely hashed password when you register.</li>
              <li><strong>Quiz data:</strong> your answers, scores, and session history so we can track your progress.</li>
              <li><strong>Diagnostic data:</strong> your Learning Needs Assessment results and identified weak areas.</li>
              <li><strong>Usage data:</strong> pages visited, feature usage, and basic analytics (via cookies or similar technologies).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">3. How we use your data</h2>
            <ul className="list-disc ml-5 flex flex-col gap-1">
              <li>To provide and personalise the revision platform and your study plan.</li>
              <li>To track your quiz performance and progress over time.</li>
              <li>To send you clinical briefs by email (only if you opt in).</li>
              <li>To improve our question bank and platform based on aggregate, anonymised usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">4. Legal basis (UK GDPR)</h2>
            <p>
              We process your data under <strong>legitimate interest</strong> (providing the service you signed up for)
              and <strong>consent</strong> (where you opt in to email briefs). You can withdraw consent at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">5. Data storage &amp; security</h2>
            <p>
              Your data is stored in a PostgreSQL database hosted in the EU (London region) by Neon.tech.
              Passwords are hashed with bcrypt and never stored in plain text. All connections use TLS/SSL encryption.
              Authentication tokens are stored in HttpOnly cookies to prevent cross-site scripting attacks.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">6. Data sharing</h2>
            <p>
              We do not sell your personal data. We may share anonymised, aggregate data for research purposes.
              We use the following third-party services:
            </p>
            <ul className="list-disc ml-5 flex flex-col gap-1 mt-1">
              <li>Vercel (frontend hosting)</li>
              <li>Render (backend hosting)</li>
              <li>Neon.tech (database hosting, EU London region)</li>
              <li>Sentry (error monitoring — may process anonymised error logs)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">7. Your rights</h2>
            <p>Under UK GDPR, you have the right to:</p>
            <ul className="list-disc ml-5 flex flex-col gap-1 mt-1">
              <li>Access the personal data we hold about you.</li>
              <li>Rectify inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Object to or restrict processing.</li>
              <li>Data portability (receive your data in a structured format).</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">8. Cookies</h2>
            <p>
              We use essential cookies (authentication tokens) required for the platform to function.
              We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">9. Data retention</h2>
            <p>
              We retain your account and quiz data for as long as your account is active.
              If you delete your account, all personal data will be removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">10. Contact</h2>
            <p>
              For privacy-related questions or requests, email us at{' '}
              <a href="mailto:hello@discolabs.co.uk" className="text-marine font-medium hover:underline">
                hello@discolabs.co.uk
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
