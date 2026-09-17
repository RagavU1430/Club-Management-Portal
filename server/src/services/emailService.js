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
  let formattedDate = event.date;
  try {
    formattedDate = new Date(event.date).toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {}

  const teamName = registration.teamName || registration.team_name || "Team";
  const member1 = registration.member1 || registration.name || "Member 1";
  const member2 = registration.member2 || "Member 2";
  const email1 = registration.email || "—";
  const email2 = registration.member2_phone || registration.member2Email || registration.member2email || "—"; // stored in member2_phone col
  const venue = event.venue || "Campus AI Lab & Auditorium";
  const regCode = registration.registrationCode || `AIF-${event.id}-${registration.id || ""}`;
  const department = registration.department || registration.college || "Artificial Intelligence and Data Science";
  const year = registration.year || "3rd Year";

  const subject = `Registration Confirmed: ${eventTitle} - Team ${teamName} (${regCode})`;

  const text = `AI FRONTIER CLUB - OFFICIAL EVENT CONFIRMATION\n` +
    `Dept. of Artificial Intelligence & Data Science\n\n` +
    `Hello ${member1} and ${member2},\n\n` +
    `Your team registration for "${eventTitle}" has been confirmed.\n\n` +
    `Registration details:\n` +
    `Registration ID: ${regCode}\n` +
    `Team Name: ${teamName}\n` +
    `Participant 1 (Team Lead): ${member1}\n` +
    `Participant 1 Email: ${email1}\n` +
    `Participant 2: ${member2}\n` +
    `${email2 && email2 !== "—" ? `Participant 2 Email: ${email2}\n` : ""}` +
    `Department: ${department}\n` +
    `Year of Study: ${year}\n` +
    `Event Date and Schedule: ${formattedDate}\n` +
    `Venue: ${venue}\n\n` +
    `Instructions for attendees:\n` +
    `1. Please report at least 15 minutes before the event begins.\n` +
    `2. Bring your valid Identity Card and charged laptops with necessary dev environments.\n` +
    `3. Present this confirmation email (or Registration ID ${regCode}) at the check-in reception desk.\n\n` +
    `We look forward to seeing your team build and innovate.\n\n` +
    `Warm regards,\n` +
    `Event Organizing Team\n` +
    `AI Frontier Club\n` +
    `contact@aifrontierclub.org`;

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
