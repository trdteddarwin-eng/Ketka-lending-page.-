/**
 * Tedca Voice-Demo Lead Capture — Google Apps Script Web App
 * ----------------------------------------------------------
 * On each form submit the frontend POSTs a JSON lead here. This script:
 *   1. Appends a row to the active sheet (auto-creates a header row).
 *   2. Sends the site owner a Telegram message.
 *
 * REQUIRED SCRIPT PROPERTIES (Project Settings -> Script Properties):
 *   TELEGRAM_TOKEN    -> your bot token from @BotFather (e.g. 123456:ABC-...)
 *   TELEGRAM_CHAT_ID  -> the chat/user id to notify (from @userinfobot or getUpdates)
 *
 * NEVER hardcode the token/chat id in this file. They live in Script Properties only.
 *
 * DEPLOY: Deploy -> New deployment -> type "Web app"
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Then copy the Web app URL into the site's .env as VITE_LEAD_WEBHOOK_URL.
 *
 * The browser sends a "text/plain" POST (no custom headers) to avoid a CORS
 * preflight that Apps Script cannot answer. We parse the raw body as JSON.
 */

var SHEET_HEADERS = [
  'timestamp',
  'first_name',
  'last_name',
  'email',
  'phone',
  'source',
  'user_agent',
];

/**
 * Health check — visit the Web App URL in a browser to confirm it's live.
 */
function doGet(e) {
  return jsonResponse({ ok: true, msg: 'lead-capture alive' });
}

/**
 * Main entry point. Parses the lead, writes a row, pings Telegram.
 * Always returns JSON and never throws.
 */
function doPost(e) {
  try {
    var lead = parseLead(e);

    // RE-USE CHECK: the Sheet is also our "who already tried the demo" list.
    // If this email is already logged, report it as used and DON'T log a
    // duplicate row or re-notify — the site will push them to book a call.
    if (lead.email && emailExists(lead.email)) {
      return jsonResponse({ ok: true, alreadyUsed: true });
    }

    appendLeadRow(lead);

    // Telegram is best-effort — a failure here should not fail the whole request.
    try {
      notifyTelegram(lead);
    } catch (notifyErr) {
      Logger.log('Telegram notify failed: ' + notifyErr);
    }

    return jsonResponse({ ok: true, alreadyUsed: false });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/**
 * Returns true if the given email already appears in the Sheet's email column.
 * Case-insensitive. The email column is column 4 (D), per SHEET_HEADERS.
 */
function emailExists(email) {
  var target = String(email || '').trim().toLowerCase();
  if (!target) return false;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // empty or header-only

  // Read just the email column (col 4), rows 2..lastRow.
  var values = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === target) {
      return true;
    }
  }
  return false;
}

/**
 * Parses the incoming request body into a normalized lead object.
 */
function parseLead(e) {
  var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  var data = {};
  try {
    data = JSON.parse(raw);
  } catch (parseErr) {
    data = {};
  }

  return {
    timestamp: new Date().toISOString(),
    first_name: safeCell(data.first_name),
    last_name: safeCell(data.last_name),
    email: safeCell(data.email),
    phone: safeCell(data.phone),
    source: safeCell(data.source || 'voice-demo'),
    user_agent: safeCell(data.user_agent),
  };
}

/**
 * Makes a value safe to write into a Sheet cell.
 * Google Sheets treats any cell starting with = + - @ as a FORMULA, which both
 * breaks display (e.g. "+1 555..." -> #ERROR!) and is a formula-injection vector
 * if a lead types something like "=HYPERLINK(...)". Prefixing a single quote
 * forces Sheets to store the value as literal text (the quote isn't displayed).
 */
function safeCell(value) {
  var s = String(value == null ? '' : value);
  if (s.length > 0 && '=+-@'.indexOf(s.charAt(0)) !== -1) {
    return "'" + s;
  }
  return s;
}

/**
 * Appends the lead to the active sheet, writing headers first if empty.
 */
function appendLeadRow(lead) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
  }

  sheet.appendRow([
    lead.timestamp,
    lead.first_name,
    lead.last_name,
    lead.email,
    lead.phone,
    lead.source,
    lead.user_agent,
  ]);
}

/**
 * Sends a formatted HTML message to the owner via the Telegram Bot API.
 */
function notifyTelegram(lead) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');

  if (!token || !chatId) {
    Logger.log('Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID in Script Properties.');
    return;
  }

  var name = (lead.first_name + ' ' + lead.last_name).trim() || '(no name)';
  var text =
    '🎙️ <b>New voice-demo lead</b>\n\n' +
    '<b>Name:</b> ' + escapeHtml(name) + '\n' +
    '<b>Email:</b> ' + escapeHtml(lead.email || '—') + '\n' +
    '<b>Phone:</b> ' + escapeHtml(lead.phone || '—') + '\n' +
    '<b>Source:</b> ' + escapeHtml(lead.source || '—') + '\n' +
    '<b>Time:</b> ' + escapeHtml(lead.timestamp);

  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

/**
 * Escapes the characters that are special in Telegram HTML parse_mode.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Helper to return a JSON ContentService response.
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
