import {
  getSheetConfig,
  saveSheetConfig,
  syncAllToGoogleSheet,
  createEventSheet,
  recordRegistration,
  getGoogleAppsScriptTemplate,
} from "../services/googleSheets.js";
import {
  getMessengerConfig,
  saveMessengerConfig,
  sendTestSMS,
} from "../services/messenger.js";
import { db } from "../config/db.js";
import { ApiError } from "../utils/http.js";

export async function getGoogleSheetSettings(req, res) {
  const config = getSheetConfig();
  const scriptCode = getGoogleAppsScriptTemplate(config.spreadsheetId);
  res.json({
    success: true,
    data: {
      ...config,
      scriptCode,
    },
  });
}

export async function updateGoogleSheetSettings(req, res) {
  const { webhookUrl, spreadsheetUrl } = req.body || {};
  const updated = saveSheetConfig({ webhookUrl, spreadsheetUrl });
  res.json({
    success: true,
    message: "Google Sheets configuration updated successfully.",
    data: updated,
  });
}

export async function syncAllSheets(req, res) {
  try {
    const result = await syncAllToGoogleSheet();
    res.json(result);
  } catch (err) {
    throw new ApiError(400, err.message);
  }
}

export async function syncSingleEventSheet(req, res) {
  const eventId = Number(req.params.id);
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  const sheetRes = await createEventSheet(event);
  const regs = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY id ASC").all(eventId);
  let count = 0;
  for (const r of regs) {
    await recordRegistration(event, r);
    count++;
  }

  res.json({
    success: true,
    message: `Event "${event.title}" synced to Google Sheets. ${count} registrations recorded.`,
    data: { sheetRes, registrationsSynced: count },
  });
}

// ── SMS & WhatsApp Messenger Gateway Settings ──
export async function getMessengerSettings(req, res) {
  const config = getMessengerConfig();
  res.json({
    success: true,
    data: config,
  });
}

export async function updateMessengerSettings(req, res) {
  const { provider, fast2smsApiKey, twilioSid, twilioToken, twilioFrom, smsWebhookUrl } = req.body || {};
  const updated = saveMessengerConfig({
    provider,
    fast2smsApiKey,
    twilioSid,
    twilioToken,
    twilioFrom,
    smsWebhookUrl,
  });
  res.json({
    success: true,
    message: "SMS & WhatsApp gateway settings updated successfully.",
    data: updated,
  });
}

export async function sendTestSmsController(req, res) {
  const { phone, message } = req.body || {};
  if (!phone) {
    throw new ApiError(400, "Mobile phone number is required to send test SMS.");
  }

  const result = await sendTestSMS({ phone, message });
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || "SMS delivery failed. Check your API key and balance.",
      details: result,
    });
  }

  res.json({
    success: true,
    message: `Test SMS successfully sent to ${phone}! Check your phone.`,
    data: result,
  });
}
