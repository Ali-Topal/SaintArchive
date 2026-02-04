import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Missing email parameter. Use ?email=your@email.com" },
      { status: 400 }
    );
  }

  await sendOrderConfirmationEmail({
    email,
    orderNumber: "ORD-TEST01",
    productTitle: "Supreme/True Religion Puffer Jacket",
    quantity: 1,
    size: "L",
    totalAmountCents: 15000,
    shippingMethod: "next_day",
    shippingDetails: {
      name: "Test User",
      address: "123 Test Street",
      city: "London",
      postcode: "SW1A 1AA",
      country: "United Kingdom",
    },
  });

  return NextResponse.json({ status: "sent", email });
}
