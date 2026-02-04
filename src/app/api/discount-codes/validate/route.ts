import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type DiscountCode = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_cents: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
};

export async function POST(request: Request) {
  let body: { code?: string; subtotalCents?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  const subtotalCents = Number(body.subtotalCents) || 0;

  if (!code) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: discountCode, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .single<DiscountCode>();

  if (error || !discountCode) {
    return NextResponse.json({ error: "Invalid discount code." }, { status: 404 });
  }

  // Check if code is active
  if (!discountCode.is_active) {
    return NextResponse.json({ error: "This code is no longer active." }, { status: 400 });
  }

  // Check if code has expired
  if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
    return NextResponse.json({ error: "This code has expired." }, { status: 400 });
  }

  // Check if code has reached max uses
  if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
    return NextResponse.json({ error: "This code has reached its usage limit." }, { status: 400 });
  }

  // Check minimum order value
  if (subtotalCents < discountCode.min_order_cents) {
    const minOrderFormatted = (discountCode.min_order_cents / 100).toFixed(2);
    return NextResponse.json(
      { error: `Minimum order of £${minOrderFormatted} required for this code.` },
      { status: 400 }
    );
  }

  // Calculate discount amount
  let discountAmountCents: number;
  if (discountCode.discount_type === "percentage") {
    discountAmountCents = Math.round((subtotalCents * discountCode.discount_value) / 100);
  } else {
    discountAmountCents = Math.min(discountCode.discount_value, subtotalCents);
  }

  return NextResponse.json({
    valid: true,
    code: discountCode.code,
    discountType: discountCode.discount_type,
    discountValue: discountCode.discount_value,
    discountAmountCents,
    message:
      discountCode.discount_type === "percentage"
        ? `${discountCode.discount_value}% off applied!`
        : `£${(discountCode.discount_value / 100).toFixed(2)} off applied!`,
  });
}
