import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

if (!baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_BASE_URL environment variable.");
}

type CheckoutBody = {
  raffleId?: string;
  ticketCount?: number;
  email?: string;
  size?: string;
  instagramHandle?: string;
};

type RaffleRow = {
  id: string;
  title: string;
  status: string;
  closes_at: string | null;
  ticket_price_cents: number;
  max_entries_per_user: number | null;
  image_url: string | null;
  image_urls: string[] | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SIZES = ["S", "M", "L", "XL"] as const;
type SizeOption = (typeof VALID_SIZES)[number];
const isValidSize = (value: string): value is SizeOption =>
  VALID_SIZES.includes(value as SizeOption);

export async function POST(request: Request) {
  let body: CheckoutBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raffleId = body.raffleId?.trim() ?? "";
  const ticketCount = Number(body.ticketCount);
  const email = body.email?.trim() ?? "";
  const size = body.size?.trim().toUpperCase() ?? "";
  const instagramHandle = body.instagramHandle?.trim() ?? "";

  if (!raffleId) {
    return NextResponse.json(
      { error: "raffleId is required" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(ticketCount) || ticketCount < 1) {
    return NextResponse.json(
      { error: "ticketCount must be an integer >= 1" },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  if (!size || !isValidSize(size)) {
    return NextResponse.json(
      { error: "Valid size is required" },
      { status: 400 }
    );
  }

  if (!instagramHandle) {
    return NextResponse.json(
      { error: "Instagram handle is required" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  const {
    data: raffle,
    error: raffleError,
  } = await supabase
    .from("raffles")
    .select(
      "id,title,status,closes_at,ticket_price_cents,max_entries_per_user,image_url,image_urls"
    )
    .eq("id", raffleId)
    .single<RaffleRow>();

  if (
    raffleError ||
    !raffle ||
    raffle.status?.toLowerCase() !== "active" ||
    !Number.isInteger(raffle.ticket_price_cents) ||
    raffle.ticket_price_cents <= 0
  ) {
    return NextResponse.json(
      { error: "Raffle not found or inactive" },
      { status: 404 }
    );
  }

  const totalAmount = ticketCount * raffle.ticket_price_cents;

  if (!Number.isInteger(totalAmount) || totalAmount <= 0) {
    return NextResponse.json(
      { error: "Invalid ticket price configuration" },
      { status: 400 }
    );
  }

  const now = new Date();
  if (raffle.closes_at) {
    const closeDate = new Date(raffle.closes_at);
    if (!Number.isNaN(closeDate.valueOf()) && closeDate <= now) {
      return NextResponse.json(
        { error: "This draw is closed." },
        { status: 400 }
      );
    }
  }

  const perUserLimit = raffle.max_entries_per_user ?? null;
  if (perUserLimit && ticketCount > perUserLimit) {
    return NextResponse.json(
      { error: `Maximum ${perUserLimit} entries allowed per user.` },
      { status: 400 }
    );
  }

  const displayImage =
    raffle.image_urls?.[0] ?? raffle.image_url ?? undefined;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      shipping_address_collection: {
        allowed_countries: ["GB"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "gbp" },
            display_name: "Free Shipping",
          },
        },
      ],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: raffle.ticket_price_cents,
            product_data: {
              name: raffle.title,
              images: displayImage ? [displayImage] : undefined,
            },
          },
          quantity: ticketCount,
        },
      ],
      metadata: {
        raffleId,
        ticketCount: String(ticketCount),
        email,
        size,
        raffleTitle: raffle.title,
        raffleImage: displayImage ?? "",
        instagramHandle,
      },
      success_url: `${baseUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/raffles/${raffleId}`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[checkout] Failed to create session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

