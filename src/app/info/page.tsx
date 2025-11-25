export const metadata = {
  title: "How It Works | Lucian Saint Raffles",
};

const steps = [
  {
    title: "Choose the Drop",
    description:
      "Browse the latest curated items — sneakers, clothing, accessories, and limited collaborations. Each drop shows its closing time, item details, and entry price.",
  },
  {
    title: "Enter Securely From £1",
    description:
      "Enter in seconds using encrypted Stripe Checkout. Choose multiple entries if you want to boost your odds.",
  },
  {
    title: "Guaranteed Winner",
    description:
      "When the timer ends, a winner is drawn—no matter how many tickets were sold. The winning number is instantly published on this website and on Instagram.",
  },
];

export default function InfoPage() {
  return (
    <div className="space-y-14 pt-12 pb-16">
      <section className="rounded-[32px] border border-white/10 bg-white/5/10 p-8 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.7)]">
        <div className="mb-6">
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
              Fair, Transparent & Secure
            </p>
            <h2 className="text-3xl font-light tracking-[0.25em] text-foreground">
              Fair, Transparent & Secure
            </h2>
            <div className="space-y-4 text-base text-foreground/80">
              <p>
                Every draw uses a verifiable random number generator matched directly to the entry list.
                Once the winner is selected, the result is timestamped, stored, and published publicly for
                anyone to verify.
              </p>
              <p>
                Winners are contacted instantly by email. Prize dispatch times, winner information, and past
                results are always visible on the Winners page.
              </p>
            </div>
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
        <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 px-6 py-4 text-sm font-semibold text-green-400">
          ✔ A winner is ALWAYS chosen, even if not all tickets sell.
        </div>
      </section>
    </div>
  );
}

