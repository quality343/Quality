import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/server/db/prisma";

/**
 * Google Sheets appointment sync — a SECONDARY reporting copy.
 *
 * Turso is the source of truth. This module never creates, mutates or deletes an
 * appointment, and nothing here may ever fail a booking: the booking is already
 * committed by the time we are called, and the visitor is waiting for a
 * confirmation. A sheet that is unreachable is an operational annoyance; a lost
 * appointment is not acceptable. So every failure path here:
 *
 *   1. leaves the appointment exactly as Turso has it,
 *   2. records why it failed on the row (`googleSheetSyncError`), and
 *   3. leaves it retryable from the admin dashboard.
 *
 * ── How the write happens ───────────────────────────────────────────────────
 * A Google Apps Script Web App acts as the endpoint (see
 * `docs/google-sheets/appointments-webhook.gs`). There are no Google
 * credentials anywhere in this application: no service account, no private key,
 * no OAuth token. The only thing we hold is a webhook URL and a shared secret,
 * both server-side environment variables.
 *
 * Requests are signed: `sig` = HMAC-SHA256(`${ts}.${rawBody}`) keyed by
 * `GOOGLE_SHEETS_WEBHOOK_SECRET`, with `ts` alongside so the receiver can reject
 * replays. Without the secret a caller cannot forge a valid signature, so random
 * visitors cannot inject rows into the spreadsheet.
 *
 * `ts` and `sig` travel in the QUERY STRING, not in request headers, and that is
 * deliberate: an Apps Script Web App's `doPost(e)` event does not expose request
 * headers at all — Google has tracked that as an open feature request for years
 * (issuetracker.google.com/issues/67764685). Signing headers would have produced
 * a receiver that rejected every request. `e.parameter` and
 * `e.postData.contents` *are* populated, so the signature goes in the query and
 * is computed over the raw body text.
 *
 * The query string carries only a timestamp and a signature — never the secret —
 * and the receiver accepts nothing older than a few minutes, so a leaked URL is
 * useless once it expires. The signature is still sent in headers as well, so
 * that a future receiver (or a debugging proxy) can read it the conventional
 * way; the Apps Script simply ignores them.
 *
 * ── Idempotency ─────────────────────────────────────────────────────────────
 * Two layers, because duplicates in a spreadsheet are silently corrosive:
 *   - here: an appointment already marked SYNCED is skipped unless explicitly
 *     retried with `force`;
 *   - there: the Apps Script looks up the Appointment ID column and appends only
 *     if it is absent, which also covers a response lost after a successful
 *     append.
 */

/** Sync lifecycle. NULL (never attempted) is represented by an unset column. */
export type SheetSyncStatus = "PENDING" | "SYNCED" | "FAILED";

/** The exact column order the spreadsheet expects (see docs/google-sheets). */
export const SHEET_COLUMNS = [
  "Appointment ID",
  "Booking Created At",
  "Patient Name",
  "Phone",
  "Email",
  "Appointment Type",
  "Service",
  "Appointment Date",
  "Appointment Time",
  "Address",
  "Status",
  "Notes",
] as const;

export type SheetRow = Record<(typeof SHEET_COLUMNS)[number], string>;

/** Shape of the JSON the Apps Script webhook answers with. */
type WebhookResponse = {
  ok?: boolean;
  error?: string;
  /** True when the row already existed and was not appended again. */
  duplicated?: boolean;
};

const CLINIC_TZ = "Asia/Kolkata";
const TIMEOUT_MS = Number(process.env.GOOGLE_SHEETS_TIMEOUT_MS ?? 8000);
const MAX_ERROR_LEN = 300;

/** True when both the webhook URL and the shared secret are configured. */
export function isSheetSyncConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() &&
      process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim(),
  );
}

/* ── Formatting ─────────────────────────────────────────────────── */

type IstParts = { date: string; time: string; stamp: string };

/** Render an instant in the clinic's timezone, in sheet-friendly columns. */
function istParts(at: Date): IstParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const y = get("year");
  const mo = get("month");
  const d = get("day");
  const h24 = Number(get("hour")) % 24;
  const mi = get("minute");

  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const date = `${y}-${mo}-${d}`;
  const time = `${h12}:${mi} ${suffix}`;
  return { date, time, stamp: `${date} ${h12}:${mi} ${suffix}` };
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Home consultations carry their preferred date and window inside `reason`,
 * written by `bookGuestAppointment` as:
 *   `Preferred: 2026-09-24 (morning) — optional note`
 *
 * Parsing our own string is not ideal, and a future phase should promote these
 * to real columns; until then it is read defensively and simply yields blanks
 * rather than a wrong value if the format ever changes.
 */
function parseHomePreference(reason: string | null): { date: string; window: string; note: string } {
  if (!reason) return { date: "", window: "", note: "" };
  const m = reason.match(/^Preferred:\s*(\d{4}-\d{2}-\d{2})\s*\(([a-z]+)\)\s*(?:—\s*(.*))?$/i);
  if (!m) return { date: "", window: "", note: reason };
  return { date: m[1], window: titleCase(m[2]), note: (m[3] ?? "").trim() };
}

/* ── Payload ────────────────────────────────────────────────────── */

/**
 * Branch address for the sheet. The stored address is usually the full postal
 * address, city included, so the city is appended only when it is not already
 * there — otherwise the row reads "… Hyderabad 500072, India, Hyderabad".
 */
function branchAddress(branch: { address: string | null; city: string | null }): string {
  const address = branch.address?.trim() ?? "";
  const city = branch.city?.trim() ?? "";
  if (!address) return city;
  if (!city) return address;
  return address.toLowerCase().includes(city.toLowerCase()) ? address : `${address}, ${city}`;
}

type AppointmentWithRelations = {
  id: string;
  bookingRef: string | null;
  status: string;
  appointmentType: string;
  reason: string | null;
  homeAddress: string | null;
  homeLocality: string | null;
  homeInstructions: string | null;
  homeConfirmationStatus: string | null;
  createdAt: Date;
  patient: { name: string | null; phone: string | null; email: string | null };
  service: { name: string };
  branch: { name: string; address: string | null; city: string | null };
  slot: { startsAt: Date } | null;
};

/** Build the spreadsheet row for an appointment. Pure — safe to unit test. */
export function buildSheetRow(a: AppointmentWithRelations): SheetRow {
  const isHome = a.appointmentType === "HOME_CONSULTATION";
  const preference = isHome ? parseHomePreference(a.reason) : { date: "", window: "", note: "" };

  const created = istParts(a.createdAt);
  const start = a.slot ? istParts(a.slot.startsAt) : null;

  // Clinic visits use the branch's own address from the database — never a
  // hardcoded string, so a change of premises flows through automatically.
  const clinicAddress = branchAddress(a.branch);
  const address = isHome
    ? [a.homeAddress, a.homeLocality].filter(Boolean).join(", ")
    : clinicAddress;

  const notes: string[] = [];
  if (preference.note) notes.push(preference.note);
  if (a.homeInstructions) notes.push(`Instructions: ${a.homeInstructions}`);
  if (isHome && a.homeConfirmationStatus) {
    notes.push(`Home confirmation: ${titleCase(a.homeConfirmationStatus)}`);
  }
  if (!isHome && a.reason) notes.push(a.reason);

  return {
    /* The booking reference is the appointment's public, unique identifier
       (QHC-XXXXXXXX). Staff-created appointments may not have one, so fall back
       to the internal id — either way it is the dedupe key for the sheet. */
    "Appointment ID": a.bookingRef ?? a.id,
    "Booking Created At": created.stamp,
    "Patient Name": a.patient.name ?? "Guest",
    Phone: a.patient.phone ?? "",
    Email: a.patient.email ?? "",
    "Appointment Type": isHome ? "Home Consultation" : "Clinic Visit",
    Service: a.service.name,
    "Appointment Date": isHome ? preference.date : (start?.date ?? ""),
    "Appointment Time": isHome ? preference.window : (start?.time ?? ""),
    Address: address,
    Status: titleCase(a.status),
    Notes: notes.join(" · "),
  };
}

/* ── Signing ────────────────────────────────────────────────────── */

/** HMAC-SHA256 of `${timestamp}.${body}`, hex. Exported so tests can verify. */
export function signPayload(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/**
 * JSON with every non-ASCII character escaped as `\uXXXX`.
 *
 * This is not cosmetic — it is what makes the signature verifiable at all.
 *
 * The receiver checks the HMAC over the RAW body text, so its copy of that text
 * has to be byte-identical to ours. It is not, when the body contains non-ASCII
 * characters: Apps Script's `e.postData.contents` does not hand back the
 * UTF-8-decoded string, so a single `—` (three UTF-8 bytes) arrives as three
 * characters instead of one and every signature over it fails.
 *
 * That failure is invisible on a purely ASCII body, which is why it survived the
 * local test suite — the local receiver decodes UTF-8 correctly, exactly as we
 * do, so it agreed with a mistake made on both sides. The first live request
 * that carried a non-ASCII character (a middle dot in the notes separator, or
 * any patient name or address outside ASCII) would have failed to mirror.
 *
 * Escaping to `\uXXXX` makes the body pure ASCII, so both sides hash the same
 * bytes no matter how either one treats multi-byte input. `JSON.parse` in the
 * Apps Script restores the original characters, so the spreadsheet still shows
 * the real name and address.
 */
function asciiJson(value: unknown): string {
  return JSON.stringify(value).replace(
    /[\u0080-\uffff]/g,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

/**
 * The exact body we sign and send. Exported so tests can assert it is ASCII-only
 * — the invariant that keeps the signature valid.
 */
export function buildWebhookBody(row: SheetRow): string {
  return asciiJson({ sheet: "Appointments", row });
}

/** Constant-time signature comparison (mirrors the Apps Script's check). */
export function signatureMatches(secret: string, timestamp: string, body: string, provided: string): boolean {
  const expected = signPayload(secret, timestamp, body);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/* ── Sync ───────────────────────────────────────────────────────── */

export type SyncResult =
  | { ok: true; status: "SYNCED"; skipped?: false; row: SheetRow }
  | { ok: true; status: "SYNCED"; skipped: true; reason: string }
  | { ok: false; status: "FAILED" | "DISABLED"; error: string };

const DETAIL = {
  patient: { select: { name: true, phone: true, email: true } },
  service: { select: { name: true } },
  branch: { select: { name: true, address: true, city: true } },
  slot: { select: { startsAt: true } },
} as const;

/**
 * Push one appointment to the spreadsheet.
 *
 * Never throws: the caller is a booking action, and a spreadsheet problem must
 * not surface as a failed booking. Returns a result so callers (and the admin
 * retry action) can report what happened.
 */
export async function syncAppointmentToSheet(
  appointmentId: string,
  options: { force?: boolean } = {},
): Promise<SyncResult> {
  if (!isSheetSyncConfigured()) {
    // Not a failure: the integration is simply switched off. Leave the status
    // untouched so the dashboard shows "Not configured" rather than red.
    return { ok: false, status: "DISABLED", error: "Google Sheets sync is not configured." };
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        bookingRef: true,
        status: true,
        appointmentType: true,
        reason: true,
        homeAddress: true,
        homeLocality: true,
        homeInstructions: true,
        homeConfirmationStatus: true,
        createdAt: true,
        googleSheetSyncStatus: true,
        ...DETAIL,
      },
    });

    if (!appointment) {
      return { ok: false, status: "FAILED", error: "Appointment not found." };
    }

    // Already there: do not append a second row.
    if (!options.force && appointment.googleSheetSyncStatus === "SYNCED") {
      return { ok: true, status: "SYNCED", skipped: true, reason: "Already synced." };
    }

    const row = buildSheetRow(appointment as AppointmentWithRelations);

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { googleSheetSyncStatus: "PENDING" },
    });

    const body = buildWebhookBody(row);
    const timestamp = new Date().toISOString();
    const signature = signPayload(
      process.env.GOOGLE_SHEETS_WEBHOOK_SECRET!.trim(),
      timestamp,
      body,
    );

    const endpoint = new URL(process.env.GOOGLE_SHEETS_WEBHOOK_URL!.trim());
    endpoint.searchParams.set("ts", timestamp);
    endpoint.searchParams.set("sig", signature);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-qhc-timestamp": timestamp,
          "x-qhc-signature": signature,
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        // Apps Script Web Apps answer a POST with a 302 to a one-time result
        // URL; following it is required to read the JSON body.
        redirect: "follow",
      });
    } catch (err) {
      const message =
        err instanceof Error && err.name === "TimeoutError"
          ? `Timed out after ${TIMEOUT_MS}ms`
          : `Request failed: ${err instanceof Error ? err.message : String(err)}`;
      return await recordFailure(appointmentId, message);
    }

    const text = await response.text().catch(() => "");

    if (!response.ok) {
      return await recordFailure(appointmentId, `HTTP ${response.status}: ${text.slice(0, 120)}`);
    }

    // The receiver answers JSON; anything else means we did not reach our script
    // (a captive portal or an HTML error page would otherwise look like success).
    let payload: WebhookResponse;
    try {
      payload = JSON.parse(text) as WebhookResponse;
    } catch {
      return await recordFailure(appointmentId, `Unexpected non-JSON response: ${text.slice(0, 120)}`);
    }

    if (!payload?.ok) {
      return await recordFailure(appointmentId, payload?.error ?? "Receiver reported a failure.");
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        googleSheetSyncStatus: "SYNCED",
        googleSheetSyncedAt: new Date(),
        googleSheetSyncError: null,
      },
    });

    return { ok: true, status: "SYNCED", row };
  } catch (err) {
    // Last resort — a bug in here must never propagate into the booking action.
    const message = err instanceof Error ? err.message : String(err);
    try {
      return await recordFailure(appointmentId, `Unexpected error: ${message}`);
    } catch {
      return { ok: false, status: "FAILED", error: "Unexpected error while syncing." };
    }
  }
}

/** Record a sync failure on the row without touching the appointment itself. */
async function recordFailure(appointmentId: string, message: string): Promise<SyncResult> {
  const error = message.slice(0, MAX_ERROR_LEN);
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { googleSheetSyncStatus: "FAILED", googleSheetSyncError: error },
  });
  console.error("[google-sheets] sync failed", { appointmentId, error });
  return { ok: false, status: "FAILED", error };
}

/**
 * Retry a failed or pending sync. `force` is set so an appointment already
 * marked SYNCED can be re-sent deliberately; the Apps Script still refuses to
 * append a second row for the same Appointment ID.
 */
export async function retryAppointmentSheetSync(appointmentId: string): Promise<SyncResult> {
  return syncAppointmentToSheet(appointmentId, { force: true });
}
