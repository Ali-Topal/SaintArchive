import { NextResponse } from "next/server";
import Stripe from "stripe";
import path from "node:path";
import { access } from "node:fs/promises";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
}

const resolvedWebhookSecret: string = webhookSecret;

type CheckoutSessionWithShipping = Stripe.Checkout.Session & {
  shipping_details?: {
    name: string | null;
    address: Stripe.Address | null;
  } | null;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] Missing stripe-signature header.");
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      resolvedWebhookSecret
    );
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

  const session = event.data.object as CheckoutSessionWithShipping;
  const raffleId = session.metadata?.raffleId ?? null;
  const ticketCountRaw = session.metadata?.ticketCount ?? null;
  const ticketCount = ticketCountRaw ? Number(ticketCountRaw) : NaN;
  const selectedOption = session.metadata?.selectedOption ?? "";
  const raffleTitle = session.metadata?.raffleTitle ?? "Your raffle";
  const instagramHandle = session.metadata?.instagramHandle ?? null;
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
    !instagramHandle
  ) {
    console.warn(
      "[stripe-webhook] Missing raffle metadata, skipping insert.",
      JSON.stringify({
        raffleId,
        ticketCount,
        email,
        selectedOption,
        instagramHandle,
      })
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const shipping = session.shipping_details;
  const shippingDetails = {
    name: shipping?.name || "",
    address: shipping?.address?.line1 || "",
    city: shipping?.address?.city || "",
    postcode: shipping?.address?.postal_code || "",
    country: shipping?.address?.country || "",
  };

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("entries").insert({
      raffle_id: raffleId,
      ticket_count: ticketCount,
      size: selectedOption || null,
      email,
      instagram_handle: instagramHandle,
      shipping_name: shippingDetails.name || null,
      shipping_address: shippingDetails.address || null,
      shipping_city: shippingDetails.city || null,
      shipping_postcode: shippingDetails.postcode || null,
      shipping_country: shippingDetails.country || null,
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

    const emailImageUrl = `https://www.saintarchive.co.uk/email-images/${raffleId}.webp`;
    const emailImagePath = path.join(
      process.cwd(),
      "public",
      "email-images",
      `${raffleId}.webp`
    );

    try {
      await access(emailImagePath);
    } catch (fsError) {
      console.warn(
        `[stripe-webhook] Email image missing for raffle ${raffleId}: ${emailImagePath}`
      );
    }

    try {
      await sendOrderConfirmationEmail({
        email,
        raffleTitle,
        raffleId,
        ticketCount,
        size: selectedOption || undefined,
        shippingDetails,
        emailImageUrl,
        productName: raffleTitle,
      });
    } catch (emailError) {
      console.error("[stripe-webhook] Email send failed:", emailError);
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
