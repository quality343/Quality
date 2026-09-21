/**
 * Concurrency test for the double-booking guarantee on Turso.
 *
 * PostgreSQL's locking behaviour does not carry over to SQLite automatically, so
 * this does not assume anything — it recreates the exact race the spec calls out
 * (Visitor A and Visitor B both press Confirm at 10:00) and then a harsher
 * 8-way race, and asserts the outcome at BOTH levels:
 *
 *   1. exactly one booking succeeds;
 *   2. the losers receive the friendly slot-unavailable error — not a raw
 *      Prisma/SQLite error, which would leak as a 500 to a visitor;
 *   3. the database ends up with exactly one ACTIVE appointment for that slot.
 *
 * The real guarantee is the partial unique index
 * `Appointment_active_slot_unique`; this test proves it actually fires.
 *
 * Usage: npx tsx scripts/test-turso-concurrency.ts
 */
import { createPrismaClient } from "./db";
import { bookGuestAppointment } from "../src/server/services/scheduling";

const prisma = createPrismaClient();

const TAG = `cc${Date.now().toString(36)}`;
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

function futureSlotDate(daysAhead: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

type Outcome = { ok: true; ref: string | null } | { ok: false; error: string };

async function attempt(slotId: string, serviceId: string, index: number): Promise<Outcome> {
  try {
    const res = await bookGuestAppointment({
      appointmentType: "CLINIC_VISIT",
      slotId,
      serviceId,
      name: `Race Guest ${index}`,
      // Distinct mobiles so these are genuinely separate bookings — no
      // idempotency key, so nothing collapses them into one replay.
      mobile: `9112345${String(index).padStart(3, "0")}`,
    });
    return { ok: true, ref: res.appointment.bookingRef ?? null };
  } catch (e) {
    const name = e instanceof Error ? e.constructor.name : "unknown";
    return { ok: false, error: name };
  }
}

async function runRace(label: string, concurrency: number, branchId: string, serviceId: string, hour: number) {
  const startsAt = futureSlotDate(5, hour);
  const slot = await prisma.appointmentSlot.create({
    data: { branchId, startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60_000), status: "OPEN" },
  });

  console.log(`\n${label} — ${concurrency} simultaneous bookings of the same slot`);
  const outcomes = await Promise.all(
    Array.from({ length: concurrency }, (_, i) => attempt(slot.id, serviceId, i + 1)),
  );

  const winners = outcomes.filter((o) => o.ok);
  const losers = outcomes.filter((o) => !o.ok) as { ok: false; error: string }[];

  check(`exactly 1 booking succeeded (got ${winners.length})`, winners.length === 1);
  check(
    `all ${losers.length} losers got SlotUnavailableError`,
    losers.every((l) => l.error === "SlotUnavailableError"),
    losers.map((l) => l.error).join(", "),
  );
  check(
    "no raw database error leaked to a visitor",
    !losers.some((l) => /Prisma|SQLITE|Unique constraint/i.test(l.error)),
    losers.map((l) => l.error).join(", "),
  );

  const active = await prisma.appointment.count({
    where: { slotId: slot.id, status: { in: ["BOOKED", "CHECKED_IN", "IN_PROGRESS"] } },
  });
  check(`exactly 1 active appointment for the slot (got ${active})`, active === 1);

  const after = await prisma.appointmentSlot.findUniqueOrThrow({ where: { id: slot.id } });
  check("slot is now BOOKED", after.status === "BOOKED");

  return slot.id;
}

async function main() {
  const branch = await prisma.branch.create({
    data: { code: `CC-${TAG}`, name: "Concurrency Test Branch", isActive: true, acceptsOnlineBookings: true },
  });
  const service = await prisma.service.create({
    data: { code: `CCSVC-${TAG}`, name: "Concurrency Test Service", category: "HEARING_TEST", durationMinutes: 30, isActive: true },
  });
  await prisma.branchService.create({ data: { branchId: branch.id, serviceId: service.id, isActive: true } });

  try {
    await runRace("Visitor A vs Visitor B", 2, branch.id, service.id, 10);
    await runRace("Eight-way race", 8, branch.id, service.id, 11);

    // A second booking of the *same* slot after one already won must be refused
    // (the sequential case, which users hit after a refresh).
    const slotId = await runRace("Repeat attempt after a win", 1, branch.id, service.id, 12);
    const sequential = await attempt(slotId, service.id, 99);
    check(
      "booking an already-booked slot is refused",
      !sequential.ok && sequential.error === "SlotUnavailableError",
      sequential.ok ? "it succeeded" : sequential.error,
    );
  } finally {
    await prisma.appointment.deleteMany({ where: { branchId: branch.id } });
    await prisma.appointmentSlot.deleteMany({ where: { branchId: branch.id } });
    await prisma.branchService.deleteMany({ where: { branchId: branch.id } });
    await prisma.patient.deleteMany({ where: { isGuest: true, phone: { startsWith: "9112345" } } });
    await prisma.service.deleteMany({ where: { id: service.id } });
    await prisma.branch.deleteMany({ where: { id: branch.id } });
  }

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("RACE TEST ERROR:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
