import { db } from "../config/db.js";

/**
 * Automated Mobile Messaging & WhatsApp Invitation Service.
 * Sends confirmation texts and invitation passes to event participants via:
 * 1. Fast2SMS (Direct telecom SMS to Indian mobile numbers)
 * 2. Twilio (Global SMS & WhatsApp Business)
 * 3. Custom Gateway Webhook
 * 4. Direct 1-tap WhatsApp (`wa.me`) & Native Device SMS (`sms:`)
 */

export function cleanPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/[^0-9+]/g, "").trim();
  // If 10 digits (e.g. Indian mobile number without prefix), default to 91
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `91${cleaned}`;
  }
  return cleaned.replace(/^\+/, "");
}

export function cleanTenDigitNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/[^0-9]/g, "").trim();
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  if (cleaned.length === 10) {
    return cleaned;
  }
  return cleaned;
}

export function getMessengerConfig() {
  const providerRow = db.prepare("SELECT value FROM settings WHERE key = 'sms_provider'").get();
  const fast2smsRow = db.prepare("SELECT value FROM settings WHERE key = 'fast2sms_api_key'").get();
  const twilioSidRow = db.prepare("SELECT value FROM settings WHERE key = 'twilio_sid'").get();
  const twilioTokenRow = db.prepare("SELECT value FROM settings WHERE key = 'twilio_token'").get();
  const twilioFromRow = db.prepare("SELECT value FROM settings WHERE key = 'twilio_from'").get();
  const webhookRow = db.prepare("SELECT value FROM settings WHERE key = 'sms_webhook_url'").get();

  const provider = providerRow?.value || process.env.SMS_PROVIDER || "fast2sms";
  const fast2smsApiKey = fast2smsRow?.value || process.env.FAST2SMS_API_KEY || "";
  const twilioSid = twilioSidRow?.value || process.env.TWILIO_ACCOUNT_SID || "";
  const twilioToken = twilioTokenRow?.value || process.env.TWILIO_AUTH_TOKEN || "";
  const twilioFrom = twilioFromRow?.value || process.env.TWILIO_FROM || "";
  const smsWebhookUrl = webhookRow?.value || process.env.SMS_GATEWAY_URL || process.env.WHATSAPP_GATEWAY_URL || "";

  const isConfigured = Boolean(
    (provider === "fast2sms" && fast2smsApiKey) ||
    (provider === "twilio" && twilioSid && twilioToken && twilioFrom) ||
    (provider === "webhook" && smsWebhookUrl)
  );

  return {
    provider,
    fast2smsApiKey: fast2smsApiKey ? `${fast2smsApiKey.slice(0, 6)}...${fast2smsApiKey.slice(-4)}` : "",
    hasFast2smsKey: Boolean(fast2smsApiKey),
    twilioSid: twilioSid ? `${twilioSid.slice(0, 6)}...` : "",
    hasTwilioToken: Boolean(twilioToken),
    twilioFrom,
    smsWebhookUrl,
    isConfigured,
  };
}

export function getRawMessengerSecrets() {
  const providerRow = db.prepare("SELECT value FROM settings WHERE key = 'sms_provider'").get();
  const fast2smsRow = db.prepare("SELECT value FROM settings WHERE key = 'fast2sms_api_key'").get();
  const twilioSidRow = db.prepare("SELECT value FROM settings WHERE key = 'twilio_sid'").get();
  const twilioTokenRow = db.prepare("SELECT value FROM settings WHERE key = 'twilio_token'").get();
  const twilioFromRow = db.prepare("SELECT value FROM settings WHERE key = 'twilio_from'").get();
  const webhookRow = db.prepare("SELECT value FROM settings WHERE key = 'sms_webhook_url'").get();

  return {
    provider: providerRow?.value || process.env.SMS_PROVIDER || "fast2sms",
    fast2smsApiKey: fast2smsRow?.value || process.env.FAST2SMS_API_KEY || "",
    twilioSid: twilioSidRow?.value || process.env.TWILIO_ACCOUNT_SID || "",
    twilioToken: twilioTokenRow?.value || process.env.TWILIO_AUTH_TOKEN || "",
    twilioFrom: twilioFromRow?.value || process.env.TWILIO_FROM || "",
    smsWebhookUrl: webhookRow?.value || process.env.SMS_GATEWAY_URL || "",
  };
}

export function saveMessengerConfig({ provider, fast2smsApiKey, twilioSid, twilioToken, twilioFrom, smsWebhookUrl }) {
  const upsert = (k, v) => {
    if (v !== undefined && v !== null) {
      db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%S','now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(k, String(v).trim());
    }
  };

  if (provider) upsert("sms_provider", provider);
  if (fast2smsApiKey !== undefined && fast2smsApiKey !== "") upsert("fast2sms_api_key", fast2smsApiKey);
  if (twilioSid !== undefined && twilioSid !== "") upsert("twilio_sid", twilioSid);
  if (twilioToken !== undefined && twilioToken !== "") upsert("twilio_token", twilioToken);
  if (twilioFrom !== undefined) upsert("twilio_from", twilioFrom);
  if (smsWebhookUrl !== undefined) upsert("sms_webhook_url", smsWebhookUrl);

  return getMessengerConfig();
}

export function generateInvitationMessage({ event, registration }) {
  const eventTitle = event.title || "AI Frontier Club Event";
  let formattedDate = event.date;
  try {
    formattedDate = new Date(event.date).toLocaleString("en-US", {
      weekday: "short",
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
  const phone1 = registration.phone || "—";
  const phone2 = registration.member2_phone || registration.phone2 || "—";
  const venue = event.venue || "Campus AI Lab";
  const regCode = registration.registrationCode || `AIF-${event.id}-${registration.id || ""}`;

  return `🌟 *AI FRONTIER CLUB - EVENT CONFIRMATION* 🌟\n\n` +
    `Hello ${member1} & ${member2}!\n` +
    `Your team registration for *${eventTitle}* is officially CONFIRMED! 🚀\n\n` +
    `🎫 *Registration ID:* ${regCode}\n` +
    `👥 *Team Name:* ${teamName}\n` +
    `👤 *Member 1 (Lead):* ${member1} (${phone1})\n` +
    `👤 *Member 2:* ${member2} (${phone2})\n\n` +
    `📅 *Date & Time:* ${formattedDate}\n` +
    `📍 *Venue:* ${venue}\n\n` +
    `📌 *Instructions:*\n` +
    `• Please arrive 15 minutes prior to the schedule.\n` +
    `• Bring your College ID card and charged laptop.\n` +
    `• Present this digital pass at check-in.\n\n` +
    `Looking forward to seeing your team in action!\n` +
    `- AI Frontier Club, Dept. of AI & Data Science`;
}

export function generateShortSmsText({ event, registration }) {
  const eventTitle = (event.title || "AI Club Event").slice(0, 30);
  const teamName = (registration.teamName || registration.team_name || "Team").slice(0, 20);
  const regCode = registration.registrationCode || `AIF-${event.id}-${registration.id || ""}`;
  return `Confirmed! Team ${teamName} is registered for ${eventTitle}. Reg ID: ${regCode}. Venue: ${event.venue || "AI Lab"}. AI Frontier Club.`;
}

export function getWhatsAppUrl(phone, message) {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return "";
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function getDeviceSmsUrl(phone, message) {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return "";
  return `sms:+${clean}?body=${encodeURIComponent(message)}`;
}

/**
 * Dispatches real SMS using Fast2SMS Dev API
 */
async function sendViaFast2Sms({ apiKey, numbers, message }) {
  const valid10Digits = numbers.map(cleanTenDigitNumber).filter(n => /^[6-9]\d{9}$/.test(n));
  if (valid10Digits.length === 0) {
    return { success: false, error: "No valid 10-digit Indian mobile numbers found." };
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: message.slice(0, 160),
        language: "english",
        numbers: valid10Digits.join(","),
      }),
      signal: AbortSignal.timeout(12000),
    });

    const data = await res.json();
    console.log(`[Fast2SMS Dispatch Response]`, data);
    return {
      success: data.return === true || data.status_code === 200,
      provider: "fast2sms",
      data,
      numbers: valid10Digits,
    };
  } catch (err) {
    console.error("[Fast2SMS Error]", err.message);
    return { success: false, provider: "fast2sms", error: err.message };
  }
}

/**
 * Dispatches real SMS using Twilio REST API
 */
async function sendViaTwilio({ sid, token, from, numbers, message }) {
  const results = [];
  for (const num of numbers) {
    const e164 = `+${cleanPhoneNumber(num)}`;
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const form = new URLSearchParams();
      form.append("From", from);
      form.append("To", e164);
      form.append("Body", message.slice(0, 160));

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();
      results.push({ to: e164, status: res.ok, sid: data.sid, error: data.message });
    } catch (err) {
      results.push({ to: e164, status: false, error: err.message });
    }
  }

  const allSuccess = results.some(r => r.status);
  return { success: allSuccess, provider: "twilio", results };
}

/**
 * Dispatches test SMS to verify gateway credentials
 */
export async function sendTestSMS({ phone, message }) {
  const secrets = getRawMessengerSecrets();
  const testMsg = message || "Hello! This is a test confirmation message from AI Frontier Club. Your SMS Gateway is configured successfully! 🚀";
  const num = cleanPhoneNumber(phone);

  if (!num) {
    return { success: false, error: "Please provide a valid recipient phone number." };
  }

  if (secrets.provider === "fast2sms") {
    if (!secrets.fast2smsApiKey) {
      return { success: false, error: "Fast2SMS API Key is not configured. Enter your key from fast2sms.com first." };
    }
    return await sendViaFast2Sms({
      apiKey: secrets.fast2smsApiKey,
      numbers: [num],
      message: testMsg,
    });
  }

  if (secrets.provider === "twilio") {
    if (!secrets.twilioSid || !secrets.twilioToken || !secrets.twilioFrom) {
      return { success: false, error: "Twilio SID, Auth Token, or From number is missing." };
    }
    return await sendViaTwilio({
      sid: secrets.twilioSid,
      token: secrets.twilioToken,
      from: secrets.twilioFrom,
      numbers: [num],
      message: testMsg,
    });
  }

  if (secrets.provider === "webhook" && secrets.smsWebhookUrl) {
    try {
      const res = await fetch(secrets.smsWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: [num], message: testMsg }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok, provider: "webhook", data };
    } catch (err) {
      return { success: false, provider: "webhook", error: err.message };
    }
  }

  return {
    success: false,
    error: "No active SMS Gateway credentials configured yet. Please configure Fast2SMS or Twilio.",
  };
}

/**
 * Main automated invitation sender invoked upon registration
 */
export async function sendAutomatedMobileInvitation({ event, registration }) {
  const fullMessage = generateInvitationMessage({ event, registration });
  const shortSms = generateShortSmsText({ event, registration });
  const phone1 = cleanPhoneNumber(registration.phone);
  const phone2 = cleanPhoneNumber(registration.member2_phone || registration.phone2);

  const member1WhatsappUrl = phone1 ? getWhatsAppUrl(phone1, fullMessage) : "";
  const member2WhatsappUrl = phone2 ? getWhatsAppUrl(phone2, fullMessage) : "";
  const member1SmsUrl = phone1 ? getDeviceSmsUrl(phone1, fullMessage) : "";
  const member2SmsUrl = phone2 ? getDeviceSmsUrl(phone2, fullMessage) : "";

  console.log(`\n===========================================================`);
  console.log(`📱 [AUTOMATED MOBILE INVITATION TRIGGERED]`);
  console.log(`Event: ${event.title}`);
  console.log(`Team: ${registration.teamName || registration.team_name || "N/A"}`);
  console.log(`Lead (M1): +${phone1}`);
  if (phone2) console.log(`Member 2: +${phone2}`);
  console.log(`-----------------------------------------------------------`);

  const secrets = getRawMessengerSecrets();
  let gatewayResult = { dispatched: false, provider: secrets.provider, note: "No telecom gateway active" };

  const recipients = [phone1, phone2].filter(Boolean);

  if (secrets.provider === "fast2sms" && secrets.fast2smsApiKey && recipients.length > 0) {
    console.log(`[Messenger] Dispatched telecom SMS via Fast2SMS to:`, recipients);
    const res = await sendViaFast2Sms({
      apiKey: secrets.fast2smsApiKey,
      numbers: recipients,
      message: shortSms,
    });
    gatewayResult = { dispatched: res.success, provider: "fast2sms", ...res };
  } else if (secrets.provider === "twilio" && secrets.twilioSid && secrets.twilioToken && recipients.length > 0) {
    console.log(`[Messenger] Dispatched telecom SMS via Twilio to:`, recipients);
    const res = await sendViaTwilio({
      sid: secrets.twilioSid,
      token: secrets.twilioToken,
      from: secrets.twilioFrom,
      numbers: recipients,
      message: shortSms,
    });
    gatewayResult = { dispatched: res.success, provider: "twilio", ...res };
  } else if (secrets.provider === "webhook" && secrets.smsWebhookUrl && recipients.length > 0) {
    try {
      await fetch(secrets.smsWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          message: fullMessage,
          shortSms,
          eventTitle: event.title,
          registrationId: registration.registrationCode,
        }),
        signal: AbortSignal.timeout(10000),
      });
      gatewayResult = { dispatched: true, provider: "webhook" };
    } catch (err) {
      gatewayResult = { dispatched: false, provider: "webhook", error: err.message };
    }
  }

  return {
    success: true,
    invitationMessage: fullMessage,
    shortSms,
    phone1: registration.phone,
    phone2: registration.member2_phone || registration.phone2,
    member1WhatsappUrl,
    member2WhatsappUrl,
    member1SmsUrl,
    member2SmsUrl,
    gatewayResult,
  };
}
