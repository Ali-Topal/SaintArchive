export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-white/90">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">About</p>
        <h1 className="text-3xl font-semibold text-white">Saint Archive</h1>
      </header>

      <article className="space-y-5 text-sm leading-relaxed text-white/80">
        <p className="text-lg">
          Curating authentic luxury streetwear, sneakers, and accessories.
        </p>

        <p>
          Saint Archive was founded with a simple mission: to make sought-after pieces 
          accessible to the UK streetwear community. Every item in our collection is 
          carefully sourced and verified for authenticity.
        </p>

        <p>
          We believe in transparency, quality, and exceptional service. When you shop 
          with us, you're getting pieces that have been hand-selected and authenticated 
          before they reach our store.
        </p>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Our Promise</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>100% authentic products, always</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Carefully inspected before listing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Fast UK shipping</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">✓</span>
              <span>Responsive customer service</span>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">Connect With Us</h2>
          <p>
            Follow us on{" "}
            <a
              href="https://instagram.com/saintarchive88"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-white/80"
            >
              Instagram @saintarchive88
            </a>{" "}
            and{" "}
            <a
              href="https://tiktok.com/@saintarchive88"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-white/80"
            >
              TikTok @saintarchive88
            </a>{" "}
            for new drops, behind-the-scenes content, and more.
          </p>
        </section>
      </article>
    </section>
  );
}
