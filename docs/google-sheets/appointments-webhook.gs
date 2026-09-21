/**
 * QUALITY Hearing Care — appointment → Google Sheets webhook.
 *
 * This script is the ONLY thing that touches the spreadsheet. The Next.js app
 * holds no Google credentials at all: no service account, no private key, no
 * OAuth token. It knows a web-app URL and a shared secret, both server-side
 * environment variables.
 *
 * Turso remains the source of truth. This sheet is a secondary reporting copy.
 * Nothing here can create, change or delete an appointment.
 *
 * ── Setup ───────────────────────────────────────────────────────────────────
 *  1. Extensions → Apps Script, paste this file into the project's Code.gs.
 *  2. Project Settings → Script properties → add:
 *        SHEET_WEBHOOK_SECRET  = <same value as GOOGLE_SHEETS_WEBHOOK_SECRET>
 *     Optional:
 *        SPREADSHEET_ID        = <id>   (omit when the script is bound to the sheet)
 *  3. Run `setupSheet()` once and approve the permission prompt. It creates the
 *     "Appointments" tab with the header row if either is missing.
 *  4. Deploy → New deployment → Web app.
 *        Execute as:      Me
 *        Who has access:  Anyone
 *     "Anyone" is required only so the request is not blocked by a Google login;
 *     it is NOT an open door, because every request must carry a valid HMAC
 *     signature over its body. Copy the /exec URL into
 *     GOOGLE_SHEETS_WEBHOOK_URL in Netlify.
 *     Use the /exec URL — /dev only works while you are signed in.
 *  5. After ANY edit here, Deploy → Manage deployments → Edit → Version: New
 *     version. Editing the code alone does not change what /exec serves.
 *
 * ── Why the signature is in the query string ────────────────────────────────
 * `doPost(e)` does not expose request headers — Google has tracked that as an
 * open feature request (issuetracker.google.com/issues/67764685) — so the
 * signature would have been invisible here. `e.parameter` (query string) and
 * `e.postData.contents` (raw body) both work, so the sender signs the raw body
 * and passes `ts` + `sig` as query parameters.
 *
 * ── Duplicate safety ────────────────────────────────────────────────────────
 * The Appointment ID column is the key. A row is appended only when that ID is
 * absent, so a retry — or a retry after a response was lost in transit — cannot
 * create a second row. A script lock serialises concurrent writes so two
 * simultaneous bookings cannot interleave.
 */

/** Column order. MUST match SHEET_COLUMNS in src/server/services/google-sheets.ts. */
var COLUMNS = [
  'Appointment ID',
  'Booking Created At',
  'Patient Name',
  'Phone',
  'Email',
  'Appointment Type',
  'Service',
  'Appointment Date',
  'Appointment Time',
  'Address',
  'Status',
  'Notes',
];

var SHEET_NAME = 'Appointments';

/** Reject anything older than this, so a leaked URL stops working quickly. */
var MAX_SKEW_MS = 5 * 60 * 1000;

/* ── Setup helper (run once by hand) ─────────────────────────────────────── */

function setupSheet() {
  var sheet = getSheet_();
  return 'Ready: "' + sheet.getName() + '" has ' + sheet.getLastRow() + ' row(s).';
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No spreadsheet. Set SPREADSHEET_ID or bind this script to a sheet.');
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Run this by hand when setup looks done but nothing reaches the sheet.
 *
 * Selecting `setupSheet` and clicking Run only ever prints "Execution completed"
 * — the editor does not show a function's return value — so a run gives you no
 * evidence either way. This prints a real checklist to the Execution log
 * instead. It never prints the secret, only its length and first 4 characters,
 * so the output is safe to screenshot or share.
 */
function diagnose() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('SHEET_WEBHOOK_SECRET');

  Logger.log('=== QUALITY Hearing Care — webhook self-check ===');

  if (!secret) {
    Logger.log('✘ SHEET_WEBHOOK_SECRET is MISSING — every request will fail.');
    Logger.log('  Project Settings → Script properties → add SHEET_WEBHOOK_SECRET.');
  } else if (secret.length !== 64) {
    Logger.log('✘ SHEET_WEBHOOK_SECRET is ' + secret.length + ' chars, expected 64.');
    Logger.log('  Check for a stray space or a partial paste.');
  } else {
    Logger.log('✔ SHEET_WEBHOOK_SECRET set (' + secret.length + ' chars), starts ' + secret.substring(0, 4) + '…');
    Logger.log('  It must be IDENTICAL to GOOGLE_SHEETS_WEBHOOK_SECRET on the server.');
  }

  var id = props.getProperty('SPREADSHEET_ID');
  Logger.log(id ? '✔ SPREADSHEET_ID set explicitly.' : '· No SPREADSHEET_ID — using the bound spreadsheet.');

  var ss = null;
  try {
    ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (!ss) {
    Logger.log('✘ No spreadsheet reachable — bind this script to the sheet, or set SPREADSHEET_ID.');
    return;
  }
  Logger.log('✔ Spreadsheet: "' + ss.getName() + '"');

  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('✘ No tab named "' + SHEET_NAME + '" — run setupSheet() first.');
    return;
  }
  Logger.log('✔ Tab "' + SHEET_NAME + '" present, ' + Math.max(0, sheet.getLastRow() - 1) + ' appointment row(s).');

  var header = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  var wrong = [];
  for (var i = 0; i < COLUMNS.length; i++) {
    if (String(header[i] || '') !== COLUMNS[i]) {
      wrong.push('col ' + (i + 1) + ': expected "' + COLUMNS[i] + '", found "' + header[i] + '"');
    }
  }
  if (wrong.length) {
    Logger.log('✘ Header row does not match. Delete row 1, then run setupSheet():');
    wrong.forEach(function (w) {
      Logger.log('    - ' + w);
    });
  } else {
    Logger.log('✔ Header row matches all 12 columns.');
  }

  Logger.log('Next: Deploy → New deployment → Web app (Execute as: Me, access: Anyone),');
  Logger.log('then run `npm run verify:sheets` against the /exec URL.');
}

/* ── Entry point ─────────────────────────────────────────────────────────── */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('SHEET_WEBHOOK_SECRET');
    if (!secret) return json_({ ok: false, error: 'Server is not configured (no secret).' });

    // Raw body text — exactly what was signed. Do not re-serialise before
    // verifying, or the signature will not match.
    var raw = e && e.postData && e.postData.contents;
    if (!raw) return json_({ ok: false, error: 'Empty request body.' });

    var params = (e && e.parameter) || {};
    var ts = params.ts;
    var sig = params.sig;
    if (!ts || !sig) return json_({ ok: false, error: 'Missing signature.' });

    var sentAt = new Date(ts).getTime();
    if (isNaN(sentAt)) return json_({ ok: false, error: 'Bad timestamp.' });
    if (Math.abs(Date.now() - sentAt) > MAX_SKEW_MS) {
      return json_({ ok: false, error: 'Signature expired.' });
    }

    var expected = hmacHex_(secret, ts + '.' + raw);
    if (!constantTimeEquals_(expected, String(sig))) {
      return json_({ ok: false, error: 'Invalid signature.' });
    }

    var payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      return json_({ ok: false, error: 'Body is not valid JSON.' });
    }

    var row = payload && payload.row;
    if (!row || typeof row !== 'object') return json_({ ok: false, error: 'Missing row.' });

    // Required fields only — never invent a patient's details.
    var missing = [];
    ['Appointment ID', 'Patient Name', 'Appointment Type'].forEach(function (field) {
      if (!row[field]) missing.push(field);
    });
    if (missing.length) {
      return json_({ ok: false, error: 'Missing required field(s): ' + missing.join(', ') });
    }

    // Serialise the append so two simultaneous bookings cannot interleave.
    if (!lock.tryLock(30000)) return json_({ ok: false, error: 'Server busy, please retry.' });

    var sheet = getSheet_();
    var id = String(row['Appointment ID']);

    if (existingIds_(sheet).indexOf(id) !== -1) {
      // Already mirrored. This is the duplicate guard, and it also covers the
      // case where our append succeeded but the response never reached the app.
      return json_({ ok: true, duplicated: true, appointmentId: id });
    }

    sheet.appendRow(
      COLUMNS.map(function (name) {
        return row[name] === undefined || row[name] === null ? '' : String(row[name]);
      }),
    );

    return json_({ ok: true, appended: true, appointmentId: id });
  } catch (err) {
    // Safe error text only — no spreadsheet ids, no secrets, no stack traces.
    return json_({ ok: false, error: 'Server error: ' + (err && err.message ? err.message : 'unknown') });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignored) {
      /* lock was never taken */
    }
  }
}

/** Replies to a GET so a browser visit makes the deployed state obvious. */
function doGet() {
  return json_({ ok: true, service: 'QUALITY Hearing Care appointment webhook' });
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Every Appointment ID currently in column A, as strings. */
function existingIds_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet
    .getRange(2, 1, last - 1, 1)
    .getValues()
    .map(function (r) {
      return String(r[0]);
    });
}

function hmacHex_(secret, message) {
  var bytes = Utilities.computeHmacSha256Signature(message, secret);
  return bytes
    .map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');
}

/** Length-safe, value-agnostic comparison. */
function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
