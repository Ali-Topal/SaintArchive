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
  orderNumber: string;
  productTitle: string;
  productImageUrl?: string;
  quantity: number;
  size?: string;
  totalAmountCents: number;
  shippingMethod: string;
  shippingDetails: ShippingDetails;
};

// Lazy initialization to avoid throwing at module load when key is missing
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const PAYPAL_USERNAME = "CenchSaint";

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:30px 0;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-collapse:collapse; border-radius:12px; overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background:#0a0a0a; padding:30px; text-align:center;">
              <div style="font-size:24px; font-weight:700; letter-spacing:4px; color:#ffffff;">
                SAINT ARCHIVE
              </div>
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:30px;">
              
              <!-- Order Status -->
              <div style="background:#fef3c7; border-radius:8px; padding:16px; margin-bottom:24px; text-align:center;">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:2px; color:#92400e; margin-bottom:4px;">
                  Order Placed
                </div>
                <div style="font-size:18px; font-weight:700; color:#78350f;">
                  Payment Required
                </div>
              </div>

              <!-- Greeting -->
              <p style="font-size:16px; color:#333; margin:0 0 20px 0;">
                Thank you for your order! Your order has been placed successfully.
              </p>

              <!-- Order Number -->
              <div style="background:#f5f5f5; border-radius:8px; padding:20px; margin-bottom:24px; text-align:center;">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:2px; color:#666; margin-bottom:8px;">
                  Order Number
                </div>
                <div style="font-size:28px; font-weight:700; color:#000; font-family:monospace;">
                  {{orderNumber}}
                </div>
              </div>

              <!-- Product Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  {{productImageHtml}}
                  <td style="vertical-align:top; padding-left:{{imagePadding}};">
                    <div style="font-size:18px; font-weight:700; color:#000; margin-bottom:4px;">
                      {{productTitle}}
                    </div>
                    {{sizeHtml}}
                    <div style="font-size:14px; color:#666; margin-bottom:8px;">
                      Quantity: {{quantity}}
                    </div>
                    <div style="font-size:20px; font-weight:700; color:#000;">
                      {{totalAmount}}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Shipping Details -->
              <div style="border:1px solid #e5e5e5; border-radius:8px; padding:20px; margin-bottom:24px;">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:2px; color:#666; margin-bottom:12px;">
                  Shipping To
                </div>
                <div style="font-size:14px; color:#333; line-height:1.6;">
                  <strong>{{shippingName}}</strong><br/>
                  {{shippingAddress}}<br/>
                  {{shippingCity}}, {{shippingPostcode}}<br/>
                  {{shippingCountry}}
                </div>
                <div style="font-size:12px; color:#666; margin-top:12px;">
                  {{shippingMethodLabel}}
                </div>
              </div>

              <!-- Payment Instructions -->
              <div style="background:#0a0a0a; border-radius:8px; padding:24px; color:#fff;">
                <div style="font-size:12px; text-transform:uppercase; letter-spacing:2px; color:#fbbf24; margin-bottom:12px;">
                  ⚡ Complete Your Payment
                </div>
                <p style="font-size:14px; color:#ccc; margin:0 0 16px 0; line-height:1.6;">
                  To complete your order, please send payment via PayPal:
                </p>
                <ol style="font-size:14px; color:#fff; margin:0 0 20px 0; padding-left:20px; line-height:1.8;">
                  <li>Go to <a href="https://paypal.me/{{paypalUsername}}" style="color:#fbbf24;">PayPal.me/{{paypalUsername}}</a></li>
                  <li>Send <strong>{{totalAmount}}</strong></li>
                  <li>Use order number <strong style="font-family:monospace;">{{orderNumber}}</strong> as reference</li>
                </ol>
                <div style="text-align:center;">
                  <a href="https://paypal.me/{{paypalUsername}}/{{totalAmountDecimal}}GBP" 
                     style="display:inline-block; background:#0070ba; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px;">
                    Pay with PayPal
                  </a>
                </div>
                <p style="font-size:12px; color:#888; margin:16px 0 0 0; text-align:center;">
                  Your order will be processed once payment is confirmed.
                </p>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f5f5f5; padding:24px; text-align:center;">
              <p style="font-size:12px; color:#666; margin:0 0 8px 0;">
                Questions? Contact us on Instagram @saintarchive88
              </p>
              <p style="font-size:12px; color:#999; margin:0;">
                © {{year}} Saint Archive. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

export async function sendOrderConfirmationEmail({
  email,
  orderNumber,
  productTitle,
  productImageUrl,
  quantity,
  size,
  totalAmountCents,
  shippingMethod,
  shippingDetails,
}: SendOrderConfirmationEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY is not configured. Skipping email send.");
    return;
  }

  const totalAmountFormatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(totalAmountCents / 100);

  const totalAmountDecimal = (totalAmountCents / 100).toFixed(2);

  const shippingMethodLabel =
    shippingMethod === "next_day"
      ? "Next Day Delivery"
      : "Standard Delivery (3-5 days)";

  const productImageHtml = productImageUrl
    ? `<td style="width:100px; vertical-align:top;">
        <img src="${productImageUrl}" alt="${productTitle}" width="100" height="100" 
             style="border-radius:8px; display:block; object-fit:cover;" />
       </td>`
    : "";

  const imagePadding = productImageUrl ? "16px" : "0";

  const sizeHtml = size
    ? `<div style="font-size:14px; color:#666; margin-bottom:4px;">Size: ${size}</div>`
    : "";

  const html = template
    .replace(/{{orderNumber}}/g, orderNumber)
    .replace(/{{productTitle}}/g, productTitle)
    .replace(/{{productImageHtml}}/g, productImageHtml)
    .replace(/{{imagePadding}}/g, imagePadding)
    .replace(/{{sizeHtml}}/g, sizeHtml)
    .replace(/{{quantity}}/g, String(quantity))
    .replace(/{{totalAmount}}/g, totalAmountFormatted)
    .replace(/{{totalAmountDecimal}}/g, totalAmountDecimal)
    .replace(/{{shippingName}}/g, shippingDetails.name || "")
    .replace(/{{shippingAddress}}/g, shippingDetails.address || "")
    .replace(/{{shippingCity}}/g, shippingDetails.city || "")
    .replace(/{{shippingPostcode}}/g, shippingDetails.postcode || "")
    .replace(/{{shippingCountry}}/g, shippingDetails.country || "United Kingdom")
    .replace(/{{shippingMethodLabel}}/g, shippingMethodLabel)
    .replace(/{{paypalUsername}}/g, PAYPAL_USERNAME)
    .replace(/{{year}}/g, new Date().getFullYear().toString());

  try {
    await client.emails.send({
      from: "Saint Archive <orders@saintarchive.co.uk>",
      to: email,
      subject: `Order Confirmed - ${orderNumber}`,
      html,
    });
    console.log(`[email] Order confirmation sent to ${email} for ${orderNumber}`);
  } catch (error) {
    console.error("[email] Failed to send order confirmation:", error);
  }
}
