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
  selectedOption?: string;
  shippingDetails: ShippingDetails;
  raffleImage?: string | null;
};

const resend = new Resend(process.env.RESEND_API_KEY!);

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Entry Confirmed</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Outer container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-collapse:collapse;">

          <!-- BRAND HEADER -->
          <tr>
            <td style="padding:0 0 20px 0; text-align:center;">
              <div style="font-size:26px; font-weight:800; letter-spacing:1px; color:#000000;">
                SAINT ARCHIVE
              </div>
            </td>
          </tr>

          <!-- MAIN TITLE -->
          <tr>
            <td style="padding:0 0 10px 0; text-align:center;">
              <div style="font-size:22px; font-weight:700; color:#000000;">
                Entry Confirmed
              </div>
            </td>
          </tr>

          <!-- SUBTITLE -->
          <tr>
            <td style="padding:0 0 25px 0; text-align:center;">
              <div style="font-size:15px; color:#333333;">
                You're officially entered into the raffle.
              </div>
            </td>
          </tr>

          <!-- RAFFLE IMAGE -->
          <tr>
            <td>
              <img 
                src="{{raffleImage}}" 
                alt="Raffle Item" 
                width="100%" 
                style="border-radius:12px; display:block; margin-bottom:25px;" 
              />
            </td>
          </tr>

          <!-- INFO CARD -->
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5; border-radius:12px; padding:20px;">
                
                <tr>
                  <td style="font-size:18px; font-weight:700; color:#000; padding-bottom:10px;">
                    {{raffleTitle}}
                  </td>
                </tr>

                <tr>
                  <td style="font-size:15px; color:#000; padding-bottom:6px;">
                    <strong>Entries:</strong> {{ticketCount}}
                  </td>
                </tr>

              {{optionSection}}

                <!-- SHIPPING DETAILS -->
                <tr>
                  <td style="font-size:15px; color:#000; padding-top:12px; padding-bottom:4px; font-weight:700;">
                    Shipping Details
                  </td>
                </tr>

                <tr>
                  <td style="font-size:14px; color:#333;">
                    {{shipping_name}}<br/>
                    {{shipping_address}}<br/>
                    {{shipping_city}}, {{shipping_postcode}}<br/>
                    {{shipping_country}}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- BUTTON -->
          <tr>
            <td style="padding:30px 0 20px 0; text-align:center;">
              <a 
                href="{{raffleLink}}" 
                style="
                  background:#e50914;
                  padding:14px 26px;
                  border-radius:8px;
                  color:#ffffff;
                  text-decoration:none;
                  font-size:15px;
                  font-weight:700;
                  letter-spacing:0.5px;
                  display:inline-block;
                "
              >View Your Entry</a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="text-align:center; padding-top:20px; font-size:12px; color:#999;">
              © {{year}} Saint Archive. All rights reserved.
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
  raffleId,
  raffleTitle,
  ticketCount,
  selectedOption,
  shippingDetails,
  raffleImage,
}: SendOrderConfirmationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not configured. Skipping email send.");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://saintarchive.com";
  const raffleLink = `${baseUrl}/raffles/${raffleId}`;

  const optionSection = selectedOption
    ? `
              <tr>
                <td style="font-size:15px; color:#000; padding-bottom:6px;">
                  <strong>Option:</strong> {{selectedOption}}
                </td>
              </tr>
            `
    : "";

  const html = template
    .replace(/{{raffleImage}}/g, raffleImage || "")
    .replace(/{{raffleTitle}}/g, raffleTitle || "")
    .replace(/{{ticketCount}}/g, String(ticketCount || ""))
    .replace(/{{optionSection}}/g, optionSection)
    .replace(/{{selectedOption}}/g, selectedOption || "")
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

