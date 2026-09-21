/**
 * Provision the real clinic ADMIN account for QUALITY Hearing Care.
 *
 * Production must never depend on the account the test suite creates
 * (`admin.*@test.local`), which has a predictable password and is recreated on
 * every test run. This script exists to create the one genuine login the clinic
 * staff will actually use.
 *
 * Usage (values come from the environment — never hardcoded):
 *
 *   ADMIN_NAME="Clinic Admin" \
 *   ADMIN_EMAIL="qualityhearing.pro@gmail.com" \
 *   ADMIN_PASSWORD="<strong unique password>" \
 *   npx tsx scripts/provision-admin.ts
 *
 * Idempotent and safe to re-run:
 * - account missing          → creates it, links a Staff row (and the clinic branch when there is exactly one)
 * - account exists, no flags → reports it and changes nothing
 * - account exists + --reset → rotates the password and ensures role/isActive
 *
 * To run against production, point DATABASE_URL/DIRECT_URL at the production
 * database for this command only. Delete the ADMIN_* values afterwards.
 */

import bcrypt from "bcryptjs";
import { loadLocalEnv } from "./load-local-env";
import { createPrismaClient } from "./db";

// Loads .env for local runs. An explicitly-exported DATABASE_URL/DIRECT_URL
// always wins, so pointing this command at production cannot be overridden by
// a local .env (see scripts/load-local-env.ts).
loadLocalEnv();

const prisma = createPrismaClient();

const MIN_PASSWORD_LENGTH = 12;

/** Rejects passwords that are only just long enough to pass the check. */
function weakPasswordReasons(password: string): string[] {
  const reasons: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    reasons.push(`must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) reasons.push("needs a lowercase letter");
  if (!/[A-Z]/.test(password)) reasons.push("needs an uppercase letter");
  if (!/[0-9]/.test(password)) reasons.push("needs a digit");
  if (/^(password|admin|quality|hearing|qhc)/i.test(password)) {
    reasons.push("must not start with an obvious word like 'admin' or 'quality'");
  }
  return reasons;
}

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE?.trim() || undefined;
  const designation = process.env.ADMIN_DESIGNATION?.trim() || "Clinic Administrator";
  const reset = process.argv.includes("--reset");

  if (!name || !email || !password) {
    console.error(
      "Missing ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD environment variables.\n" +
        "See docs/DEPLOYMENT.md → \"Provision the real admin account\".",
    );
    process.exit(1);
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error(`ADMIN_EMAIL does not look like an email address.`);
    process.exit(1);
  }

  const problems = weakPasswordReasons(password);
  if (problems.length > 0) {
    console.error(`ADMIN_PASSWORD is too weak — ${problems.join(", ")}.`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && !reset) {
    console.log(
      `User ${email} already exists (role: ${existing.role}, active: ${existing.isActive}).\n` +
        "Nothing changed. Re-run with --reset to rotate the password and ensure the ADMIN role.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: "ADMIN",
        isActive: true,
        name,
        ...(phone ? { phone } : {}),
      },
    });
    console.log(`Rotated password and confirmed ADMIN role for ${email}.`);
  } else {
    // With a single-clinic product there is normally exactly one branch; link
    // the Staff row to it so slot/staff tools scope correctly. Ambiguous or
    // empty branch tables leave the link null rather than guessing.
    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
    const branchId = branches.length === 1 ? branches[0].id : null;

    if (branches.length > 1) {
      console.warn(
        `Found ${branches.length} branches — leaving the staff branch unset. ` +
          "Set it from the portal (Clinic Information / Staff) instead of guessing here.",
      );
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
        ...(phone ? { phone } : {}),
        staff: {
          create: {
            designation,
            ...(branchId ? { branchId } : {}),
          },
        },
      },
    });

    console.log(
      `Created ADMIN user ${email}` +
        (branchId ? ` linked to branch "${branches[0].name}".` : " (no branch linked)."),
    );
  }

  const provisioned = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  await prisma.auditLog.create({
    data: {
      actorId: provisioned?.id,
      action: "bootstrap.admin",
      entityType: "User",
      entityId: provisioned?.id,
      // No password material and no personal data beyond what the operator
      // already supplied — keeps the audit trail useful without leaking.
      metadata: JSON.stringify({ rotated: Boolean(existing), script: "provision-admin.ts" }),
    },
  });

  console.log("Audit event recorded. Remove the ADMIN_* environment values now.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
