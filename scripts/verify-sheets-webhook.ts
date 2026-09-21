/**
 * Live setup check — the REAL Google Sheets webhook.
 * Run: npm run verify:sheets
 *
 * `npm run test:sheets` proves our side of the contract against a local
 * receiver. It cannot prove anything about the clinic's actual spreadsheet,
 * because deploying the Apps Script needs the clinic's Google account.
 *
 * This script closes that gap. It talks to whichever webhook
 * GOOGLE_SHEETS_WEBHOOK_URL points at — i.e. the deployed Apps Script — and
 * answers the only question that matters after setup: *will a real booking
 * actually land as a row?*
 *
 * It touches no database and creates no appointment: it signs and sends one
 * obviously-marked test row, plus the negative cases, then tells you to delete
 * that row. Safe to run repeatedly — the duplicate check is part of the point.
 */

import { randomBytes } from "node:crypto";
import { loadLocalEnv } from "./load-local-env";
import { signPayload, SHEET_COLUMNS } from "../src/server/services/google-sheets";

loadLocalEnv();

const TIMEOUT_MS = Number(process.env.GOOGLE_SHEETS_TIMEOUT_MS ?? 8000);

const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() ?? "";
const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim() ?? "";

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass += 1;
    console.log(`  \u2714 ${name}`);
  } else {
    fail += 1;
    console.error(`  \u2718 ${name}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}

/** Non-fatal: worth telling the operator, but not a failed check. */
function note(message: string) {
  console.log(`  \u2139 ${message}`);
}

/* ── Preconditions ──────────────────────────────────────────────────────── */

function preflight(): boolean {
  console.log("\nConfiguration");
  if (!url || !secret) {
    console.error(
      "\n  Neither/both of GOOGLE_SHEETS_WEBHOOK_URL and GOOGLE_SHEETS_WEBHOOK_SECRET is set.\n" +
        "  Set both (in .env locally, or Netlify for production) and try again.\n" +
        "  Setup steps: docs/google-sheets/README.md\n",
    );
    return false;
  }
  check("GOOGLE_SHEETS_WEBHOOK_URL is set", true);
  check("GOOGLE_SHEETS_WEBHOOK_SECRET is set", true);

  // /dev only works while signed in to Google, so it would pass here and fail
  // for every real booking.
  check(
    "URL is an /exec deployment, not /dev",
    url.includes("/exec"),
    "/dev URLs only work while you are signed into Google \u2014 use the /exec URL",
  );
  return true;
}

/* ── HTTP helpers ───────────────────────────────────────────────────────── */

type Probe = { status: number; text: string; json: Record<string, unknown> | null };

async function get(): Promise<Probe | { error: string }> {
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(TIMEOUT_MS) });
    const text = await res.text();
    return { status: res.status, text, json: safeJson(text) };
  } catch (err) {
    return { error: describe(err) };
  }
}

async function post(body: string, ts: string, sig: string): Promise<Probe | { error: string }> {
  const endpoint = new URL(url);
  endpoint.searchParams.set("ts", ts);
  endpoint.searchParams.set("sig", sig);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Apps Script answers a POST with a 302 to a one-time result URL.
      redirect: "follow",
    });
    const text = await res.text();
    return { status: res.status, text, json: safeJson(text) };
  } catch (err) {
    return { error: describe(err) };
  }
}

function safeJson(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function describe(err: unknown): string {
  return err instanceof Error && err.name === "TimeoutError"
    ? `timed out after ${TIMEOUT_MS}ms`
    : err instanceof Error
      ? err.message
      : String(err);
}

/** A row that is unmistakably not a real patient. */
function setupRow() {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return {
    "Appointment ID": `QHC-SETUPCHECK-${stamp}`,
    "Booking Created At": `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)} setup check`,
    "Patient Name": "SETUP CHECK \u2014 delete me",
    Phone: "0000000000",
    Email: "",
    "Appointment Type": "Clinic Visit",
    Service: "Setup verification (not a real booking)",
    "Appointment Date": "",
    "Appointment Time": "",
    Address: "Setup check \u2014 safe to delete",
    Status: "Test",
    Notes: "Sent by npm run verify:sheets. Delete this row.",
  };
}

/* ── Main ───────────────────────────────────────────────────────────────── */

async function main() {
  console.log("\nQUALITY Hearing Care \u2014 live webhook check");
  console.log("Target:", url || "(not set)");

  if (!preflight()) {
    process.exitCode = 1;
    return;
  }

  /* 1. Is the deployment reachable at all? */
  console.log("\n1. Deployment reachable");
  const probe = await get();
  if ("error" in probe) {
    check("GET /exec responds", false, probe.error);
    console.error(
      "\n  Could not reach the deployment. Check the URL, and that the web app is\n" +
        '  deployed with "Who has access: Anyone".\n',
    );
    process.exitCode = 1;
    return;
  }
  check("GET /exec responds", probe.status === 200, `HTTP ${probe.status}`);
  // `doGet` answers JSON. An HTML page means we were bounced to a Google sign-in,
  // which is exactly what "access: Anyone" prevents.
  check(
    "Response is our script's JSON, not a Google sign-in page",
    probe.json?.ok === true && typeof probe.json?.service === "string",
    `got ${probe.json ? JSON.stringify(probe.json) : probe.text.slice(0, 100)}`,
  );
  if (probe.json?.ok === true) note(`Script reports: ${String(probe.json.service)}`);

  /* 2. Are unsigned and badly-signed requests actually refused? */
  console.log("\n2. Unauthorized requests are refused");
  const unsignedBody = JSON.stringify({ sheet: "Appointments", row: setupRow() });
  const t1 = new Date().toISOString();
  const unsigned = await post(unsignedBody, t1, "0".repeat(64));
  check(
    "wrongly-signed request is rejected",
    "json" in unsigned && unsigned.json?.ok === false,
    "json" in unsigned ? JSON.stringify(unsigned.json) : unsigned.error,
  );

  const t2 = new Date().toISOString();
  const forged = await post(unsignedBody, t2, signPayload(randomBytes(32).toString("hex"), t2, unsignedBody));
  check(
    "request signed with the wrong secret is rejected",
    "json" in forged && forged.json?.ok === false,
    "json" in forged ? JSON.stringify(forged.json) : forged.error,
  );

  /* 3. Does a valid request append the row? */
  console.log("\n3. A valid request appends exactly one row");
  const row = setupRow();
  const body = JSON.stringify({ sheet: "Appointments", row });
  const ts3 = new Date().toISOString();
  const signed = await post(body, ts3, signPayload(secret, ts3, body));
  const signedOk = "json" in signed && signed.json?.ok === true;
  check(
    "validly-signed request accepted",
    signedOk,
    "json" in signed ? JSON.stringify(signed.json) : signed.error,
  );
  if (signedOk) {
    check("row was appended (not silently dropped)", signed.json?.appended === true);
    note(`Row written: ${row["Appointment ID"]}`);
  }
  if (!signedOk && "json" in signed && typeof signed.json?.error === "string") {
    note(`Script said: ${signed.json.error}`);
  }

  /* 4. Does a re-send avoid a second row? */
  console.log("\n4. Re-sending the same appointment does not duplicate");
  const ts4 = new Date().toISOString();
  const again = await post(body, ts4, signPayload(secret, ts4, body));
  check(
    "second send is refused as a duplicate",
    "json" in again && again.json?.ok === true && again.json?.duplicated === true,
    "json" in again ? JSON.stringify(again.json) : again.error,
  );

  /* 5. Column order sanity — the receiver writes what it is given. */
  console.log("\n5. Row shape");
  check("12 columns as the sheet expects", SHEET_COLUMNS.length === 12, `${SHEET_COLUMNS.length}`);

  /* Summary */
  console.log(`\n${pass} passed, ${fail} failed\n`);
  if (fail === 0) {
    console.log(
      "The Google side is live. Now book a real appointment on the site and confirm\n" +
        "exactly one row appears with a matching Appointment ID — and delete the\n" +
        `SETUP CHECK row (${row["Appointment ID"]}).\n`,
    );
  } else {
    console.log("Fix the failures above, then re-run: npm run verify:sheets\n");
    process.exitCode = 1;
  }
}

void main();
