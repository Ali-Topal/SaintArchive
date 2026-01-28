import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Shipping prices in pence
const SHIPPING_PRICES = {
  standard: 0, // Free
  next_day: 599, // £5.99
} as const;

const FREE_SHIPPING_THRESHOLD = 5000; // £50 in pence

type OrderBody = {
  productId?: string;
  quantity?: number;
  size?: string;
  email?: string;
  phone?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostcode?: string;
  shippingMethod?: "standard" | "next_day";
};

type ProductRow = {
  id: string;
  title: string;
  price_cents: number;
  stock_quantity: number;
  is_active: boolean;
  options: string[] | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/**
 * Generate a unique order number in format ORD-XXXXXX
 * Uses characters that are easy to read (no I, O, 0, 1)
 */
function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${code}`;
}

/**
 * Calculate shipping cost based on method and subtotal
 */
function calculateShipping(
  method: "standard" | "next_day",
  subtotalCents: number
): number {
  // Free shipping for orders over threshold (only applies to standard)
  if (method === "standard" && subtotalCents >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return SHIPPING_PRICES[method];
}

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("[orders] Missing NEXT_PUBLIC_BASE_URL environment variable");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  let body: OrderBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Extract and validate fields
  const productId = body.productId?.trim() ?? "";
  const quantity = Number(body.quantity);
  const size = body.size?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const phone = body.phone?.trim() ?? "";
  const shippingName = body.shippingName?.trim() ?? "";
  const shippingAddress = body.shippingAddress?.trim() ?? "";
  const shippingCity = body.shippingCity?.trim() ?? "";
  const shippingPostcode = body.shippingPostcode?.trim().toUpperCase() ?? "";
  const shippingMethod = body.shippingMethod ?? "standard";

  // Validation
  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Quantity must be at least 1." },
      { status: 400 }
    );
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required." },
      { status: 400 }
    );
  }

  if (!shippingName) {
    return NextResponse.json(
      { error: "Full name is required." },
      { status: 400 }
    );
  }

  if (!shippingAddress) {
    return NextResponse.json(
      { error: "Address is required." },
      { status: 400 }
    );
  }

  if (!shippingCity) {
    return NextResponse.json(
      { error: "City is required." },
      { status: 400 }
    );
  }

  if (!shippingPostcode || !UK_POSTCODE_REGEX.test(shippingPostcode)) {
    return NextResponse.json(
      { error: "Valid UK postcode is required." },
      { status: 400 }
    );
  }

  if (!["standard", "next_day"].includes(shippingMethod)) {
    return NextResponse.json(
      { error: "Invalid shipping method." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,title,price_cents,stock_quantity,is_active,options")
    .eq("id", productId)
    .single<ProductRow>();

  if (productError || !product) {
    return NextResponse.json(
      { error: "Product not found." },
      { status: 404 }
    );
  }

  if (!product.is_active) {
    return NextResponse.json(
      { error: "This product is no longer available." },
      { status: 400 }
    );
  }

  if (product.stock_quantity < quantity) {
    return NextResponse.json(
      {
        error:
          product.stock_quantity === 0
            ? "This product is out of stock."
            : `Only ${product.stock_quantity} items available.`,
      },
      { status: 400 }
    );
  }

  // Validate size if product has options
  const optionList =
    product.options?.filter((v): v is string => !!v?.trim()) ?? [];
  if (optionList.length > 0 && !optionList.includes(size)) {
    return NextResponse.json(
      { error: "Please select a valid size." },
      { status: 400 }
    );
  }

  // Calculate totals
  const subtotalCents = product.price_cents * quantity;
  const shippingCents = calculateShipping(shippingMethod, subtotalCents);
  const totalAmountCents = subtotalCents + shippingCents;

  // Generate unique order number (with retry for collisions)
  let orderNumber = generateOrderNumber();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!existing) break;
    orderNumber = generateOrderNumber();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.error("[orders] Failed to generate unique order number");
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      product_id: productId,
      quantity,
      size: optionList.length > 0 ? size : null,
      email,
      phone: phone || null,
      shipping_name: shippingName,
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_postcode: shippingPostcode,
      shipping_country: "GB",
      shipping_method: shippingMethod,
      total_amount_cents: totalAmountCents,
      status: "pending_payment",
    })
    .select("id,order_number")
    .single();

  if (orderError || !order) {
    console.error("[orders] Failed to create order:", orderError?.message);
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 }
    );
  }

  // Decrement stock
  const { error: stockError } = await supabase
    .from("products")
    .update({ stock_quantity: product.stock_quantity - quantity })
    .eq("id", productId);

  if (stockError) {
    console.error("[orders] Failed to update stock:", stockError.message);
    // Don't fail the order, but log for manual adjustment
  }

  // Send confirmation email (don't block on this)
  sendOrderConfirmationEmail({
    email,
    orderNumber: order.order_number,
    productTitle: product.title,
    quantity,
    size: optionList.length > 0 ? size : undefined,
    totalAmountCents,
    shippingMethod,
    shippingDetails: {
      name: shippingName,
      address: shippingAddress,
      city: shippingCity,
      postcode: shippingPostcode,
      country: "United Kingdom",
    },
  }).catch((err) => {
    console.error("[orders] Failed to send confirmation email:", err);
  });

  // Return success with redirect URL
  return NextResponse.json(
    {
      success: true,
      orderNumber: order.order_number,
      redirectUrl: `${baseUrl}/thank-you?order=${order.order_number}`,
    },
    { status: 201 }
  );
}
