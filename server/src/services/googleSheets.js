import { db } from "../config/db.js";

const DEFAULT_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing";
const DEFAULT_SPREADSHEET_ID = "1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk";

export function getSheetConfig() {
  const urlRow = db.prepare("SELECT value FROM settings WHERE key = 'google_sheet_url'").get();
  const idRow = db.prepare("SELECT value FROM settings WHERE key = 'google_sheet_id'").get();
  const webhookRow = db.prepare("SELECT value FROM settings WHERE key = 'google_sheet_webhook_url'").get();

  const spreadsheetUrl = urlRow?.value || DEFAULT_SPREADSHEET_URL;
  const spreadsheetId = idRow?.value || DEFAULT_SPREADSHEET_ID;
  const webhookUrl = webhookRow?.value || process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";

  return {
    spreadsheetUrl,
    spreadsheetId,
    webhookUrl,
    hasWebhook: Boolean(webhookUrl && webhookUrl.startsWith("http")),
  };
}

export function saveSheetConfig({ webhookUrl, spreadsheetUrl }) {
  if (spreadsheetUrl) {
    db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('google_sheet_url', ?, strftime('%Y-%m-%dT%H:%M:%S','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").run(spreadsheetUrl.trim());
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('google_sheet_id', ?, strftime('%Y-%m-%dT%H:%M:%S','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").run(match[1]);
    }
  }

  if (webhookUrl !== undefined) {
    db.prepare("INSERT INTO settings (key, value, updated_at) VALUES ('google_sheet_webhook_url', ?, strftime('%Y-%m-%dT%H:%M:%S','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").run(webhookUrl.trim());
  }

  return getSheetConfig();
}

/**
 * Returns a Google Sheets tab name that is safe and won't collide with column references (like 'AI').
 */
export function getSafeSheetName(eventTitle) {
  let title = (eventTitle || "Event").trim();
  title = title.replace(/[:\\/?*\[\]]/g, "-").trim();
  if (title.length <= 4 || /^[A-Za-z]{1,3}\d*$/i.test(title)) {
    title = `${title} - Registrations`;
  }
  return title.slice(0, 80);
}

/**
 * Ensures we only use a valid webhook endpoint, preventing spreadsheet URLs from breaking the sync.
 */
export function getTargetWebhookUrl(event) {
  const config = getSheetConfig();
  if (
    event?.webhook_url &&
    typeof event.webhook_url === "string" &&
    event.webhook_url.startsWith("http") &&
    !event.webhook_url.includes("docs.google.com/spreadsheets")
  ) {
    return event.webhook_url.trim();
  }
  return config.webhookUrl;
}

/**
 * Sends a request to Google Apps Script Webhook.
 * Follows 302 redirects automatically if fetch handles it.
 */
async function callWebhook(url, payload) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: AbortSignal.timeout(35000),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: res.ok, raw: text };
    }
  } catch (err) {
    console.error("[googleSheets] Webhook error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Creates a dedicated sheet tab in the Google Spreadsheet for a new event.
 */
export async function createEventSheet(event) {
  const targetUrl = getTargetWebhookUrl(event);
  if (!targetUrl) return { success: false, reason: "No webhook configured" };

  const sheetName = getSafeSheetName(event.title);

  return callWebhook(targetUrl, {
    action: "create_event_sheet",
    sheetName,
    eventId: event.id,
    date: event.date,
    venue: event.venue,
    capacity: event.capacity,
  });
}

/**
 * Appends a participant registration row to the event's tab in the Google Spreadsheet.
 */
export async function recordRegistration(event, reg) {
  const targetUrl = getTargetWebhookUrl(event);
  if (!targetUrl) return { success: false, reason: "No webhook configured" };

  const registrationCode = reg.registrationCode || (reg.id ? `AIF-${event.id}-${reg.id}` : `AIF-${event.id}`);
  const sheetName = getSafeSheetName(event.title);

  let formattedDate = "";
  try {
    const d = new Date(reg.created_at || Date.now());
    formattedDate = d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    formattedDate = reg.created_at || new Date().toISOString();
  }

  return callWebhook(targetUrl, {
    action: "add_registration",
    sheetName,
    eventId: event.id,
    registrationId: registrationCode,
    teamName: String(reg.teamName || reg.team_name || "").trim(),
    member1: String(reg.member1 || reg.name || "").trim(),
    member2: String(reg.member2 || "").trim(),
    name: String(reg.member1 || reg.name || "").trim(),
    email: String(reg.email || "").trim().toLowerCase(),
    member2Email: String(reg.member2_phone || reg.member2Phone || reg.member2Email || "").trim().toLowerCase(),
    department: String(reg.department || reg.college || "").trim(),
    year: String(reg.year || "").trim(),
    notes: String(reg.notes || "").trim(),
    timestamp: formattedDate,
  });
}

/**
 * Syncs all events and their attendees to Google Sheets.
 */
export async function syncAllToGoogleSheet() {
  const config = getSheetConfig();
  if (!config.hasWebhook) {
    throw new Error("Please configure and deploy your Google Apps Script Webhook URL first.");
  }

  const events = db.prepare("SELECT * FROM events ORDER BY date ASC").all();
  const results = [];

  for (const event of events) {
    const sheetRes = await createEventSheet(event);
    const regs = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY id ASC").all(event.id);
    let count = 0;
    for (const reg of regs) {
      await recordRegistration(event, reg);
      count++;
    }
    results.push({ eventTitle: event.title, sheetResult: sheetRes, registeredSynced: count });
  }

  return { success: true, eventsProcessed: results.length, details: results };
}

/**
 * Returns the copy-paste Google Apps Script code customized with the spreadsheet ID.
 */
export function getGoogleAppsScriptTemplate(spreadsheetId = DEFAULT_SPREADSHEET_ID) {
  return `/**
 * AI FRONTIER CLUB - GOOGLE SHEETS LIVE SYNC
 * Spreadsheet ID: ${spreadsheetId}
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Spreadsheet:
 *    https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit
 * 2. In top menu click: Extensions -> Apps Script
 * 3. Delete any existing code and PASTE THIS ENTIRE SCRIPT.
 * 4. Click "Deploy" (top right) -> "New deployment"
 * 5. Click the gear icon (Select type) -> choose "Web app"
 * 6. Set Description: "AI Frontier Sync"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL!
 * 9. Click "Deploy" -> "Authorize access" (choose your Google account, click Advanced -> Go to Untitled project)
 * 10. Copy the "Web app URL" (ends in /exec) and paste it into the Admin Console!
 */

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var rawTitle = (data.sheetName || data.eventTitle || "Event Registrations").trim();
    var sheetName = rawTitle.replace(/[:\\\\/?*\\[\\]]/g, "-").trim();
    if (sheetName.length <= 4 || /^[A-Za-z]{1,3}\\d*$/i.test(sheetName)) {
      sheetName = sheetName + " - Registrations";
    }
    sheetName = sheetName.substring(0, 80);

    var sheet = ss.getSheetByName(sheetName);

    var headers = [
      "Registration ID",
      "Team Name",
      "Member 1 (Lead)",
      "Lead Email",
      "Member 2",
      "Member 2 Email",
      "Department",
      "Year of Study",
      "Notes / Queries",
      "Registered At"
    ];

    function ensureHeaders(targetSheet) {
      var lastCol = targetSheet.getLastColumn();
      var needHeaders = false;
      if (lastCol < headers.length) {
        needHeaders = true;
      } else {
        var firstRow = targetSheet.getRange(1, 1, 1, headers.length).getValues()[0];
        if (firstRow[1] !== "Team Name" || firstRow[4] !== "Member 2") {
          needHeaders = true;
        }
      }

      if (needHeaders) {
        targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        var headerRange = targetSheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#0f172a");
        headerRange.setFontColor("#38bdf8");
        targetSheet.setFrozenRows(1);
        for (var i = 1; i <= headers.length; i++) {
          targetSheet.autoResizeColumn(i);
        }
      }
    }

    // 1. CREATE EVENT SHEET (if doesn't exist or requested)
    if (data.action === "create_event_sheet" || !sheet) {
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      ensureHeaders(sheet);

      if (data.action === "create_event_sheet") {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Sheet ready: " + sheetName,
          sheetName: sheetName
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Always ensure current sheet has the new 10-column header layout
    ensureHeaders(sheet);

    // 2. ADD PARTICIPANT REGISTRATION ROW
    if (data.action === "add_registration" || data.name || data.email || data.member1) {
      var regId = String(data.registrationId || "").trim();
      var leadEmail = String(data.email || "").trim().toLowerCase();
      var member2Email = String(data.member2Email || data.member2_phone || data.member2Phone || "").trim().toLowerCase();
      var teamName = String(data.teamName || data.team_name || "").trim();
      var member1 = String(data.member1 || data.name || "").trim();
      var member2 = String(data.member2 || "").trim();

      // Duplicate protection: check if registration ID or email already exists in sheet
      var lastRow = sheet.getLastRow();
      if (lastRow > 1 && (regId || leadEmail)) {
        var values = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 6)).getValues();
        for (var r = 0; r < values.length; r++) {
          var existingRegId = String(values[r][0] || "").trim();
          var existingEmail = String(values[r][3] || "").trim().toLowerCase();
          if ((regId && existingRegId === regId) || (leadEmail && existingEmail === leadEmail)) {
            return ContentService.createTextOutput(JSON.stringify({
              success: true,
              message: "Already synced: " + (regId || leadEmail),
              sheetName: sheetName,
              alreadySynced: true
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      var regIdStr = regId ? "'" + regId : "";

      var row = [
        regIdStr,
        teamName || (member1 ? member1 + "'s Team" : "Team"),
        member1,
        leadEmail,
        member2 || "-",
        member2Email || "-",
        String(data.department || data.college || "").trim(),
        String(data.year || "").trim(),
        String(data.notes || "").trim(),
        data.timestamp || new Date().toLocaleString()
      ];
      sheet.appendRow(row);

      // Auto-resize columns so contents are never cut off
      for (var col = 1; col <= headers.length; col++) {
        sheet.autoResizeColumn(col);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Registration recorded in " + sheetName,
        sheetName: sheetName,
        email: leadEmail,
        member1: member1,
        member2: member2
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Webhook acknowledged"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("AI Frontier Club - Google Sheets Sync Webhook is Active and Ready!");
}
`;
}
