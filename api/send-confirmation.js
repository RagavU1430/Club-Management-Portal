import nodemailer from "nodemailer";

/**
 * Vercel Serverless Function: /api/send-confirmation
 * Automatically sends official event confirmation passes to participant emails.
 */
export default async function handler(req, res) {
  // Set CORS headers for Vercel
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const {
    to,
    eventTitle = "AI Frontier Club Event",
    eventDate = "TBD",
    venue = "Campus AI Lab & Auditorium",
    registrationCode = "AIF-EVENT-PASS",
    teamName = "",
    member1 = "Participant",
    member2 = "",
    department = "Artificial Intelligence and Data Science",
    year = "3rd Year",
  } = req.body || {};

  const recipients = Array.isArray(to) ? to : [to].filter(Boolean);
  if (recipients.length === 0) {
    return res.status(400).json({ success: false, error: "Recipient email is required" });
  }

  const gmailUser = process.env.GMAIL_USER || "aifrontierclub@gmail.com";
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || "").replace(/\s+/g, "").trim();
  const senderName = process.env.EMAIL_SENDER_NAME || "AI Frontier Club";

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

  const textContent = `Hi ${greeting} 👋\n\n` +
`╔══════════════════════════════════════╗\n` +
`🎉 PARTICIPATION CONFIRMED 🎉\n` +
`[${eventTitle.toUpperCase()}]\n` +
`╚══════════════════════════════════════╝\n\n` +
`We’re excited to officially confirm your registration in **${eventTitle}**, organized by **${senderName}**! 🚀\n\n` +
`Your spot is reserved. Get ready to learn, compete, connect, and make the most of the experience.\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📅  DATE & TIME : ${dateFormatted}\n` +
`📍  VENUE       : ${venue}\n` +
`🎯  EVENT       : ${eventTitle}\n` +
`🏛️  ORGANIZED BY: ${senderName}\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
`    🎫 YOUR PARTICIPATION DETAILS\n\n` +
`Participant Name\n` +
`**${fullNameField}**\n\n` +
`Registration ID\n` +
`**${registrationCode}**\n\n` +
`Event Details\n` +
`**${categoryField}**\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
`✨ WHAT’S NEXT?\n\n` +
`• Be present at the venue before the reporting time.\n` +
`• Carry your college / valid ID card.\n` +
`• Keep your Registration ID (${registrationCode}) handy during check-in.\n\n` +
`See you there! 🚀\n\n` +
`**${senderName}**\n` +
`📧 ${gmailUser}\n`;

  // 1. Try Resend HTTP API (Fastest, zero port blocking)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AI Frontier Club <onboarding@resend.dev>",
          reply_to: "aifrontierclub@gmail.com",
          to: recipients,
          subject,
          text: textContent,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        return res.json({ success: true, provider: "resend", id: data.id });
      } else {
        console.warn("[Email] Resend API error response:", data);
      }
    } catch (e) {
      console.warn("[Email] Resend attempt failed:", e.message);
    }
  }

  // 2. Try Brevo HTTP API if configured
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: gmailUser },
          to: recipients.map((r) => ({ email: r })),
          subject,
          textContent: textContent,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        return res.json({ success: true, provider: "brevo", id: data.messageId });
      }
    } catch (e) {
      console.warn("[Email] Brevo attempt failed:", e.message);
    }
  }

  // 3. Try Gmail SMTP with App Password
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
        tls: { rejectUnauthorized: false },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${gmailUser}>`,
        to: recipients.join(", "),
        subject,
        text: textContent,
      });

      return res.json({
        success: true,
        provider: "gmail",
        messageId: info.messageId,
      });
    } catch (err) {
      console.error("[Email] Gmail SMTP dispatch error:", err.message);
      return res.status(500).json({
        success: false,
        error: `Gmail delivery failed: ${err.message}. Make sure 2-Step Verification is ON and you generated a 16-character App Password for ${gmailUser}.`,
      });
    }
  }

  // Notice: Pending Google App Password
  return res.json({
    success: false,
    note: `Email prepared for ${recipients.join(", ")}, but GMAIL_APP_PASSWORD is not set in Vercel Environment Variables yet.`,
    preview: textContent,
  });
}
