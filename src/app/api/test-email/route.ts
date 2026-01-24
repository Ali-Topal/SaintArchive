import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET() {
  await sendOrderConfirmationEmail({
    email: "test@example.com",
    orderNumber: "ORD-TEST01",
    productTitle: "Test Product",
    quantity: 1,
    size: "M",
    totalAmountCents: 4999,
    shippingMethod: "standard",
    shippingDetails: {
      name: "Test User",
      address: "123 Test Street",
      city: "London",
      postcode: "E1 1AA",
      country: "United Kingdom",
    },
  });

  return NextResponse.json({ status: "sent" });
}
