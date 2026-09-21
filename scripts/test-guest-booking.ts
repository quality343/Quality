/**
 * Integration tests for Revised Phase 2 — guest appointment booking.
 * Run: npx tsx scripts/test-guest-booking.ts
 * Creates and cleans up its own fixtures (tagged), no real data touched.
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

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

const TAG = `g${Date.now().toString(36)}`;
const cleanup: { kind: "branch" | "service"; id: string }[] = [];

// Imported service functions under test (run against the same DATABASE_URL).
import {
  bookGuestAppointment,
  getGuestBookingByRefAndToken,
  cancelGuestBooking,
  generateBookingRef,
} from "../src/server/services/scheduling";

function futureSlotDate(daysAhead: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function makeFixture() {
  const branch = await prisma.branch.create({
    data: { code: `GB-${TAG}`, name: "Guest Test Branch", isActive: true, acceptsOnlineBookings: true },
  });
  cleanup.push({ kind: "branch", id: branch.id });
  const service = await prisma.service.create({
    data: { code: `GSVC-${TAG}`, name: "Guest Test Service", category: "HEARING_TEST", durationMinutes: 30, isActive: true },
  });
  cleanup.push({ kind: "service", id: service.id });
  await prisma.branchService.create({
    data: { branchId: branch.id, serviceId: service.id, isActive: true },
  });
  return { branch, service };
}

async function makeSlot(branchId: string, daysAhead: number, hour = 10) {
  const startsAt = futureSlotDate(daysAhead, hour);
  return prisma.appointmentSlot.create({
    data: {
      branchId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 30 * 60_000),
      status: "OPEN",
    },
  });
}

async function cleanupAll() {
  const branchIds = cleanup.filter((c) => c.kind === "branch").map((c) => c.id);
  const serviceIds = cleanup.filter((c) => c.kind === "service").map((c) => c.id);
  await prisma.appointment.deleteMany({ where: { OR: [{ branchId: { in: branchIds } }, { serviceId: { in: serviceIds } }] } });
  await prisma.appointmentSlot.deleteMany({ where: { branchId: { in: branchIds } } });
  await prisma.branchService.deleteMany({ where: { branchId: { in: branchIds } } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Appointment", entityId: { in: await prisma.appointment.findMany({ where: { branchId: { in: branchIds } }, select: { id: true } }).then((rows) => rows.map((r) => r.id)).catch(() => []) } } }).catch(() => {});
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  await prisma.branch.deleteMany({ where: { id: { in: branchIds } } });
  await prisma.patient.deleteMany({ where: { isGuest: true, phone: { startsWith: "9112345" } } });
}

async function main() {
  console.log("— Fixtures —");
  const { branch, service } = await makeFixture();

  console.log("— Guest booking —");
  {
    const slot = await makeSlot(branch.id, 3, 10);
    const result = await bookGuestAppointment({
      appointmentType: "CLINIC_VISIT",
      slotId: slot.id,
      serviceId: service.id,
      name: "  Test Guest  ",
      mobile: "+91 98765 43210",
      email: "guest@test.local",
      note: "First visit",
    });
    check("guest booking succeeds without an account", !!result.appointment.id);
    check("booking ref in QHC-XXXXXXXX form", /^QHC-[0-9A-F]{8}$/.test(result.appointment.bookingRef ?? ""));
    check("manage token returned once", typeof result.manageToken === "string" && result.manageToken.length > 20);
    check("slot flipped to BOOKED", (await prisma.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } })).status === "BOOKED");
    check("guest patient created without user", (() => result.appointment.patient.name === "Test Guest" && result.appointment.patient.phone === "9876543210")());

    // Lookup + cancel round-trip
    const found = await getGuestBookingByRefAndToken(result.appointment.bookingRef!, result.manageToken!);
    check("token lookup succeeds", !!found && found.id === result.appointment.id);
    check("wrong token rejected", (await getGuestBookingByRefAndToken(result.appointment.bookingRef!, "wrong-token-123")) === null);
    const refOnly = await prisma.appointment.findUnique({ where: { bookingRef: result.appointment.bookingRef! } });
    check("ref alone reveals no token", !!refOnly && refOnly.manageTokenHash !== null && refOnly.manageTokenHash !== result.manageToken);

    await cancelGuestBooking(result.appointment.bookingRef!, result.manageToken!);
    const cancelled = await prisma.appointment.findUniqueOrThrow({ where: { id: result.appointment.id } });
    check("guest cancel works", cancelled.status === "CANCELLED");
    check("slot re-opened after cancel", (await prisma.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } })).status === "OPEN");

    // Booking a cancelled appointment's slot again works (slot released)
    const rebook = await bookGuestAppointment({
      appointmentType: "CLINIC_VISIT",
      slotId: slot.id,
      serviceId: service.id,
      name: "Second Guest",
      mobile: "9112345001",
    });
    check("released slot can be rebooked", !!rebook.appointment.id);
    check("second booking got a different ref", rebook.appointment.bookingRef !== result.appointment.bookingRef);
  }

  console.log("— Idempotency —");
  {
    const slot = await makeSlot(branch.id, 4, 11);
    const key = randomBytes(12).toString("hex");
    const first = await bookGuestAppointment({
      appointmentType: "CLINIC_VISIT", slotId: slot.id, serviceId: service.id, name: "Idem Guest", mobile: "9112345002", idempotencyKey: key,
    });
    check("first submit with key succeeds", !!first.appointment.id);
    const replay = await bookGuestAppointment({
      appointmentType: "CLINIC_VISIT", slotId: slot.id, serviceId: service.id, name: "Idem Guest", mobile: "9112345002", idempotencyKey: key,
    });
    check("replayed key returns same booking", replay.appointment.id === first.appointment.id);
    const count = await prisma.appointment.count({ where: { idempotencyKey: key } });
    check("no duplicate rows created", count === 1);
  }

  console.log("— Double-booking race —");
  {
    const slot = await makeSlot(branch.id, 5, 12);
    const attempt = (name: string, mobile: string) =>
      bookGuestAppointment({ appointmentType: "CLINIC_VISIT", slotId: slot.id, serviceId: service.id, name, mobile }).then(
        (r) => r.appointment.id,
        (e) => `ERR:${(e as Error).name}`,
      );
    const [a, b, c] = await Promise.all([
      attempt("Racer A", "9112345011"),
      attempt("Racer B", "9112345012"),
      attempt("Racer C", "9112345013"),
    ]);
    const winners = [a, b, c].filter((r) => typeof r === "string" && !r.startsWith("ERR"));
    const losers = [a, b, c].filter((r) => typeof r === "string" && r.startsWith("ERR"));
    check("exactly one racer wins", winners.length === 1, JSON.stringify([a, b, c]));
    check("losers get SlotUnavailableError", losers.length === 2 && losers.every((l) => l === "ERR:SlotUnavailableError"), JSON.stringify(losers));
    const appts = await prisma.appointment.count({ where: { slotId: slot.id } });
    check("only one appointment row exists", appts === 1);
  }

  console.log("— Server-side validation (untrusted input) —");
  {
    const slot = await makeSlot(branch.id, 6, 9);
    const cases: { name: string; input: Record<string, unknown>; err: string }[] = [
      { name: "bad mobile rejected", input: { slotId: slot.id, serviceId: service.id, name: "Valid Name", mobile: "12345" }, err: "ZodError" },
      { name: "short name rejected", input: { slotId: slot.id, serviceId: service.id, name: "A", mobile: "9112345021" }, err: "ZodError" },
      { name: "bogus email rejected", input: { slotId: slot.id, serviceId: service.id, name: "Valid Name", mobile: "9112345021", email: "not-an-email" }, err: "ZodError" },
      { name: "300+ char note rejected", input: { slotId: slot.id, serviceId: service.id, name: "Valid Name", mobile: "9112345021", note: "x".repeat(301) }, err: "ZodError" },
    ];
    for (const c of cases) {
      let errName = "none";
      try {
        await bookGuestAppointment(c.input);
      } catch (e) {
        errName = (e as Error).name;
      }
      check(c.name, errName === c.err, `got ${errName}`);
    }

    // Inactive branch / non-offered service / past slot
    await prisma.branch.update({ where: { id: branch.id }, data: { acceptsOnlineBookings: false } });
    let err = "none";
    try {
      await bookGuestAppointment({ appointmentType: "CLINIC_VISIT", slotId: slot.id, serviceId: service.id, name: "Valid Name", mobile: "9112345022" });
    } catch (e) { err = (e as Error).name; }
    check("branch with online booking off rejected", err !== "none", err);
    await prisma.branch.update({ where: { id: branch.id }, data: { acceptsOnlineBookings: true } });

    const other = await prisma.service.create({
      data: { code: `GSVC2-${TAG}`, name: "Other Service", category: "HEARING_TEST", durationMinutes: 30, isActive: true },
    });
    cleanup.push({ kind: "service", id: other.id });
    err = "none";
    try {
      await bookGuestAppointment({ appointmentType: "CLINIC_VISIT", slotId: slot.id, serviceId: other.id, name: "Valid Name", mobile: "9112345023" });
    } catch (e) { err = (e as Error).name; }
    check("service not offered at branch rejected", err !== "none", err);

    const pastSlot = await prisma.appointmentSlot.create({
      data: {
        branchId: branch.id,
        startsAt: new Date(Date.now() - 60 * 60_000),
        endsAt: new Date(Date.now() - 30 * 60_000),
        status: "OPEN",
      },
    });
    err = "none";
    try {
      await bookGuestAppointment({ appointmentType: "CLINIC_VISIT", slotId: pastSlot.id, serviceId: service.id, name: "Valid Name", mobile: "9112345024" });
    } catch (e) { err = (e as Error).name; }
    check("past slot rejected", err === "SlotUnavailableError" || err === "ValidationError" || err === "NotFoundError", err);

    const bookedSlot = await makeSlot(branch.id, 6, 15);
    await prisma.appointmentSlot.update({ where: { id: bookedSlot.id }, data: { status: "BOOKED" } });
    err = "none";
    try {
      await bookGuestAppointment({ appointmentType: "CLINIC_VISIT", slotId: bookedSlot.id, serviceId: service.id, name: "Valid Name", mobile: "9112345025" });
    } catch (e) { err = (e as Error).name; }
    check("already-booked slot rejected", err === "SlotUnavailableError", err);
  }

  console.log("— Booking refs —");
  {
    const refs = new Set(Array.from({ length: 50 }, () => generateBookingRef()));
    check("50 refs all unique", refs.size === 50);
    check("refs match QHC-XXXXXXXX", Array.from(refs).every((r) => /^QHC-[0-9A-F]{8}$/.test(r)));
  }

  console.log("— Guest cannot touch staff surface —");
  {
    // Guest booking actions never grant roles: guest patients have no user row.
    const guest = await prisma.patient.findFirst({ where: { isGuest: true, phone: "9876543210" } });
    check("guest patient has no user row (no accidental login)", !!guest && guest.userId === null);
  }

  console.log("— Home consultation —");
  {
    const past = await bookGuestAppointment({
      appointmentType: "HOME_CONSULTATION",
      serviceId: service.id,
      date: "2020-01-01",
      timePreference: "MORNING",
      name: "Home Guest",
      mobile: "9112345030",
      homeAddress: "1 Test Street, Test Nagar",
      homeLocality: "KPHB",
    }).then(
      () => null,
      (e: Error) => e,
    );
    check("past home-visit date rejected", past instanceof Error);

    const home = await bookGuestAppointment({
      appointmentType: "HOME_CONSULTATION",
      serviceId: service.id,
      date: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
      timePreference: "AFTERNOON",
      name: "Home Guest",
      mobile: "9112345031",
      email: "home@test.local",
      homeAddress: "Flat 4B, 2nd floor, Sample Residency, Road 12",
      homeLocality: "KPHB Phase 1, Kukatpally",
      homeInstructions: "Ring the bell twice",
    });
    check("home consultation request created", !!home.appointment.id);
    check("home appointment stored with HOME_CONSULTATION type", home.appointment.appointmentType === "HOME_CONSULTATION");
    check("home request starts as PENDING_CONFIRMATION", home.appointment.homeConfirmationStatus === "PENDING_CONFIRMATION");
    check("home address stored privately", home.appointment.homeAddress === "Flat 4B, 2nd floor, Sample Residency, Road 12");
    check("no slot attached to home visit", home.appointment.slotId === null);
    check("home ref in QHC-XXXXXXXX form", /^QHC-[0-9A-F]{8}$/.test(home.appointment.bookingRef ?? ""));

    const found = await getGuestBookingByRefAndToken(home.appointment.bookingRef!, home.manageToken!);
    check("home booking token lookup works", !!found && found.id === home.appointment.id);

    // Address must never reach a public payload: cancel + verify removal path.
    await cancelGuestBooking(home.appointment.bookingRef!, home.manageToken!);
    const cancelledHome = await prisma.appointment.findUniqueOrThrow({ where: { id: home.appointment.id } });
    check("guest can cancel home request", cancelledHome.status === "CANCELLED");
  }
}

main()
  .then(async () => {
    await cleanupAll();
    console.log(`\n${pass} passed, ${fail} failed`);
    await prisma.$disconnect();
    process.exit(fail === 0 ? 0 : 1);
  })
  .catch(async (e) => {
    console.error(e);
    await cleanupAll().catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
