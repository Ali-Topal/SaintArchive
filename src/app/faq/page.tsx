export default function FaqPage() {
  const faqs = [
    {
      question: "What is Lucian Saint Raffles?",
      answer:
        "We run limited prize competitions that give our community the chance to win hard-to-find streetwear, accessories, and collectibles. Each drop is transparent, time-limited, and managed from a single dashboard.",
    },
    {
      question: "How do the raffles work?",
      answer:
        "Every drop lists the prize, ticket price, closing date, and live entry count. Once the timer ends, we verify payments, run the draw, and publish the winner.",
    },
    {
      question: "How do I enter?",
      answer:
        "Select the active drop, choose the number of tickets you want, and complete checkout through Stripe. You will receive a confirmation email once payment clears.",
    },
    {
      question: "How is the winner chosen?",
      answer:
        "We export the full entry list, assign sequential numbers, and select a winner using an independent random number generator. The process is recorded and may be shared on request.",
    },
    {
      question: "How will I be notified if I win?",
      answer:
        "Winners receive an email within 24 hours of the draw. We may also contact you via phone or Instagram if additional verification is required.",
    },
    {
      question: "Are entries refundable?",
      answer:
        "All entries are final once payment is processed. Please review the drop details carefully before confirming your purchase.",
    },
    {
      question: "What happens if a raffle doesn’t sell out?",
      answer:
        "We reserve the right to proceed with the draw regardless of ticket volume. If a competition must be cancelled for operational reasons, all entrants will be refunded automatically.",
    },
    {
      question: "Is this available internationally?",
      answer:
        "We primarily serve UK entrants, but most raffles are open worldwide unless a prize description states otherwise. Winners outside the UK are responsible for customs and import duties.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We currently accept major debit and credit cards via Stripe. Apple Pay and Google Pay may be available depending on your device and browser.",
    },
    {
      question: "When are winners announced?",
      answer:
        "Winners are announced within 24 hours of the draw closing. We update the raffle page, notify the community on social media, and contact the winner directly.",
    },
  ];

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-white/90">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Support</p>
        <h1 className="text-3xl font-semibold text-white">Frequently Asked Questions</h1>
      </header>
      <div className="space-y-6 text-sm leading-relaxed text-white/80">
        {faqs.map((item) => (
          <div key={item.question} className="space-y-2">
            <h2 className="text-base font-semibold text-white">{item.question}</h2>
            <p>{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

