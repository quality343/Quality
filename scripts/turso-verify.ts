/**
 * Verify the Turso database after the migration.
 *
 * Checks the things that actually matter for the product, not just that a
 * connection works: row counts, that relationships resolve, that the former
 * `Json` columns still decode, that role values survived, and — most
 * importantly — that the partial unique index preventing double-booking exists.
 *
 * Usage: npx tsx scripts/turso-verify.ts
 */
import { createPrismaClient } from "./db";
import { parseJsonSafe } from "../src/lib/json";

const prisma = createPrismaClient();

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? "(unset)";
  console.log(`Target: ${url.replace(/\/\/.*@/, "//***@")}\n`);

  // ── The double-booking guard ──────────────────────────────────────────────
  const guard = await prisma.$queryRawUnsafe<{ name: string; sql: string }[]>(
    "SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name = 'Appointment_active_slot_unique'",
  );
  console.log("Double-booking guard:");
  console.log(
    guard.length === 1
      ? `  ✔ partial unique index present\n    ${guard[0].sql.replace(/\s+/g, " ").slice(0, 140)}`
      : "  ✘ MISSING — two visitors could book the same slot",
  );

  // ── Row counts (the tables the product actually uses) ─────────────────────
  const counts: [string, () => Promise<number>][] = [
    ["User", () => prisma.user.count()],
    ["Staff", () => prisma.staff.count()],
    ["Branch", () => prisma.branch.count()],
    ["Service", () => prisma.service.count()],
    ["BranchService", () => prisma.branchService.count()],
    ["AppointmentSlot", () => prisma.appointmentSlot.count()],
    ["Appointment", () => prisma.appointment.count()],
    ["Patient (guests)", () => prisma.patient.count({ where: { isGuest: true } })],
    ["ContactEnquiry", () => prisma.contactEnquiry.count()],
    ["AuditLog", () => prisma.auditLog.count()],
  ];
  console.log("\nRow counts:");
  for (const [label, fn] of counts) {
    console.log(`  ${label.padEnd(20)} ${await fn()}`);
  }

  // ── Relationships resolve ─────────────────────────────────────────────────
  const appts = await prisma.appointment.findMany({
    include: {
      patient: { select: { name: true } },
      service: { select: { name: true } },
      branch: { select: { name: true } },
      slot: { select: { startsAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(`\nRelationships (${appts.length} appointments):`);
  for (const a of appts) {
    console.log(
      `  ${a.bookingRef ?? "(no ref)"} | ${a.appointmentType} | ${a.status} | ` +
        `${a.patient?.name ?? "(guest?)"} | ${a.service?.name ?? "-"} | ${a.branch?.name ?? "-"} | ` +
        `${a.slot?.startsAt?.toISOString().slice(0, 16) ?? "no slot"}`,
    );
  }

  // ── Former Json columns round-trip ────────────────────────────────────────
  const audit = await prisma.auditLog.findFirst({
    where: { metadata: { not: null } },
    select: { action: true, metadata: true },
  });
  const decoded = audit ? parseJsonSafe(audit.metadata) : null;
  console.log("\nFormer Json → text:");
  console.log(
    audit
      ? `  ✔ AuditLog.metadata decodes: ${JSON.stringify(decoded)} (action: ${audit.action})`
      : "  (no audit rows with metadata)",
  );

  // ── Role values survived the enum → text change ───────────────────────────
  const byRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
  console.log("\nRoles (was a PostgreSQL enum, now text):");
  console.log("  " + byRole.map((r) => `${r.role}=${r._count._all}`).join(", "));

  // ── Bookable slots exist ──────────────────────────────────────────────────
  const openFuture = await prisma.appointmentSlot.count({
    where: { status: "OPEN", startsAt: { gt: new Date() } },
  });
  console.log(`\nOpen future slots: ${openFuture}`);

  // ── Foreign keys enforced? ────────────────────────────────────────────────
  const fk = await prisma.$queryRawUnsafe<{ foreign_keys: number }[]>("PRAGMA foreign_keys");
  console.log(`Foreign keys enforced: ${fk[0]?.foreign_keys === 1 ? "yes" : "NO"}`);
}

main()
  .catch((e) => {
    console.error("VERIFY FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
