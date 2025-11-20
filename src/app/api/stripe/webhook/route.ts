import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
}

const ALLOWED_SIZES = ["S", "M", "L", "XL"] as const;
type SizeOption = (typeof ALLOWED_SIZES)[number];
const isValidSize = (value: string | null | undefined): value is SizeOption =>
  !!value && ALLOWED_SIZES.includes(value as SizeOption);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] Missing stripe-signature header.");
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify signature.";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    console.log(`[stripe-webhook] Ignored event ${event.type}`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const raffleId = session.metadata?.raffleId ?? null;
  const ticketCountRaw = session.metadata?.ticketCount ?? null;
  const ticketCount = ticketCountRaw ? Number(ticketCountRaw) : NaN;
  const size = session.metadata?.size?.toUpperCase() ?? null;
  const email =
    session.metadata?.email ??
    session.customer_details?.email ??
    session.customer_email ??
    null;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  if (
    !raffleId ||
    !Number.isFinite(ticketCount) ||
    ticketCount < 1 ||
    !email ||
    !isValidSize(size)
  ) {
    console.warn(
      "[stripe-webhook] Missing raffle metadata, skipping insert.",
      JSON.stringify({
        raffleId,
        ticketCount,
        email,
        size,
      })
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("entries").insert({
      raffle_id: raffleId,
      ticket_count: ticketCount,
      size,
      email,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
    });

    if (error) {
      console.error("[stripe-webhook] Failed to insert entry:", error.message);
      return NextResponse.json(
        { error: "Failed to record entry." },
        { status: 500 }
      );
    }

    console.log(
      `[stripe-webhook] Recorded ${ticketCount} entries for raffle ${raffleId}`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (dbError) {
    const message =
      dbError instanceof Error ? dbError.message : "Unknown database error.";
    console.error("[stripe-webhook] Database exception:", message);
    return NextResponse.json(
      { error: "Database error while recording entry." },
      { status: 500 }
    );
  }
}
