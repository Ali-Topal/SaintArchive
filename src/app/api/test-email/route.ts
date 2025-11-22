import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET() {
  await sendOrderConfirmationEmail({
    email: "test@example.com",
    raffleTitle: "Test Raffle",
    raffleId: "test123",
    productName: "Test Raffle",
    ticketCount: 1,
    size: "Test Option",
    shippingDetails: {
      name: "Test User",
      address: "123 Test Street",
      city: "London",
      postcode: "E1 1AA",
      country: "UK",
    },
    emailImageUrl: "https://www.saintarchive.co.uk/email-images/test123.webp",
  });

  return NextResponse.json({ status: "sent" });
}

