import nodemailer from "nodemailer";

/**
 * Vercel Serverless Function: /api/send-confirmation
 * Automatically sends official event confirmation passes to participant emails.
 * Powered by Gmail SMTP (aifrontierclub@gmail.com).
 */
export default async function handler(req, res) {
  // Set CORS headers for Vercel
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const {
    eventTitle = "AI Frontier Club Event",
    eventDate = "TBD",
    venue = "Campus AI Lab & Auditorium",
    registrationCode = "AIF-EVENT-PASS",
    teamName = "",
    member1 = "Participant",
    member2 = "",
    department = "Artificial Intelligence and Data Science",
    year = "3rd Year",
  } = body;

  const rawRecipients = body.to || body.email || body.recipient || [];
  const recipients = (Array.isArray(rawRecipients) ? rawRecipients : [rawRecipients])
    .concat(body.member2Email || body.member2_phone || [])
    .filter((e) => typeof e === "string" && e.includes("@") && e.trim().length > 3)
    .map((e) => e.trim());
  const uniqueRecipients = Array.from(new Set(recipients));

  if (uniqueRecipients.length === 0) {
    return res.status(400).json({ success: false, error: "Recipient email is required" });
  }

  const senderName = process.env.EMAIL_SENDER_NAME || "AI Frontier Club";
  const clubEmail = "aifrontierclub@gmail.com";

  const greeting = member2 ? `${member1} & ${member2}` : member1;
  const fullNameField = member2 ? `${member1} (Lead) & ${member2}` : member1;
  const categoryField = `${teamName ? `Team: ${teamName} • ` : ""}${department} (${year})`;

  let dateFormatted = eventDate;
  try {
    const d = new Date(eventDate);
    if (!isNaN(d.getTime())) {
      dateFormatted = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {}

  const subject = `🎉 Participation Confirmed: ${eventTitle} (${registrationCode})`;

  // High-End Responsive HTML Pass
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #0b0f19; border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
      
      <!-- Top Banner -->
      <tr>
        <td style="padding: 35px 30px 25px; text-align: center; background: radial-gradient(circle at top, rgba(0, 240, 255, 0.12) 0%, transparent 70%); border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <span style="display: inline-block; padding: 4px 14px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 9999px; color: #00f0ff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
            OFFICIAL EVENT PASS
          </span>
          <h1 style="margin: 16px 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
            ${eventTitle}
          </h1>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">
            Organized by <strong style="color: #38bdf8;">${senderName}</strong>
          </p>
        </td>
      </tr>

      <!-- Greeting & Confirmation -->
      <tr>
        <td style="padding: 25px 30px 10px;">
          <p style="margin: 0 0 12px; font-size: 16px; color: #e2e8f0;">
            Hi <strong style="color: #ffffff;">${greeting}</strong> 👋
          </p>
          <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
            We're thrilled to confirm your registration! Your seats are reserved. Keep this official pass handy during on-campus check-in.
          </p>
        </td>
      </tr>

      <!-- Ticket Card Box -->
      <tr>
        <td style="padding: 0 30px 25px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 14px; padding: 20px;">
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-family: monospace;">REGISTRATION ID</td>
              <td style="padding: 6px 0; font-size: 14px; color: #00f0ff; font-weight: bold; font-family: monospace; text-align: right;">${registrationCode}</td>
            </tr>
            ${teamName ? `
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-family: monospace;">TEAM NAME</td>
              <td style="padding: 6px 0; font-size: 13px; color: #ffffff; font-weight: 600; text-align: right;">${teamName}</td>
            </tr>` : ""}
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-family: monospace;">PARTICIPANTS</td>
              <td style="padding: 6px 0; font-size: 13px; color: #ffffff; font-weight: 500; text-align: right;">${fullNameField}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-family: monospace;">DEPARTMENT</td>
              <td style="padding: 6px 0; font-size: 13px; color: #cbd5e1; text-align: right;">${department} (${year})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-family: monospace;">DATE & TIME</td>
              <td style="padding: 6px 0; font-size: 13px; color: #facc15; font-weight: 500; text-align: right;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-family: monospace;">VENUE</td>
              <td style="padding: 6px 0; font-size: 13px; color: #38bdf8; font-weight: 500; text-align: right;">${venue}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0 0; font-size: 12px; color: #64748b; font-family: monospace;">STATUS</td>
              <td style="padding: 8px 0 0; font-size: 13px; color: #34d399; font-weight: bold; text-align: right;">Seat Confirmed ✓</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Guidelines -->
      <tr>
        <td style="padding: 0 30px 25px;">
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px;">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
              📌 Important Check-in Instructions
            </p>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #94a3b8;">
              <li>Please arrive 15 minutes before scheduled start time.</li>
              <li>Present this Registration ID (<strong style="color: #00f0ff;">${registrationCode}</strong>) at the registration desk.</li>
              <li>Bring your college ID card or valid student credential.</li>
            </ul>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 20px 30px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0 0 4px; font-weight: 600; color: #94a3b8;">${senderName}</p>
          <p style="margin: 0; font-size: 11px;">
            Questions? Contact <a href="mailto:${clubEmail}" style="color: #38bdf8; text-decoration: none;">${clubEmail}</a> • 📱 <a href="tel:+919360376757" style="color: #38bdf8; text-decoration: none;">+91 9360376757</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Fallback plain text
  const textContent = `Hi ${greeting} 👋\n\n` +
`========================================\n` +
`🎉 OFFICIAL PARTICIPATION PASS: ${eventTitle.toUpperCase()}\n` +
`========================================\n\n` +
`We're excited to officially confirm your registration in ${eventTitle}, organized by ${senderName}! 🚀\n\n` +
`🎫 REGISTRATION DETAILS:\n` +
`• Registration ID : ${registrationCode}\n` +
`${teamName ? `• Team Name       : ${teamName}\n` : ""}` +
`• Participants    : ${fullNameField}\n` +
`• Department      : ${categoryField}\n` +
`• Date & Time     : ${dateFormatted}\n` +
`• Venue           : ${venue}\n` +
`• Status          : Seat Confirmed ✓\n\n` +
`📌 CHECK-IN INSTRUCTIONS:\n` +
`1. Report to venue 15 minutes before the event.\n` +
`2. Bring your college ID card.\n` +
`3. Keep your Registration ID (${registrationCode}) handy for desk verification.\n\n` +
`See you there!\n${senderName}\nEmail: aifrontierclub@gmail.com\nPhone: +91 9360376757\n`;

  const customUser = body.gmailUser;
  const customPass = body.gmailAppPassword;

  let gmailUser = (customUser || process.env.GMAIL_USER || "ragavkrr14@gmail.com").trim();
  let gmailPass = (
    customPass ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASSWORD ||
    "qzkuhlklzhijrlob"
  )
    .replace(/\s+/g, "")
    .trim();

  // If using the known verified App Password, always authenticate as ragavkrr14@gmail.com
  if (gmailPass.toLowerCase() === "qzkuhlklzhijrlob") {
    gmailUser = "ragavkrr14@gmail.com";
  }

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({
      success: false,
      error: "GMAIL_USER or GMAIL_APP_PASSWORD is not configured.",
      preview: textContent,
    });
  }

  const mailOptions = {
    from: `"${senderName}" <${gmailUser}>`,
    replyTo: "aifrontierclub@gmail.com",
    to: uniqueRecipients.join(", "),
    subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
      socketTimeout: 20000,
    });

    const info = await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      provider: "gmail-smtp",
      id: info.messageId,
      sender: gmailUser,
      recipients: uniqueRecipients,
    });
  } catch (err) {
    console.warn("[Email] Primary Gmail SMTP delivery error:", err.message);

    // Fallback: If primary credentials failed (e.g. BadCredentials 535), retry with verified system credentials
    if (gmailUser !== "ragavkrr14@gmail.com" || gmailPass !== "qzkuhlklzhijrlob") {
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "ragavkrr14@gmail.com",
            pass: "qzkuhlklzhijrlob",
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 15000,
          socketTimeout: 20000,
        });

        const fallbackInfo = await fallbackTransporter.sendMail({
          ...mailOptions,
          from: `"${senderName}" <ragavkrr14@gmail.com>`,
        });

        return res.json({
          success: true,
          provider: "gmail-smtp-fallback",
          id: fallbackInfo.messageId,
          sender: "ragavkrr14@gmail.com",
          recipients: uniqueRecipients,
        });
      } catch (fbErr) {
        console.error("[Email] Fallback delivery error:", fbErr.message);
      }
    }

    return res.status(500).json({
      success: false,
      provider: "gmail-smtp",
      error: `Failed to deliver email: ${err.message}`,
      recipients: uniqueRecipients,
    });
  }
}

