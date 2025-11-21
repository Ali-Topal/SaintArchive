import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";
import { createSupabaseServerClient } from "@/lib/supabaseClient";
import { stripe } from "@/lib/stripe";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 0;

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default async function ThankYouPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionIdParam = params?.session_id;
  const sessionId =
    typeof sessionIdParam === "string" ? sessionIdParam : undefined;

  if (!sessionId) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Almost there.</h1>
        <p>Missing Stripe session ID. Please return to the homepage and try again.</p>
        <Link href="/" className="text-sm uppercase tracking-[0.3em] text-white hover:underline">
          Back to drops
        </Link>
      </section>
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });
  } catch (error) {
    console.error("[thank-you] Failed to retrieve session:", error);
    return (
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-white/80">
        <h1 className="text-3xl font-semibold text-white">Unable to load payment.</h1>
        <p>We couldn’t validate your checkout session. Please check your email or contact support.</p>
        <Link href="/" className="text-sm uppercase tracking-[0.3em] text-white hover:underline">
          Back to drops
        </Link>
      </section>
    );
  }

  const ticketCount = Number(session.metadata?.ticketCount ?? 0);
  const raffleId = session.metadata?.raffleId;
  const selectedOption = session.metadata?.selectedOption ?? "";
  const entryEmail =
    session.metadata?.email ??
    session.customer_details?.email ??
    session.customer_email ??
    "—";

  let closesAt: string | null = null;
  let raffleTitle = session.metadata?.raffleTitle ?? "Your entry";
  let ticketPrice: number | null = null;

  if (raffleId) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("raffles")
      .select("title,closes_at,ticket_price_cents")
      .eq("id", raffleId)
      .maybeSingle();

    if (data) {
      raffleTitle = data.title ?? raffleTitle;
      closesAt = data.closes_at ?? null;
      ticketPrice = data.ticket_price_cents ?? null;
    }
  }

  const totalLabel =
    ticketCount && ticketPrice
      ? currencyFormatter.format((ticketPrice * ticketCount) / 100)
      : undefined;

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-16 text-white/80">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Confirmed</p>
        <h1 className="text-4xl font-semibold text-white">You’re in.</h1>
        <p>
          We’ve emailed <span className="text-white">{entryEmail}</span> with your
          entry receipt and Stripe confirmation.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Raffle</p>
        <h2 className="text-2xl font-semibold text-white">{raffleTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Entries</p>
            <p className="text-2xl font-semibold text-white">
              {ticketCount > 0 ? ticketCount : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total</p>
            <p className="text-2xl font-semibold text-white">
              {totalLabel ?? "—"}
            </p>
          </div>
          {selectedOption && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Selected option
              </p>
              <p className="text-xl font-semibold text-white">{selectedOption}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/80">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Countdown to draw</p>
        {closesAt ? (
          <CountdownTimer targetDate={closesAt} className="justify-start text-white" />
        ) : (
          <p>Draw date will be announced soon.</p>
        )}
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-white hover:underline"
        >
          Back to drops
        </Link>
      </div>
    </section>
  );
}

