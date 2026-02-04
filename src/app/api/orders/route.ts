import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Free shipping on all orders
const SHIPPING_COST = 0;

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
  discountCode?: string;
};

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
  const discountCode = body.discountCode?.trim().toUpperCase() ?? "";

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

  // Calculate totals (free shipping on all orders)
  const subtotalCents = product.price_cents * quantity;
  
  // Validate and apply discount code if provided
  let discountAmountCents = 0;
  let validatedDiscountCode: DiscountCode | null = null;
  
  if (discountCode) {
    const { data: codeData, error: codeError } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode)
      .single<DiscountCode>();

    if (codeError || !codeData) {
      return NextResponse.json({ error: "Invalid discount code." }, { status: 400 });
    }

    if (!codeData.is_active) {
      return NextResponse.json({ error: "This discount code is no longer active." }, { status: 400 });
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json({ error: "This discount code has expired." }, { status: 400 });
    }

    if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json({ error: "This discount code has reached its usage limit." }, { status: 400 });
    }

    if (subtotalCents < codeData.min_order_cents) {
      const minOrderFormatted = (codeData.min_order_cents / 100).toFixed(2);
      return NextResponse.json(
        { error: `Minimum order of £${minOrderFormatted} required for this code.` },
        { status: 400 }
      );
    }

    // Calculate discount
    if (codeData.discount_type === "percentage") {
      discountAmountCents = Math.round((subtotalCents * codeData.discount_value) / 100);
    } else {
      discountAmountCents = Math.min(codeData.discount_value, subtotalCents);
    }
    
    validatedDiscountCode = codeData;
  }

  const totalAmountCents = subtotalCents - discountAmountCents + SHIPPING_COST;

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
      discount_code: validatedDiscountCode?.code || null,
      discount_amount_cents: discountAmountCents,
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

  // Increment discount code usage
  if (validatedDiscountCode) {
    const { error: discountError } = await supabase
      .from("discount_codes")
      .update({ current_uses: validatedDiscountCode.current_uses + 1 })
      .eq("id", validatedDiscountCode.id);

    if (discountError) {
      console.error("[orders] Failed to update discount code usage:", discountError.message);
    }
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
