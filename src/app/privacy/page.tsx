export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-white/90">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Legal</p>
        <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
      </header>

      <article className="space-y-5 text-sm leading-relaxed text-white/80">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Introduction</h2>
          <p>
            Lucian Saint Raffles (“we”, “us”, “our”) respects your privacy. This policy explains what
            data we collect, how we use it, and the controls available to you when entering our prize
            competitions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Data We Collect</h2>
          <p>We collect only the information needed to operate raffles and deliver prizes:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Email address, name, and contact details submitted during entry.</li>
            <li>Payment details processed securely by Stripe. We never store card numbers.</li>
            <li>Device information such as IP address, browser, and general usage analytics.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">How We Use Your Data</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Send entry confirmations, receipts, and draw updates.</li>
            <li>Notify winners and arrange fulfilment.</li>
            <li>Prevent fraud and protect platform security.</li>
            <li>Analyse performance so we can refine future drops.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Data Sharing</h2>
          <p>
            We share data only with essential service providers. Stripe processes payments, and
            Supabase hosts our database. We do not sell or rent your information to advertisers or
            unrelated third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Data Retention</h2>
          <p>
            Entry records are retained for as long as necessary to run competitions, resolve
            disputes, and satisfy legal or tax requirements. You may request deletion once the
            relevant competition has concluded, subject to statutory obligations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Cookies</h2>
          <p>
            We use essential cookies for authentication and session integrity, plus lightweight
            analytics cookies to understand site performance. You can manage cookie preferences
            through your browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Your Rights</h2>
          <p>
            You may access, correct, or request deletion of your personal data. Contact us and we
            will respond within a reasonable timeframe. If you believe your privacy rights have been
            violated, you may escalate the matter to your local data protection authority.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Contact</h2>
          <p>
            Privacy questions can be sent to privacy@luciansaint.com. We review the inbox daily and
            aim to reply within two working days.
          </p>
        </section>
      </article>
    </section>
  );
}

