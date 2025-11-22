import { config } from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { Resend } from "resend";

const envPath = path.join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config();
}

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is missing. Add it to your environment.");
}

const resend = new Resend(resendApiKey);

async function main() {
  await resend.emails.send({
    from: "Saint Archive <purchases@saintarchive.co.uk>",
    to: ["memocantopal39@gmail.com"],
    subject: "Your Saint Archive Order Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h1 style="text-align: center;">Order Confirmation</h1>
        <div style="text-align: center;">
          <img
            src="https://www.saintarchive.co.uk/email-images/6f3a96e4-af82-4cb8-8b31-5d78939b1fc5.webp"
            alt="Supreme x True Religion Applique Polo"
            width="600"
            style="border-radius: 12px; margin-top: 20px;"
          />
        </div>
        <h2 style="text-align: center;">Product Details</h2>
        <p><strong>Product:</strong> Supreme x True Religion Applique Polo</p>
        <p><strong>Size:</strong> M</p>
        <h2 style="text-align: center;">Shipping Details</h2>
        <p><strong>Name:</strong> Test User</p>
        <p><strong>Address:</strong> 123 Test Street</p>
        <p><strong>City:</strong> London</p>
        <p><strong>Postcode:</strong> E1 1AA</p>
        <p style="margin-top: 40px;">
          Thank you for your purchase! Your order is confirmed and you have been entered into the raffle.
        </p>
      </div>
    `,
  });

  console.log("Test email sent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

