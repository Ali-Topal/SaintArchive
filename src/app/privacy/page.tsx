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
            Saint Archive ("we", "us", "our") respects your privacy. This policy explains what
            data we collect, how we use it, and your rights regarding your personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Data We Collect</h2>
          <p>We collect only the information necessary to process your orders:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Name, email address, and phone number provided during checkout.</li>
            <li>Shipping address for order delivery.</li>
            <li>Order history and transaction records.</li>
            <li>Device information such as IP address, browser type, and general usage analytics.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">How We Use Your Data</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Process and fulfill your orders.</li>
            <li>Send order confirmations and shipping updates.</li>
            <li>Respond to customer service enquiries.</li>
            <li>Prevent fraud and protect platform security.</li>
            <li>Improve our website and services based on usage patterns.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Payment Information</h2>
          <p>
            We do not store any payment information. All payments are processed through PayPal, 
            and your financial data is handled directly by PayPal's secure systems. We only 
            receive confirmation of payment, not your payment details.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Data Sharing</h2>
          <p>
            We share data only with essential service providers required to operate our business:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Courier services for order delivery.</li>
            <li>Supabase for secure database hosting.</li>
            <li>Resend for transactional emails.</li>
          </ul>
          <p className="mt-2">
            We do not sell or rent your information to advertisers or unrelated third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Data Retention</h2>
          <p>
            Order records are retained for as long as necessary to provide customer service, 
            handle returns, resolve disputes, and comply with legal and tax requirements. 
            You may request deletion of your data, subject to statutory obligations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Cookies</h2>
          <p>
            We use essential cookies for website functionality and lightweight analytics 
            cookies to understand site performance. You can manage cookie preferences 
            through your browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Your Rights</h2>
          <p>
            You have the right to access, correct, or request deletion of your personal data. 
            Contact us and we will respond within a reasonable timeframe. If you believe your 
            privacy rights have been violated, you may escalate the matter to the Information 
            Commissioner's Office (ICO).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Contact</h2>
          <p>
            Privacy questions can be sent to us via Instagram @saintarchive88. We aim to 
            respond within two working days.
          </p>
        </section>
      </article>
    </section>
  );
}
