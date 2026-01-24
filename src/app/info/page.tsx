export const metadata = {
  title: "How It Works | Saint Archive",
};

const steps = [
  {
    title: "Browse Our Collection",
    description:
      "Explore our curated selection of luxury streetwear, sneakers, and accessories. Each piece is carefully selected and authenticated.",
  },
  {
    title: "Place Your Order",
    description:
      "Select your size, fill in your shipping details, and place your order. You'll receive an order number immediately.",
  },
  {
    title: "Complete Payment",
    description:
      "Send payment via PayPal using your order number as the reference. Once confirmed, we'll prepare your order for shipping.",
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
            Simple & Secure Shopping
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
              Our Promise
            </p>
            <h2 className="text-3xl font-light tracking-[0.25em] text-foreground">
              Authentic & Secure
            </h2>
            <div className="space-y-4 text-base text-foreground/80">
              <p>
                Every item in our collection is carefully verified for authenticity. 
                We source directly from trusted suppliers and inspect each piece before listing.
              </p>
              <p>
                Your order is tracked from purchase to delivery. We'll keep you updated 
                every step of the way via email.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-[28px] border border-white/10 bg-white/5/20 p-6">
            <p className="text-xs uppercase tracking-[0.5em] text-muted">
              Payment
            </p>
            <div className="flex items-center gap-3 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.4em] text-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              PayPal Secure
            </div>
            <p className="text-xs text-foreground/60">
              All payments are processed through PayPal for your security and buyer protection.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 px-6 py-4 text-sm font-semibold text-green-400">
          ✔ All items are 100% authentic and verified
        </div>
      </section>
    </div>
  );
}
