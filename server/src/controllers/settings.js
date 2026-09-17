import {
  getSheetConfig,
  saveSheetConfig,
  syncAllToGoogleSheet,
  createEventSheet,
  recordRegistration,
  getGoogleAppsScriptTemplate,
} from "../services/googleSheets.js";
import {
  getEmailConfig,
  saveEmailConfig,
  sendTestEmail,
} from "../services/emailService.js";
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

// ── Gmail & Email Notification Settings ──
export async function getEmailSettings(req, res) {
  const config = getEmailConfig();
  res.json({
    success: true,
    data: config,
  });
}

export async function updateEmailSettings(req, res) {
  const { gmailUser, gmailAppPassword, senderName } = req.body || {};
  const updated = saveEmailConfig({
    gmailUser,
    gmailAppPassword,
    senderName,
  });
  res.json({
    success: true,
    message: "Gmail configuration updated successfully.",
    data: updated,
  });
}

export async function sendTestEmailController(req, res) {
  const { toEmail } = req.body || {};
  if (!toEmail) {
    throw new ApiError(400, "Recipient email address is required to send test email.");
  }

  const result = await sendTestEmail({ toEmail });
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error || "Failed to deliver test email.",
      details: result,
    });
  }

  res.json({
    success: true,
    message: result.message || `Test email successfully delivered to ${toEmail}!`,
    data: result,
  });
}

