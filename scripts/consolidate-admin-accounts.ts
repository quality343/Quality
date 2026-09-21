/**
 * Consolidate the account list to a single operational ADMIN.
 *
 * The product is one clinic website with one administrator. Older accounts came
 * from the previous, larger application (clinic staff, audiologists, a super
 * admin) and from the test suites, which create throwaway accounts. None of them
 * should be able to sign in.
 *
 * HOW THIS REMOVES ACCESS — deliberately non-destructive:
 * - **Deactivation, not deletion, for anything with history.** `authorize()`
 *   rejects an inactive user outright (`auth.login.blocked_inactive`), so
 *   `isActive = false` is a real lockout. Deleting instead would be actively
 *   harmful here: `Staff.userId` is `ON DELETE RESTRICT` (the delete simply
 *   fails), while `AuditLog.actorId`, `Appointment.bookedById`,
 *   `Notification.userId` and `Patient.userId` are `ON DELETE SET NULL` — so
 *   deleting an account silently erases who did what from the audit trail and
 *   detaches a patient's history.
 * - **Deletion only for accounts with zero references.** A test artifact with no
 *   audit rows, no appointments, no notifications, no staff row and no patient
 *   row can go without leaving a trace. Anything else is deactivated and listed.
 *
 * Appointments, services, branches, availability and audit records are never
 * touched. Only `User` rows change, and only their `isActive` flag (plus the
 * handful of safe deletions above).
 *
 * Usage:
 *   npx tsx scripts/consolidate-admin-accounts.ts            # report only (default)
 *   npx tsx scripts/consolidate-admin-accounts.ts --apply    # make the changes
 */
import { createPrismaClient } from "./db";

const prisma = createPrismaClient();

/** The one account that must remain able to sign in. */
const KEEP_EMAIL = (process.env.KEEP_ADMIN_EMAIL ?? "qualityhearing.pro@gmail.com").toLowerCase();

/** Roles the current product does not operate. Their accounts are retired. */
const LEGACY_ROLES = ["CLINIC_STAFF", "AUDIOLOGIST", "THERAPIST", "SUPER_ADMIN"];

/** Accounts the test suites and earlier development created. */
function looksLikeTestArtifact(email: string, name: string): boolean {
  const e = email.toLowerCase();
  return (
    /@test\.local$/.test(e) ||
    /@test\.example$/.test(e) ||
    /^browser\.test@/.test(e) ||
    /\.mu[0-9a-z]{6,}\./.test(e) || // per-run suffix used by the test suites
    /\btest\b/i.test(name) ||
    /\bbrowser test\b/i.test(name)
  );
}

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  audit: number;
  appointmentsBooked: number;
  notifications: number;
  staff: number;
  patients: number;
};

function deps(r: Row): number {
  return r.audit + r.appointmentsBooked + r.notifications + r.staff + r.patients;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      // staff/patient are to-one, so they are fetched rather than counted.
      staff: { select: { id: true } },
      patient: { select: { id: true } },
      _count: {
        select: {
          auditLogs: true,
          bookedBy: true,
          notifications: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  const rows: Row[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    audit: u._count.auditLogs,
    appointmentsBooked: u._count.bookedBy,
    notifications: u._count.notifications,
    staff: u.staff ? 1 : 0,
    patients: u.patient ? 1 : 0,
  }));

  const keep = rows.filter((r) => r.email.toLowerCase() === KEEP_EMAIL);
  if (keep.length !== 1) {
    console.error(
      `Expected exactly one account matching KEEP_ADMIN_EMAIL (${KEEP_EMAIL}), found ${keep.length}. Aborting.`,
    );
    process.exit(1);
  }

  const others = rows.filter((r) => r.email.toLowerCase() !== KEEP_EMAIL);

  const toDelete = others.filter(
    (r) => deps(r) === 0 && looksLikeTestArtifact(r.email, r.name) && r.role !== "ADMIN",
  );
  const toDeactivate = others.filter((r) => !toDelete.includes(r) && r.isActive);
  const alreadyInactive = others.filter((r) => !toDelete.includes(r) && !r.isActive);

  console.log(`Keep (active ADMIN) : ${KEEP_EMAIL}`);
  console.log(`Accounts examined   : ${rows.length}`);
  console.log(`Delete (no references, test artifact) : ${toDelete.length}`);
  console.log(`Deactivate (has history or is not a test artifact) : ${toDeactivate.length}`);
  console.log(`Already inactive    : ${alreadyInactive.length}`);

  // Roles from the previous, larger application. They must not have a login in
  // this product; anyone holding one is retired below.
  const legacyAccounts = others.filter((r) => LEGACY_ROLES.includes(r.role));
  console.log(
    `Legacy-role accounts retired: ${legacyAccounts.length}` +
      (legacyAccounts.length > 0
        ? ` (${[...new Set(legacyAccounts.map((r) => r.role))].join(", ")})`
        : ""),
  );

  console.log("\nDeactivate:");
  for (const r of toDeactivate) {
    console.log(`  ${r.role.padEnd(13)} ${r.email.padEnd(40)} refs=${deps(r)} (audit ${r.audit}, appts ${r.appointmentsBooked}, staff ${r.staff}, patient ${r.patients})`);
  }
  console.log("\nDelete:");
  for (const r of toDelete) {
    console.log(`  ${r.role.padEnd(13)} ${r.email.padEnd(40)} "${r.name}"`);
  }

  if (!apply) {
    console.log("\nReport only. Re-run with --apply to make these changes.");
    return;
  }

  // Ensure the kept account is an active ADMIN before anything else, so the
  // clinic cannot end up with no way in if this script is interrupted.
  await prisma.user.update({
    where: { id: keep[0].id },
    data: { role: "ADMIN", isActive: true },
  });
  console.log(`\n✔ ${KEEP_EMAIL} ensured active ADMIN.`);

  let deactivated = 0;
  for (const r of toDeactivate) {
    await prisma.user.update({ where: { id: r.id }, data: { isActive: false } });
    deactivated += 1;
  }
  console.log(`✔ Deactivated ${deactivated} account(s) — credentials still valid, login refused.`);

  let deleted = 0;
  for (const r of toDelete) {
    await prisma.user.delete({ where: { id: r.id } });
    deleted += 1;
  }
  console.log(`✔ Deleted ${deleted} unreferenced test account(s).`);

  await prisma.auditLog.create({
    data: {
      action: "admin.accounts.consolidated",
      entityType: "User",
      entityId: keep[0].id,
      metadata: JSON.stringify({
        kept: KEEP_EMAIL,
        deactivated,
        deleted,
        legacyRoles: [...new Set(others.map((r) => r.role))],
      }),
    },
  });
  console.log("✔ Audit event recorded.");

  const active = await prisma.user.count({ where: { isActive: true } });
  const activeAdmins = await prisma.user.count({ where: { isActive: true, role: "ADMIN" } });
  console.log(`\nActive accounts now: ${active} (of which ADMIN: ${activeAdmins})`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
