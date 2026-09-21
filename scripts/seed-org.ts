/**
 * Development seed — creates the organizational baseline only:
 * branches, bookable services, and (optionally) demo staff/patient accounts.
 *
 * IMPORTANT: no fake clinical data, no fake appointments, no fake results.
 * Run: npx tsx scripts/seed-org.ts
 */

import bcrypt from "bcryptjs";
import { createPrismaClient } from "./db";

const prisma = createPrismaClient();

const BRANCHES = [
  { code: "VSP-MAIN", name: "Visakhapatnam Main", city: "Visakhapatnam", address: "Main clinic address", phone: "" },
  { code: "VJY-01", name: "Vijayawada Branch", city: "Vijayawada", address: "", phone: "" },
];

const SERVICES = [
  { code: "PTA-30", name: "Pure Tone Audiometry", category: "HEARING_TEST" as const, durationMinutes: 30, sortOrder: 10, description: "Air and bone conduction hearing thresholds across frequencies." },
  { code: "SPEECH-30", name: "Speech Audiometry", category: "HEARING_TEST" as const, durationMinutes: 30, sortOrder: 20, description: "Speech reception and word recognition testing." },
  { code: "TYMP-20", name: "Tympanometry", category: "DIAGNOSTIC" as const, durationMinutes: 20, sortOrder: 30, description: "Middle-ear function assessment." },
  { code: "ABR-60", name: "ABR / BERA", category: "DIAGNOSTIC" as const, durationMinutes: 60, sortOrder: 40, description: "Auditory brainstem response assessment." },
  { code: "OAE-20", name: "OAE Screening", category: "DIAGNOSTIC" as const, durationMinutes: 20, sortOrder: 50, description: "Otoacoustic emissions screening." },
  { code: "HA-DEMO-45", name: "Hearing Aid Demo & Trial", category: "HEARING_AID" as const, durationMinutes: 45, sortOrder: 60, description: "Trial fitting with audiologist guidance." },
  { code: "TH-APPT-45", name: "Therapy Session", category: "THERAPY" as const, durationMinutes: 45, sortOrder: 70, description: "Speech-language or auditory therapy session." },
  { code: "CI-EVAL-60", name: "Cochlear Implant Evaluation", category: "COCHLEAR" as const, durationMinutes: 60, sortOrder: 80, description: "Pre-implant candidacy assessment." },
];

async function main() {
  // Idempotent branches
  for (const b of BRANCHES) {
    await prisma.branch.upsert({
      where: { code: b.code },
      create: { ...b, phone: b.phone || null },
      update: {},
    });
  }
  const branches = await prisma.branch.findMany();
  console.log(`✔ branches: ${branches.length}`);

  // Idempotent services
  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { code: s.code },
      create: s,
      update: {},
    });
  }
  console.log(`✔ services: ${SERVICES.length}`);

  // Every branch offers every service by default (admin can toggle later)
  for (const b of branches) {
    for (const s of SERVICES) {
      const svc = await prisma.service.findUnique({ where: { code: s.code } });
      if (!svc) continue;
      await prisma.branchService.upsert({
        where: { branchId_serviceId: { branchId: b.id, serviceId: svc.id } },
        create: { branchId: b.id, serviceId: svc.id, isActive: true },
        update: {},
      });
    }
  }
  console.log("✔ branch-service catalogue linked");

  // Optional demo staff/patient for local development only.
  const demoEmail = process.env.SEED_DEMO_EMAIL;
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (demoEmail && demoPassword) {
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    for (const role of ["AUDIOLOGIST", "CLINIC_STAFF"] as const) {
      const email = `${demoEmail.split("@")[0]}.${role.toLowerCase()}@${demoEmail.split("@")[1]}`;
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, name: `Demo ${role[0]}${role.slice(1).toLowerCase()}`, passwordHash, role },
        update: {},
      });
      const main = branches[0];
      if (main) {
        await prisma.staff.upsert({
          where: { userId: user.id },
          create: { userId: user.id, branchId: main.id, designation: role },
          update: {},
        });
      }
      console.log(`✔ demo staff: ${email} (${role})`);
    }
    const patient = await prisma.user.upsert({
      where: { email: demoEmail },
      create: { email: demoEmail, name: "Demo Patient", passwordHash, role: "PATIENT" },
      update: {},
    });
    await prisma.patient.upsert({
      where: { userId: patient.id },
      create: { userId: patient.id },
      update: {},
    });
    console.log(`✔ demo patient: ${demoEmail}`);
  } else {
    console.log("ℹ SEED_DEMO_EMAIL/SEED_DEMO_PASSWORD not set — skipping demo accounts.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
