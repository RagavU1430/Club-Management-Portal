/**
 * Automated Mobile Messaging & WhatsApp Invitation Service.
 * Sends confirmation texts and invitation passes to event participants.
 */

function cleanPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/[^0-9+]/g, "").trim();
  // If 10 digits (e.g. Indian mobile number without prefix), default to +91
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `91${cleaned}`;
  }
  return cleaned.replace(/^\+/, "");
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
    `• Present this digital pass at the check-in desk.\n\n` +
    `Looking forward to seeing your team in action!\n` +
    `- AI Frontier Club, Dept. of AI & Data Science`;
}

export function getWhatsAppUrl(phone, message) {
  const clean = cleanPhoneNumber(phone);
  if (!clean) return "";
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`;
}

/**
 * Sends an automated invitation to both Member 1 and Member 2 via gateway webhook (or logs in dev).
 */
export async function sendAutomatedMobileInvitation({ event, registration }) {
  const message = generateInvitationMessage({ event, registration });
  const phone1 = cleanPhoneNumber(registration.phone);
  const phone2 = cleanPhoneNumber(registration.member2_phone || registration.phone2);

  const member1Link = phone1 ? getWhatsAppUrl(phone1, message) : "";
  const member2Link = phone2 ? getWhatsAppUrl(phone2, message) : "";

  console.log(`\n===========================================================`);
  console.log(`📱 [AUTOMATED MOBILE INVITATION DISPATCHED]`);
  console.log(`Event: ${event.title}`);
  console.log(`Team: ${registration.teamName || registration.team_name || "N/A"}`);
  console.log(`Member 1 (${registration.member1 || registration.name}): +${phone1}`);
  if (phone2) console.log(`Member 2 (${registration.member2}): +${phone2}`);
  console.log(`-----------------------------------------------------------`);
  console.log(message);
  console.log(`===========================================================\n`);

  // Outbound webhook support for SMS / WhatsApp gateways (e.g. Fast2SMS, Twilio, UltraMsg)
  const gatewayUrl = process.env.SMS_GATEWAY_URL || process.env.WHATSAPP_GATEWAY_URL;
  if (gatewayUrl && gatewayUrl.startsWith("http")) {
    try {
      await fetch(gatewayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [phone1, phone2].filter(Boolean),
          message,
          eventTitle: event.title,
          registrationId: registration.registrationCode,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      console.warn("[Messenger] Gateway webhook dispatch failed:", err.message);
    }
  }

  return {
    success: true,
    message,
    phone1: registration.phone,
    phone2: registration.member2_phone || registration.phone2,
    member1WhatsappUrl: member1Link,
    member2WhatsappUrl: member2Link,
  };
}
