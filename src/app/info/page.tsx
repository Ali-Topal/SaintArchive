export const metadata = {
  title: "How It Works | Lucian Saint Raffles",
};

const steps = [
  {
    title: "Choose the drop",
    description: "Browse the curated vault piece, study the details, and check the close date.",
  },
  {
    title: "Enter from £0.50",
    description: "Enterthrough our encrypted Stripe Checkout.",
  },
  {
    title: "Live draw & winner",
    description: "We stream the draw, publish the winning number, and email the winner instantly.",
  },
];

export default function InfoPage() {
  return (
    <div className="space-y-14 py-16">
      <section className="rounded-[32px] border border-white/10 bg-white/5/10 p-8 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.7)]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.6em] text-muted">
            How it works
          </p>
          <h1 className="mt-3 text-3xl font-light tracking-[0.2em] text-foreground">
            Three steps to the vault
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="space-y-4 rounded-[28px] border border-white/10 bg-linear-to-b from-white/5 to-transparent p-6 text-foreground/80"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-sm font-semibold tracking-[0.2em] text-foreground">
                {index + 1}
              </div>
              <h3 className="text-lg font-medium tracking-[0.25em] text-foreground">
                {step.title}
              </h3>
              <p className="text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-linear-to-r from-[#050505] via-[#08040c] to-[#020105] p-8 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.7)]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.6em] text-muted">
              Fair draw
            </p>
            <h2 className="text-3xl font-light tracking-[0.25em] text-foreground">
              Verifiable random winner, every time
            </h2>
            <p className="text-base text-foreground/80">
              Each draw uses a verifiable random number generator matched
              against the entry list. Results are timestamped, saved, and
              published on Instagram and this site so anyone can audit the outcome.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-[28px] border border-white/10 bg-white/5/20 p-6">
            <p className="text-xs uppercase tracking-[0.5em] text-muted">
              Trusted Processing
            </p>
            <div className="flex items-center gap-3 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Powered by Stripe
            </div>
            <p className="text-xs text-foreground/60">
              Payments secured via Stripe Checkout. No card or billing data ever touches
              our servers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

