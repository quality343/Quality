/**
 * One-time SUPER_ADMIN bootstrap for QUALITY Hearing Care.
 *
 * Usage (values come from environment variables — never hardcoded):
 *
 *   SUPER_ADMIN_NAME="Owner Name" \
 *   SUPER_ADMIN_EMAIL="owner@example.com" \
 *   SUPER_ADMIN_PASSWORD="strong-password-here" \
 *   npx tsx scripts/seed-super-admin.ts
 *
 * Behavior:
 * - Creates the SUPER_ADMIN user (bcrypt hash, cost 12) + linked Staff row.
 * - If the email already exists: updates the role to SUPER_ADMIN ONLY when
 *   --promote is passed; otherwise exits without changes (safe re-runs).
 * - Records a "bootstrap.super_admin" audit event.
 * - Refuses to run with a weak/short password.
 *
 * SECURITY: run once during setup, then REMOVE the env values. Never commit
 * them. There is deliberately no public registration path for staff roles.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const promote = process.argv.includes("--promote");

  if (!name || !email || !password) {
    console.error(
      "Missing SUPER_ADMIN_NAME / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD env vars.",
    );
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("SUPER_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (!promote) {
      console.error(
        `User ${email} already exists. Re-run with --promote to grant SUPER_ADMIN (and reset the password).`,
      );
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { role: "SUPER_ADMIN", isActive: true, passwordHash },
    });
    console.log(`Promoted existing user ${email} to SUPER_ADMIN.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
        staff: {
          create: { designation: "Platform Owner" },
        },
      },
      select: { id: true },
    });
    console.log(`Created SUPER_ADMIN user ${email} (id: ${user.id}).`);
  }

  const admin = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  await prisma.auditLog.create({
    data: {
      actorId: admin?.id,
      action: "bootstrap.super_admin",
      entityType: "User",
      entityId: admin?.id,
      metadata: { promoted: Boolean(existing), script: "seed-super-admin.ts" },
    },
  });

  console.log("Audit event recorded. Remove the SUPER_ADMIN_* env values now.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
