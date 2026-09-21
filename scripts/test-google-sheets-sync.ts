/**
 * Integration test — appointment → Google Sheets mirror.
 * Run: npx tsx scripts/test-google-sheets-sync.ts
 *
 * Stands up a local receiver that re-implements the Apps Script contract
 * (signature check over the RAW body, 5-minute freshness window, dedupe on
 * Appointment ID) exactly as `docs/google-sheets/appointments-webhook.gs` does,
 * points the real sync service at it, and asserts the row that would land in the
 * spreadsheet. Creates and deletes its own fixtures — no real booking data is
 * touched. The live Google Sheet itself cannot be tested from here: that needs
 * the clinic's Google account to deploy the web app.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHmac, randomBytes } from "node:crypto";
import { createPrismaClient } from "./db";
import {
  buildSheetRow,
  buildWebhookBody,
  isSheetSyncConfigured,
  retryAppointmentSheetSync,
  SHEET_COLUMNS,
  syncAppointmentToSheet,
} from "../src/server/services/google-sheets";

const prisma = createPrismaClient();

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass += 1;
    console.log(`  ✔ ${name}`);
  } else {
    fail += 1;
    console.error(`  ✘ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const SECRET = randomBytes(32).toString("hex");
let WEBHOOK_URL = "";

/* ── Receiver emulating the Apps Script ────────────────────────────────── */

type Received = { ts: string; sig: string; raw: string; row: Record<string, string> };
const appended: Record<string, string>[] = [];
const received: Received[] = [];
const rejections: string[] = [];

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

function json(res: ServerResponse, body: unknown) {
  // Apps Script always answers 200; the payload carries the outcome.
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");

  const ts = url.searchParams.get("ts") ?? "";
  const sig = url.searchParams.get("sig") ?? "";

  if (!raw) return json(res, { ok: false, error: "Empty request body." });
  if (!ts || !sig) {
    rejections.push("Missing signature.");
    return json(res, { ok: false, error: "Missing signature." });
  }
  const sentAt = new Date(ts).getTime();
  if (Number.isNaN(sentAt)) return json(res, { ok: false, error: "Bad timestamp." });
  if (Math.abs(Date.now() - sentAt) > 5 * 60 * 1000) {
    rejections.push("Signature expired.");
    return json(res, { ok: false, error: "Signature expired." });
  }
  if (hmacHex(SECRET, `${ts}.${raw}`) !== sig) {
    rejections.push("Invalid signature.");
    return json(res, { ok: false, error: "Invalid signature." });
  }

  const payload = JSON.parse(raw) as { sheet?: string; row?: Record<string, string> };
  const row = payload.row;
  if (!row) return json(res, { ok: false, error: "Missing row." });

  const missing = ["Appointment ID", "Patient Name", "Appointment Type"].filter((f) => !row[f]);
  if (missing.length) {
    return json(res, { ok: false, error: `Missing required field(s): ${missing.join(", ")}` });
  }

  received.push({ ts, sig, raw, row });

  const id = String(row["Appointment ID"]);
  if (appended.some((r) => r["Appointment ID"] === id)) {
    return json(res, { ok: true, duplicated: true, appointmentId: id });
  }
  appended.push(row);
  return json(res, { ok: true, appended: true, appointmentId: id });
}

/* ── Fixtures ──────────────────────────────────────────────────────────── */

const TAG = `sheet-test-${randomBytes(3).toString("hex")}`;
const createdAppointmentIds: string[] = [];
const createdPatientIds: string[] = [];

async function makePatient(name: string, phone: string) {
  const p = await prisma.patient.create({
    data: { name, phone, isGuest: true, mrn: `${TAG}-${phone.slice(-4)}` },
  });
  createdPatientIds.push(p.id);
  return p;
}

const createdSlotIds: string[] = [];

/** A real slot, so the clinic path renders date/time from the database. */
async function makeSlot(branchId: string, serviceId: string, startsAt: Date) {
  const slot = await prisma.appointmentSlot.create({
    data: {
      branchId,
      serviceId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
      status: "BOOKED",
    },
  });
  createdSlotIds.push(slot.id);
  return slot;
}

async function makeAppointment(opts: {
  patientId: string;
  serviceId: string;
  branchId: string;
  type: "CLINIC_VISIT" | "HOME_CONSULTATION";
  reason?: string;
  homeAddress?: string;
  homeLocality?: string;
  bookingRef?: string;
  slotId?: string;
}) {
  const a = await prisma.appointment.create({
    data: {
      patientId: opts.patientId,
      serviceId: opts.serviceId,
      branchId: opts.branchId,
      slotId: opts.slotId ?? null,
      appointmentType: opts.type,
      status: "BOOKED",
      reason: opts.reason ?? null,
      homeAddress: opts.homeAddress ?? null,
      homeLocality: opts.homeLocality ?? null,
      homeInstructions: opts.type === "HOME_CONSULTATION" ? "Ring the bell twice" : null,
      homeConfirmationStatus: opts.type === "HOME_CONSULTATION" ? "PENDING_CONFIRMATION" : null,
      bookingRef: opts.bookingRef,
    },
  });
  createdAppointmentIds.push(a.id);
  return a;
}

async function cleanup() {
  if (createdAppointmentIds.length) {
    await prisma.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
  }
  if (createdPatientIds.length) {
    await prisma.patient.deleteMany({ where: { id: { in: createdPatientIds } } });
  }
  if (createdSlotIds.length) {
    await prisma.appointmentSlot.deleteMany({ where: { id: { in: createdSlotIds } } });
  }
}

/* ── Main ──────────────────────────────────────────────────────────────── */

async function main() {
  const server = createServer((req, res) => {
    handle(req, res).catch(() => json(res, { ok: false, error: "Server error" }));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  WEBHOOK_URL = `http://127.0.0.1:${port}/exec`;

  process.env.GOOGLE_SHEETS_WEBHOOK_URL = WEBHOOK_URL;
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET = SECRET;

  console.log(`\nReceiver: ${WEBHOOK_URL}\n`);

  const service = await prisma.service.findFirstOrThrow({ select: { id: true, name: true } });
  const branch = await prisma.branch.findFirstOrThrow({
    select: { id: true, address: true, city: true },
  });

  console.log("── Configuration ──");
  check("configured when both vars are present", isSheetSyncConfigured() === true);

  /*
   * Body encoding.
   *
   * The receiver checks the HMAC over the RAW body, so its copy of that text must
   * be byte-identical to ours. Apps Script's `e.postData.contents` does NOT
   * UTF-8-decode the body, so a non-ASCII character arrives as several characters
   * and every signature over it fails.
   *
   * These assertions are the ONLY way to catch that, because the receiver running
   * below decodes UTF-8 exactly as we do — it agreed with the bug happily. The
   * live deployment did not, and rejected a row containing a single em dash.
   */
  console.log("\n── Body encoding (signature is over raw text) ──");
  const unicodeRow = buildSheetRow({
    id: "unicode-fixture",
    bookingRef: "QHC-UNICODETEST",
    status: "BOOKED",
    appointmentType: "HOME_CONSULTATION",
    reason: "Preferred: 2026-10-06 (morning) \u2014 steps to the first floor",
    homeAddress: "MIG 215, above RK Collections",
    homeLocality: "Kukatpally Housing Board Colony",
    homeInstructions: "Please ring the bell twice",
    homeConfirmationStatus: "REQUIRES_CONFIRMATION",
    createdAt: new Date("2026-09-21T12:00:00Z"),
    patient: { name: "Ravi Kumar \u2014 \u0930\u0935\u093f", phone: "9966111188", email: null },
    service: { name: "Hearing Assessment" },
    branch: { name: "Kukatpally", address: "MIG 215, KPHB Phase 1", city: "Hyderabad" },
    slot: null,
  });
  const unicodeBody = buildWebhookBody(unicodeRow);

  check("row really does contain non-ASCII text", /[^\x00-\x7F]/.test(unicodeRow["Patient Name"]));
  check("the notes separator is non-ASCII too", /[^\x00-\x7F]/.test(unicodeRow.Notes));
  check(
    "request body is pure ASCII",
    /^[\x00-\x7F]*$/.test(unicodeBody),
    "a non-ASCII byte would break the signature against the live webhook",
  );

  let decoded: { row: Record<string, string> } | null = null;
  try {
    decoded = JSON.parse(unicodeBody) as { row: Record<string, string> };
  } catch {
    decoded = null;
  }
  check("body is still valid JSON", decoded !== null);
  check(
    "non-ASCII characters survive the round trip",
    decoded?.row["Patient Name"] === unicodeRow["Patient Name"],
    `got ${JSON.stringify(decoded?.row["Patient Name"])}`,
  );
  check(
    "the middle-dot separator survives too",
    decoded?.row.Notes === unicodeRow.Notes,
    `got ${JSON.stringify(decoded?.row.Notes)}`,
  );

  /* TEST 1 — clinic visit */
  console.log("\n── TEST 1: clinic appointment ──");
  const clinicPatient = await makePatient("Sheet Test Clinic", "9000000001");
  // 2026-10-06 09:30 UTC = 3:00 pm IST. Fixed instant, so the assertion is exact
  // regardless of where this test runs.
  const clinicSlot = await makeSlot(branch.id, service.id, new Date("2026-10-06T09:30:00Z"));
  const clinic = await makeAppointment({
    patientId: clinicPatient.id,
    serviceId: service.id,
    branchId: branch.id,
    type: "CLINIC_VISIT",
    reason: "Trouble hearing in the left ear",
    slotId: clinicSlot.id,
    bookingRef: `QHC-${randomBytes(4).toString("hex").toUpperCase()}`,
  });

  const r1 = await syncAppointmentToSheet(clinic.id);
  check("sync reports success", r1.ok === true, JSON.stringify(r1));
  check("exactly one row appended", appended.length === 1);
  check("row uses the booking reference as the ID", appended[0]?.["Appointment ID"] === clinic.bookingRef);

  const dbAfter1 = await prisma.appointment.findUniqueOrThrow({
    where: { id: clinic.id },
    select: { googleSheetSyncStatus: true, googleSheetSyncedAt: true, googleSheetSyncError: true },
  });
  check("appointment marked SYNCED", dbAfter1.googleSheetSyncStatus === "SYNCED");
  check("synced timestamp recorded", dbAfter1.googleSheetSyncedAt !== null);
  check("no error recorded", dbAfter1.googleSheetSyncError === null);

  /* TEST 3 — idempotency */
  console.log("\n── TEST 3: retry must not duplicate ──");
  const r3a = await syncAppointmentToSheet(clinic.id);
  check("re-sync is skipped without force", r3a.ok === true && "skipped" in r3a && r3a.skipped === true);
  check("still exactly one row", appended.length === 1);

  const r3b = await retryAppointmentSheetSync(clinic.id);
  check("forced retry reaches the receiver", r3b.ok === true);
  check("receiver reports it as a duplicate", appended.length === 1, `${appended.length} rows`);
  check("no second row appended", appended.length === 1);

  /* TEST 2 — home consultation */
  console.log("\n── TEST 2: home consultation ──");
  const homePatient = await makePatient("Sheet Test Home", "9000000002");
  const home = await makeAppointment({
    patientId: homePatient.id,
    serviceId: service.id,
    branchId: branch.id,
    type: "HOME_CONSULTATION",
    reason: "Preferred: 2026-10-05 (morning) — Patient uses a wheelchair",
    homeAddress: "12-3-456/A, Sai Nagar, Road No. 4",
    homeLocality: "Kukatpally",
    bookingRef: `QHC-${randomBytes(4).toString("hex").toUpperCase()}`,
  });

  const r2 = await syncAppointmentToSheet(home.id);
  const homeRow = appended.find((r) => r["Appointment ID"] === home.bookingRef);
  check("home consultation synced", r2.ok === true);
  check("Appointment Type is Home Consultation", homeRow?.["Appointment Type"] === "Home Consultation");
  check("patient's own address is included", homeRow?.Address === "12-3-456/A, Sai Nagar, Road No. 4, Kukatpally", homeRow?.Address);
  check("preferred date parsed from the request", homeRow?.["Appointment Date"] === "2026-10-05", homeRow?.["Appointment Date"]);
  check("preferred window parsed", homeRow?.["Appointment Time"] === "Morning", homeRow?.["Appointment Time"]);
  check("instructions carried into Notes", (homeRow?.Notes ?? "").includes("Ring the bell twice"));
  check("optional note carried into Notes", (homeRow?.Notes ?? "").includes("wheelchair"));

  /* Column contract */
  console.log("\n── Column contract ──");
  check("12 columns", SHEET_COLUMNS.length === 12);
  const keys = Object.keys(appended[0] ?? {});
  check(
    "row keys are in the exact documented order",
    JSON.stringify(keys) === JSON.stringify([...SHEET_COLUMNS]),
    keys.join(" | "),
  );
  check(
    "clinic visit uses the branch address from the database",
    (appended[0]?.Address ?? "").includes(branch.address ?? ""),
    appended[0]?.Address,
  );
  check(
    "city is not repeated when the address already contains it",
    (appended[0]?.Address ?? "").toLowerCase().split("hyderabad").length - 1 <= 1,
    appended[0]?.Address,
  );
  check(
    "city is appended when the address omits it",
    buildSheetRow({
      id: "x",
      bookingRef: "QHC-CITYTEST",
      status: "BOOKED",
      appointmentType: "CLINIC_VISIT",
      reason: null,
      homeAddress: null,
      homeLocality: null,
      homeInstructions: null,
      homeConfirmationStatus: null,
      createdAt: new Date("2026-09-22T04:30:00Z"),
      patient: { name: "City Test", phone: "9000000009", email: null },
      service: { name: "Hearing Assessment" },
      branch: { name: "B", address: "MIG 215, KPHB Phase 1", city: "Hyderabad" },
      slot: null,
    }).Address === "MIG 215, KPHB Phase 1, Hyderabad",
  );
  check("clinic visit dates the slot", appended[0]?.["Appointment Date"] === "2026-10-06", appended[0]?.["Appointment Date"]);
  check("clinic visit times the slot in IST", appended[0]?.["Appointment Time"] === "3:00 pm", appended[0]?.["Appointment Time"]);

  /* Row shaping edge cases (pure) */
  console.log("\n── Row shaping ──");
  const noSlot = buildSheetRow({
    id: "internal-id",
    bookingRef: null,
    status: "BOOKED",
    appointmentType: "CLINIC_VISIT",
    reason: null,
    homeAddress: null,
    homeLocality: null,
    homeInstructions: null,
    homeConfirmationStatus: null,
    createdAt: new Date("2026-09-22T04:30:00Z"),
    patient: { name: null, phone: null, email: null },
    service: { name: "Hearing Assessment" },
    branch: { name: "Kukatpally", address: null, city: "Hyderabad" },
    slot: null,
  });
  check("staff booking without a reference falls back to the internal id", noSlot["Appointment ID"] === "internal-id");
  check("missing patient name becomes a neutral label", noSlot["Patient Name"] === "Guest");
  check("no slot yields blank date/time rather than a wrong one", noSlot["Appointment Date"] === "" && noSlot["Appointment Time"] === "");
  check("created time rendered in IST", noSlot["Booking Created At"] === "2026-09-22 10:00 am", noSlot["Booking Created At"]);
  check("status title-cased", noSlot.Status === "Booked");

  /* TEST 5 — unauthenticated request */
  console.log("\n── TEST 5: unauthenticated webhook request ──");
  const unsigned = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ row: { "Appointment ID": "QHC-FORGED", "Patient Name": "Attacker", "Appointment Type": "Clinic Visit" } }),
  });
  const unsignedBody = (await unsigned.json()) as { ok: boolean; error?: string };
  check("unsigned request rejected", unsignedBody.ok === false, JSON.stringify(unsignedBody));

  const badSig = await fetch(`${WEBHOOK_URL}?ts=${new Date().toISOString()}&sig=${"0".repeat(64)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ row: { "Appointment ID": "QHC-FORGED2", "Patient Name": "Attacker", "Appointment Type": "Clinic Visit" } }),
  });
  const badSigBody = (await badSig.json()) as { ok: boolean };
  check("wrong signature rejected", badSigBody.ok === false);

  const stale = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const staleBody = JSON.stringify({ row: { "Appointment ID": "QHC-STALE", "Patient Name": "Replay", "Appointment Type": "Clinic Visit" } });
  const staleRes = await fetch(`${WEBHOOK_URL}?ts=${stale}&sig=${hmacHex(SECRET, `${stale}.${staleBody}`)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: staleBody,
  });
  const staleJson = (await staleRes.json()) as { ok: boolean; error?: string };
  check("replayed old request rejected", staleJson.ok === false && staleJson.error === "Signature expired.", JSON.stringify(staleJson));
  check("no forged row was written", appended.length === 2, `${appended.length} rows`);
  check("forged attempts recorded as rejections", rejections.length >= 3, rejections.join(" | "));

  /* TEST 4 — spreadsheet unavailable */
  console.log("\n── TEST 4: Google Sheets unavailable ──");
  const failingPort = port + 1;
  process.env.GOOGLE_SHEETS_WEBHOOK_URL = `http://127.0.0.1:${failingPort}/exec`;

  const failurePatient = await makePatient("Sheet Test Offline", "9000000003");
  const offline = await makeAppointment({
    patientId: failurePatient.id,
    serviceId: service.id,
    branchId: branch.id,
    type: "CLINIC_VISIT",
    bookingRef: `QHC-${randomBytes(4).toString("hex").toUpperCase()}`,
  });

  const r4 = await syncAppointmentToSheet(offline.id);
  check("sync reports failure", r4.ok === false && r4.status === "FAILED", JSON.stringify(r4));

  const stillThere = await prisma.appointment.findUnique({
    where: { id: offline.id },
    select: { id: true, status: true, googleSheetSyncStatus: true, googleSheetSyncError: true },
  });
  check("appointment still exists in the database", stillThere !== null);
  check("its booking status is untouched", stillThere?.status === "BOOKED");
  check("sync marked FAILED", stillThere?.googleSheetSyncStatus === "FAILED");
  check("failure reason recorded", Boolean(stillThere?.googleSheetSyncError), stillThere?.googleSheetSyncError ?? "");
  check("no row was appended while the sheet was down", appended.length === 2);

  /* Recovery */
  process.env.GOOGLE_SHEETS_WEBHOOK_URL = WEBHOOK_URL;
  const recovered = await retryAppointmentSheetSync(offline.id);
  check("admin retry succeeds once the receiver is back", recovered.ok === true, JSON.stringify(recovered));
  check("the retry appends exactly one row", appended.length === 3);

  /* Unconfigured must be a no-op, not an error state */
  console.log("\n── Unconfigured deployment ──");
  delete process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  delete process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  check("reports as unconfigured", isSheetSyncConfigured() === false);
  const r5 = await syncAppointmentToSheet(clinic.id);
  check("unconfigured sync is DISABLED, not FAILED", r5.ok === false && r5.status === "DISABLED", JSON.stringify(r5));
  const untouched = await prisma.appointment.findUniqueOrThrow({
    where: { id: clinic.id },
    select: { googleSheetSyncStatus: true },
  });
  check("a disabled integration does not corrupt the last good status", untouched.googleSheetSyncStatus === "SYNCED");

  await new Promise<void>((r) => server.close(() => r()));

  console.log(`\n${"=".repeat(52)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(52)}\n`);
  return fail === 0 ? 0 : 1;
}

main()
  .then(async (code) => {
    await cleanup();
    await prisma.$disconnect();
    process.exit(code);
  })
  .catch(async (err) => {
    console.error("\nFATAL:", err);
    try {
      await cleanup();
    } catch (cleanupErr) {
      console.error("cleanup failed:", cleanupErr);
    }
    await prisma.$disconnect();
    process.exit(1);
  });
