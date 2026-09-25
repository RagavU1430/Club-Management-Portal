import nodemailer from "nodemailer";
import { db } from "../config/db.js";

/**
 * Automated Gmail / Email Confirmation Service.
 * Dispatches official event confirmation passes to participant team emails.
 */

export function getEmailConfig() {
  const userRow = db.prepare("SELECT value FROM settings WHERE key = 'gmail_user'").get();
  const passRow = db.prepare("SELECT value FROM settings WHERE key = 'gmail_app_password'").get();
  const senderNameRow = db.prepare("SELECT value FROM settings WHERE key = 'email_sender_name'").get();

  const user = userRow?.value || process.env.GMAIL_USER || "";
  const pass = passRow?.value || process.env.GMAIL_APP_PASSWORD || "";
  const senderName = senderNameRow?.value || process.env.EMAIL_SENDER_NAME || "AI Frontier Club";

  const isConfigured = Boolean(user && pass);

  return {
    gmailUser: user,
    hasAppPassword: Boolean(pass),
    senderName,
    isConfigured,
  };
}

export function saveEmailConfig({ gmailUser, gmailAppPassword, senderName }) {
  const upsert = (k, v) => {
    if (v !== undefined && v !== null) {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%S','now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(k, String(v).trim());
    }
  };

  if (gmailUser !== undefined) upsert("gmail_user", gmailUser);
  if (gmailAppPassword !== undefined && gmailAppPassword !== "") {
    upsert("gmail_app_password", gmailAppPassword.replace(/\s+/g, ""));
  }
  if (senderName !== undefined) upsert("email_sender_name", senderName);

  return getEmailConfig();
}

function getRawEmailCredentials() {
  const userRow = db.prepare("SELECT value FROM settings WHERE key = 'gmail_user'").get();
  const passRow = db.prepare("SELECT value FROM settings WHERE key = 'gmail_app_password'").get();
  const senderNameRow = db.prepare("SELECT value FROM settings WHERE key = 'email_sender_name'").get();

  return {
    user: (userRow?.value || process.env.GMAIL_USER || "").trim(),
    pass: (passRow?.value || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim(),
    senderName: (senderNameRow?.value || process.env.EMAIL_SENDER_NAME || "AI Frontier Club").trim(),
  };
}

export function generateEmailContent({ event, registration }) {
  const eventTitle = event.title || "AI Frontier Club Event";

  let dateOnly = "TBD";
  let timeOnly = "TBD";
  try {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      // Event times are Asia/Kolkata wall-clock; servers run on UTC.
      dateOnly = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
      timeOnly = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });
    }
  } catch {}

  const teamName = registration.teamName || registration.team_name || "";
  const member1 = registration.member1 || registration.name || "Participant";
  const member2 = registration.member2 || "";
  const venue = event.venue || "Campus AI Lab & Auditorium";
  const regCode = registration.registrationCode || `AIF-${event.id}-${registration.id || ""}`;
  const department = registration.department || registration.college || "Artificial Intelligence and Data Science";
  const year = String(registration.year || "").trim();

  let clubName = "AI Frontier Club";
  let clubDept = "Department of Artificial Intelligence & Data Science";
  let clubEmail = "aifrontierclub@gmail.com";
  let clubPhone = "+91 9360376757";
  let clubSocial = "https://aifrontierclub.edu • @aifrontierclub";

  try {
    const club = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
    if (club) {
      if (club.name) clubName = club.name;
      if (club.department) clubDept = club.department;
      if (club.email) clubEmail = club.email;
      if (club.phone) clubPhone = club.phone;
    }
  } catch {}

  const participantGreeting = member2 ? `${member1} & ${member2}` : member1;
  const fullNameField = member2 ? `${member1} (Lead) & ${member2}` : member1;
  const categoryField = `${event.category || "Hackathon / Competition"}${teamName ? ` • Team: ${teamName}` : ""} • ${department}${year ? ` (${year})` : ""}`;

  const subject = `🎉 Participation Confirmed: ${eventTitle} (${regCode})`;

  const text = `Hi ${participantGreeting} 👋\n\n` +
`╔══════════════════════════════════════╗\n` +
`🎉 PARTICIPATION CONFIRMED 🎉\n` +
`[${eventTitle.toUpperCase()}]\n` +
`╚══════════════════════════════════════╝\n\n` +
`We’re excited to officially confirm your participation in **${eventTitle}**, organized by **${clubName}**! 🚀\n\n` +
`Your spot is reserved. Get ready to learn, compete, connect, and make the most of the experience.\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📅  DATE        : ${dateOnly}\n` +
`⏰  TIME        : ${timeOnly}\n` +
`📍  VENUE       : ${venue}\n` +
`🎯  EVENT       : ${eventTitle}\n` +
`🏛️  ORGANIZED BY: ${clubName}\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
`    🎫 YOUR PARTICIPATION DETAILS\n\n` +
`Participant Name\n` +
`**${fullNameField}**\n\n` +
`Registration ID\n` +
`**${regCode}**\n\n` +
`Event Category\n` +
`**${categoryField}**\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
`✨ WHAT’S NEXT?\n\n` +
`• Be present at the venue before the reporting time.\n` +
`• Carry your college/valid ID card if required.\n` +
`• Keep your Registration ID handy during check-in.\n` +
`• Follow the event guidelines shared by the organizing team.\n\n` +
`🔥 **The countdown begins now!**\n\n` +
`We’re looking forward to having you with us and making **${eventTitle}** an unforgettable experience.\n\n` +
`See you there! 🚀\n\n` +
`**${clubName}**\n` +
`${clubDept}\n\n` +
`📧 ${clubEmail}\n` +
`📱 ${clubPhone}\n` +
`🌐 ${clubSocial}\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`**CREATE • CONNECT • COMPETE**\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { subject, text };
}

/**
 * Creates a Nodemailer transporter based on settings
 */
function createTransporter() {
  const { user, pass } = getRawEmailCredentials();

  if (user && pass) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return null;
}

/**
 * Sends automated confirmation email upon participant registration
 */
export async function sendRegistrationEmail({ event, registration }) {
  const { user, senderName } = getRawEmailCredentials();
  const recipientEmail = String(registration.email || "").trim().toLowerCase();
  const secondParticipantEmail = String(registration.member2Email || registration.member2_email || registration.member2_phone || "").trim().toLowerCase();
  const recipients = [...new Set([recipientEmail, secondParticipantEmail].filter(Boolean))];
  const content = generateEmailContent({ event, registration });

  console.log(`\n===========================================================`);
  console.log(`📧 [AUTOMATED CONFIRMATION DISPATCH]`);
  console.log(`To: ${recipients.join(", ")}`);
  console.log(`Subject: ${content.subject}`);
  console.log(`Sender: ${user || "Dev Mock / Pending Credentials"} (${senderName})`);
  console.log(`===========================================================\n`);

  // Direct Gmail SMTP Delivery
  const transporter = createTransporter();

  if (transporter && user) {
    try {
      const info = await transporter.sendMail({
        from: `"${senderName}" <${user}>`,
        to: recipients.join(", "),
        subject: content.subject,
        text: content.text,
      });

      console.log(`[Email] Successfully delivered registration confirmation to ${recipients.join(", ")}! Message ID: ${info.messageId}`);
      return {
        success: true,
        sent: true,
        provider: "gmail",
        messageId: info.messageId,
        subject: content.subject,
        previewText: content.text,
        recipientEmail: recipients,
      };
    } catch (err) {
      console.error(`[Email] Gmail delivery failed:`, err.message);
      return {
        success: false,
        sent: false,
        provider: "gmail",
        error: err.message,
        subject: content.subject,
        previewText: content.text,
        recipientEmail: recipients,
      };
    }
  }

  // Fallback dev mode if no credentials configured yet
  console.log(`[Email] No Gmail App Password configured yet. Prepared email ready for dispatch.`);
  return {
    success: true,
    sent: false,
    provider: "local_mock",
    note: "Gmail credentials not configured in Admin settings yet. Email generated and ready.",
    subject: content.subject,
    previewText: content.text,
    recipientEmail: recipients,
  };
}

/**
 * Sends a live test email from Admin settings
 */
export async function sendTestEmail({ toEmail }) {
  const { user, senderName } = getRawEmailCredentials();
  const subject = `🚀 Test Email Notification from AI Frontier Club`;
  const text = `Congratulations!\n\nYour notification service is connected and functioning properly!\nEvent registrations will now automatically receive their official confirmation pass at their email address.\n\n- AI Frontier Club`;

  if (!user) {
    return { success: false, error: "Please configure your Gmail address in settings first." };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: "Please enter your 16-character Google App Password in settings." };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      to: toEmail,
      subject,
      text,
    });
    return {
      success: true,
      messageId: info.messageId,
      message: `Test email successfully delivered to ${toEmail}! Check your inbox.`,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to deliver email: ${err.message}. Make sure 2-Step Verification is on and you generated an App Password.`,
    };
  }
}

/**
 * Sends a postponement notice to every email address registered for an event.
 * Recipient lookup stays on the server so the admin UI never receives the list.
 */
export async function sendEventPostponementEmail({ event, newDate, message }) {
  const registrations = db.prepare(`
    SELECT email, member2_email
    FROM event_registrations
    WHERE event_id = ?
  `).all(event.id);

  const recipients = [...new Set(
    registrations
      .flatMap((registration) => [registration.email, registration.member2_email])
      .map((email) => String(email || "").trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )];

  if (recipients.length === 0) {
    return { success: false, error: "No registered email addresses were found for this event." };
  }

  const { user, senderName } = getRawEmailCredentials();
  const transporter = createTransporter();
  if (!transporter || !user) {
    return { success: false, error: "Please configure the admin Gmail address and App Password first." };
  }

  let formattedDate = newDate;
  try {
    const parsed = new Date(newDate);
    if (!Number.isNaN(parsed.getTime())) {
      formattedDate = parsed.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
    }
  } catch {}

  const subject = `Event Postponed: ${event.title}`;
  const text = `Hi there,\n\n${message}\n\nEvent: ${event.title}\nNew date: ${formattedDate}\n\nThank you for your patience.\n\n${senderName}`;

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      bcc: recipients,
      subject,
      text,
    });
    console.log(`[Email] Postponement notice sent to ${recipients.length} registered addresses for event ${event.id}.`);
    return { success: true, sent: true, recipientCount: recipients.length, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: `Failed to deliver postponement notice: ${err.message}` };
  }
}

/**
 * Sends automated notification email to all newsletter subscribers when a new event is created
 */
export async function notifySubscribersNewEvent(event) {
  const rows = db.prepare("SELECT email FROM subscribers ORDER BY id DESC").all();
  if (!rows || rows.length === 0) {
    console.log("[Email] No newsletter subscribers found to notify for new event.");
    return { count: 0 };
  }

  const emails = [...new Set(rows.map(r => String(r.email || "").trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) return { count: 0 };

  const { user, senderName } = getRawEmailCredentials();
  const transporter = createTransporter();

  let dateStr = "TBD";
  let timeStr = "TBD";
  try {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" });
      timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    }
  } catch {}

  let clubName = "AI Frontier Club";
  try {
    const club = db.prepare("SELECT name FROM club_details WHERE id = 1").get();
    if (club?.name) clubName = club.name;
  } catch {}

  const subject = `🚀 New Event Announced: ${event.title} | ${clubName}`;
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const eventLink = `${clientUrl}/events`;

  const text = `Greetings from ${clubName}! 👋\n\n` +
`╔══════════════════════════════════════╗\n` +
`🚀 NEW EVENT ANNOUNCED: ${event.title.toUpperCase()}\n` +
`╚══════════════════════════════════════╝\n\n` +
`A brand-new event has just been launched! As a subscriber to Frontier Dispatches, you get first-access details and registration availability.\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🎯 EVENT       : ${event.title}\n` +
`🏷️ CATEGORY    : ${event.category || "Hackathon / Workshop"}\n` +
`📅 DATE        : ${dateStr}\n` +
`⏰ TIME        : ${timeStr}\n` +
`📍 VENUE       : ${event.venue || "Campus AI Lab & Auditorium"}\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
(event.summary ? `Summary:\n${event.summary}\n\n` : "") +
`🔗 Register & View Event Details:\n${eventLink}\n\n` +
`Seats are limited. Secure your registration early!\n\n` +
`Best regards,\n` +
`${clubName} Team\n`;

  console.log(`\n===========================================================`);
  console.log(`📢 [NEW EVENT SUBSCRIBER DISPATCH]`);
  console.log(`Event: ${event.title}`);
  console.log(`Subscribers Count: ${emails.length}`);
  console.log(`Recipients: ${emails.join(", ")}`);
  console.log(`===========================================================\n`);

  if (!transporter || !user) {
    console.log(`[Email] Gmail not configured yet. ${emails.length} subscriber emails prepared for notification.`);
    return { count: emails.length, sent: false };
  }

  let successCount = 0;
  for (const recipient of emails) {
    try {
      await transporter.sendMail({
        from: `"${senderName}" <${user}>`,
        to: recipient,
        subject,
        text,
      });
      successCount++;
    } catch (err) {
      console.warn(`[Email] Failed to deliver event announcement to ${recipient}:`, err.message);
    }
  }

  console.log(`[Email] Successfully delivered new event announcement to ${successCount}/${emails.length} subscribers!`);
  return { count: emails.length, sentCount: successCount };
}

/**
 * Sends a welcome email when a user subscribes to the newsletter
 */
export async function sendSubscriptionWelcomeEmail(email) {
  const { user, senderName } = getRawEmailCredentials();
  const transporter = createTransporter();

  let clubName = "AI Frontier Club";
  try {
    const club = db.prepare("SELECT name FROM club_details WHERE id = 1").get();
    if (club?.name) clubName = club.name;
  } catch {}

  const subject = `🎉 Welcome to ${clubName} Dispatches!`;
  const text = `Hi there 👋\n\n` +
`Thank you for subscribing to ${clubName} Frontier Dispatches!\n\n` +
`You will now receive priority notifications directly to this email whenever a new hackathon, workshop, competition, or club event is announced.\n\n` +
`Stay curious and keep innovating! 🚀\n\n` +
`Best regards,\n` +
`${clubName} Team`;

  if (transporter && user) {
    try {
      await transporter.sendMail({
        from: `"${senderName}" <${user}>`,
        to: email,
        subject,
        text,
      });
      console.log(`[Email] Welcome email sent to subscriber: ${email}`);
    } catch (err) {
      console.warn(`[Email] Subscription welcome email delivery failed for ${email}:`, err.message);
    }
  }
}

