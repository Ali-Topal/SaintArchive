import { Resend } from "resend";

type ShippingDetails = {
  name: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
};

type SendOrderConfirmationEmailParams = {
  email: string;
  raffleId: string;
  raffleTitle: string;
  ticketCount: number;
  size: string;
  shippingDetails: ShippingDetails;
  raffleImage?: string | null;
};

const resend = new Resend(process.env.RESEND_API_KEY!);

const template = `
<!DOCTYPE html> <html lang="en" style="margin:0;padding:0;background:#0d0d0d;"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>You're Entered</title> </head> <body style="margin:0;padding:0;background:#0d0d0d;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0d0d0d" style="padding: 40px 0;">
  <tr>
    <td align="center">

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px;background:#111111;border-radius:12px;padding:0 20px 30px;">

        <tr>
          <td align="center" style="padding: 40px 0 10px;">
            <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">
              You're Entered 🎉
            </h1>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-bottom: 28px;">
            <p style="margin:0;font-size:15px;color:#cccccc;line-height:22px;">
              Thank you for entering the raffle.<br />
              Your entry has been successfully confirmed.
            </p>
          </td>
        </tr>

        <tr>
          <td>
            <img src="{{raffleImage}}" alt="Raffle Item" width="100%" style="border-radius:10px;margin-bottom:20px;" />
          </td>
        </tr>

        <tr>
          <td>
            <table width="100%" cellspacing="0" cellpadding="0" style="background:#1a1a1a;padding:20px;border-radius:10px;">
              
              <tr>
                <td style="color:#999999;font-size:13px;padding-bottom:4px;">Item</td>
              </tr>
              <tr>
                <td style="color:#ffffff;font-size:16px;padding-bottom:16px;font-weight:600;">
                  {{raffleTitle}}
                </td>
              </tr>

              <tr>
                <td style="color:#999999;font-size:13px;padding-bottom:4px;">Entries Purchased</td>
              </tr>
              <tr>
                <td style="color:#ffffff;font-size:16px;padding-bottom:16px;font-weight:600;">
                  {{ticketCount}}
                </td>
              </tr>

              <tr>
                <td style="color:#999999;font-size:13px;padding-bottom:4px;">Selected Size</td>
              </tr>
              <tr>
                <td style="color:#ffffff;font-size:16px;padding-bottom:16px;font-weight:600;">
                  {{size}}
                </td>
              </tr>

              <tr>
                <td style="color:#999999;font-size:13px;padding-bottom:4px;">Shipping To</td>
              </tr>
              <tr>
                <td style="color:#ffffff;font-size:15px;padding-bottom:12px;line-height:22px;font-weight:500;">
                  {{shipping_name}}<br />
                  {{shipping_address}}<br />
                  {{shipping_city}}, {{shipping_postcode}}<br />
                  {{shipping_country}}
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding: 32px 0;">
            <a href="{{raffleLink}}" target="_blank"
              style="
                display:inline-block;
                padding:14px 26px;
                background:#e63946;
                color:#ffffff;
                border-radius:8px;
                text-decoration:none;
                font-size:15px;
                font-weight:600;
                letter-spacing:0.5px;
              ">
              View Raffle Status
            </a>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:10px;">
            <p style="margin:0;font-size:12px;color:#666666;line-height:18px;">
              Saint Archive © {{year}}<br />
              You are receiving this email because you entered a raffle.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body> </html> `;

export async function sendOrderConfirmationEmail({
  email,
  raffleId,
  raffleTitle,
  ticketCount,
  size,
  shippingDetails,
  raffleImage,
}: SendOrderConfirmationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not configured. Skipping email send.");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://saintarchive.com";
  const raffleLink = `${baseUrl}/raffles/${raffleId}`;

  const html = template
    .replace(/{{raffleTitle}}/g, raffleTitle)
    .replace(/{{ticketCount}}/g, String(ticketCount))
    .replace(/{{size}}/g, size)
    .replace(/{{raffleImage}}/g, raffleImage || "")
    .replace(/{{shipping_name}}/g, shippingDetails.name || "")
    .replace(/{{shipping_address}}/g, shippingDetails.address || "")
    .replace(/{{shipping_city}}/g, shippingDetails.city || "")
    .replace(/{{shipping_postcode}}/g, shippingDetails.postcode || "")
    .replace(/{{shipping_country}}/g, shippingDetails.country || "")
    .replace(/{{raffleLink}}/g, raffleLink)
    .replace(/{{year}}/g, new Date().getFullYear().toString());

  try {
    await resend.emails.send({
      from: "Saint Archive <purchases@saintarchive.co.uk>",
      to: email,
      subject: `Your Entry Is Confirmed – ${raffleTitle}`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send confirmation email:", error);
  }
}

