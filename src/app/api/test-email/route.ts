import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function GET() {
  await sendOrderConfirmationEmail({
    email: "test@example.com",
    raffleTitle: "Test Raffle",
    raffleId: "test123",
    ticketCount: 1,
    size: "M",
    shippingDetails: {
      name: "Test User",
      address: "123 Test Street",
      city: "London",
      postcode: "E1 1AA",
      country: "UK",
    },
    raffleImage: "https://via.placeholder.com/600x400",
  });

  return NextResponse.json({ status: "sent" });
}

