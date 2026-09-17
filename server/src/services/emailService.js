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
      dateOnly = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      timeOnly = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch {}

  const teamName = registration.teamName || registration.team_name || "";
  const member1 = registration.member1 || registration.name || "Participant";
  const member2 = registration.member2 || "";
  const venue = event.venue || "Campus AI Lab & Auditorium";
  const regCode = registration.registrationCode || `AIF-${event.id}-${registration.id || ""}`;
  const department = registration.department || registration.college || "Artificial Intelligence and Data Science";
  const year = registration.year || "3rd Year";

  let clubName = "AI Frontier Club";
  let clubDept = "Department of Artificial Intelligence & Data Science";
  let clubEmail = "aifrontierclub@gmail.com";
  let clubPhone = "+91 98765 43210";
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
  const categoryField = `${event.category || "Hackathon / Competition"}${teamName ? ` • Team: ${teamName}` : ""} • ${department} (${year})`;

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
      service: "gmail",
      auth: {
        user,
        pass,
      },
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
  console.log(`📧 [AUTOMATED GMAIL CONFIRMATION DISPATCH]`);
  console.log(`To: ${recipients.join(", ")}`);
  console.log(`Subject: ${content.subject}`);
  console.log(`Sender: ${user || "Dev Mock / Pending Credentials"} (${senderName})`);
  console.log(`===========================================================\n`);

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
  if (!user) {
    return { success: false, error: "Please configure your Gmail address in settings first." };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: "Please enter your 16-character Google App Password in settings." };
  }

  const subject = `🚀 Test Email Notification from AI Frontier Club`;
  const text = `Congratulations!\n\nYour Gmail notification service is connected and functioning properly!\nEvent registrations will now automatically receive their official confirmation pass at their email address.\n\n- AI Frontier Club`;

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
