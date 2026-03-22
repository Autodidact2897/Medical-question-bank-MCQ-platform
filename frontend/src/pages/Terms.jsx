import { useNavigate } from 'react-router-dom'

export default function Terms() {
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
        <h1 className="text-2xl font-semibold text-heading mb-6">Terms &amp; Conditions</h1>
        <p className="text-body-dark text-sm mb-2">Last updated: 22 March 2026</p>

        <div className="prose-sm text-body-dark leading-relaxed flex flex-col gap-5 mt-6">

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">1. About the service</h2>
            <p>
              DiscoLabs provides an online question bank and revision tool designed for doctors preparing
              for the MSRA (Multi-Specialty Recruitment Assessment) examination. The platform is operated
              from the United Kingdom.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">2. Acceptance of terms</h2>
            <p>
              By creating an account or using the platform, you agree to these Terms &amp; Conditions.
              If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">3. Educational purpose only</h2>
            <p>
              All content on DiscoLabs is for educational and revision purposes only. It does not constitute
              medical advice. Clinical decisions should always be based on current NICE, BNF, SIGN, and GMC
              guidelines, and your own clinical judgement.
            </p>
            <p className="mt-2">
              While we strive for accuracy, we cannot guarantee that every question or explanation is free
              from error. If you spot an inaccuracy, please report it to us.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">4. Accounts</h2>
            <ul className="list-disc ml-5 flex flex-col gap-1">
              <li>You must provide a valid email address to create an account.</li>
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>One account per person. Sharing accounts is not permitted.</li>
              <li>We reserve the right to suspend accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">5. Intellectual property</h2>
            <p>
              All questions, explanations, clinical briefs, and other content are the intellectual property
              of DiscoLabs. You may not copy, reproduce, distribute, or create derivative works from our
              content without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">6. Free assessment</h2>
            <p>
              The Rapid Diagnostic Assessment is available without an account. By completing it and providing
              your email, you consent to receiving your results and occasional updates from DiscoLabs.
              You can unsubscribe at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">7. Availability</h2>
            <p>
              We aim to keep the platform available at all times but do not guarantee uninterrupted access.
              We may take the service offline for maintenance, updates, or improvements without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">8. Limitation of liability</h2>
            <p>
              DiscoLabs is provided "as is". To the fullest extent permitted by law, we exclude all
              warranties and shall not be liable for any indirect, incidental, or consequential damages
              arising from your use of the platform.
            </p>
            <p className="mt-2">
              We are not responsible for your exam performance. The platform is a revision aid, not a
              guarantee of results.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">9. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated via
              email or a notice on the platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">10. Governing law</h2>
            <p>
              These terms are governed by the laws of England and Wales. Any disputes will be subject
              to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-heading mb-2">11. Contact</h2>
            <p>
              Questions about these terms? Email us at{' '}
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
