export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-white/90">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Legal</p>
        <h1 className="text-3xl font-semibold text-white">Terms &amp; Conditions</h1>
      </header>

      <article className="space-y-5 text-sm leading-relaxed text-white/80">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">1. Eligibility</h2>
          <p>
            Lucian Saint Raffles prize competitions are open to all individuals. We
            reserve the right to restrict participation in jurisdictions where local regulations
            prohibit or limit prize competitions. Entrants are responsible for confirming that their
            participation is lawful.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">2. Nature of the Competition</h2>
          <p>
            Our raffles are prize competitions of skill and/or chance, depending on the drop. Each
            listing describes the item, ticket price, closing date, and any skill-based entry
            requirement. By entering, you acknowledge that winning is not guaranteed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">3. Entry Rules</h2>
          <p>
            Entries are submitted via our website using the official checkout form. You must provide
            accurate contact details so we can verify your identity if you win. Multiple entries are
            permitted unless a drop specifies a cap. Automated or bulk entries are prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">4. Payment and Refunds</h2>
          <p>
            Payments are processed securely through Stripe. All entries become final once payment is
            confirmed. We do not offer refunds or exchanges except where required by law or if a
            competition is cancelled by us prior to the draw.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">5. Closing Dates &amp; Draw Process</h2>
          <p>
            Each raffle lists an official closing date and time. We reserve the right to extend or
            shorten the closing window if necessary; any change will be announced on the raffle page.
            Draws are run within 24 hours of closing, following the method stated on the listing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">6. Winner Selection</h2>
          <p>
            Winners are chosen using an independent random number generator or other verifiable
            method. We match the generated number to our entry list, verify payment, and announce the
            result once identity checks are complete. Our decision is final.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">7. Liability</h2>
          <p>
            We are not liable for losses or damages arising from participation, except where liability
            cannot be excluded by law. Entrants accept that the competition is provided “as is” and
            agree that any issues relating to fulfilment or delivery will be handled in good faith.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">8. Right to Cancel or Amend</h2>
          <p>
            Lucian Saint Raffles may cancel or amend competitions if events beyond our control make
            it necessary. If a competition cannot proceed, we will refund all entries or offer an
            equivalent alternative prize at our discretion.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">9. Shipping and Fulfilment</h2>
          <p>
            We cover standard UK shipping. International winners are responsible for customs duties,
            taxes, and any additional courier charges. Delivery timelines and policies are described
            on our Shipping &amp; Fulfilment page.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">10. Payment Processing</h2>
          <p>
            All payments are handled by Stripe. By entering, you agree to Stripe’s terms and privacy
            policy. We do not store your card details on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">11. User Responsibilities</h2>
          <p>
            You must provide accurate information, keep your account secure, and refrain from any
            activity that could harm the platform. We may suspend entries or accounts if we detect
            fraudulent or abusive behaviour.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">12. Intellectual Property</h2>
          <p>
            All content, branding, and marketing material on this site belong to Lucian Saint
            Raffles. You may not reproduce or distribute our assets without express permission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">13. Contact</h2>
          <p>
            Questions about these terms can be sent to hello@luciansaint.com. We aim to respond
            within two working days.
          </p>
        </section>
      </article>
    </section>
  );
}

