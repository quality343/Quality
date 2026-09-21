/**
 * Client-requirements seed (run once): replaces the two development branches
 * with the real client-provided Kukatpally clinic, keeps their ids for slots,
 * and marks home consultations available (no invented timings/areas).
 * Safe to re-run.
 *
 * Run: npx tsx scripts/seed-client-branch.ts
 */
import { PrismaClient } from "@prisma/client";
import { CLIENT } from "../src/lib/client-info";

const prisma = new PrismaClient();

const REAL = {
  code: "KPHB-HQ",
  name: "Kukatpally (KPHB)",
  city: "Hyderabad",
  address: CLIENT.addressOneLine,
  phone: CLIENT.phone,
};

async function main() {
  const existing = await prisma.branch.findUnique({ where: { code: REAL.code } });
  if (existing) {
    await prisma.branch.update({ where: { code: REAL.code }, data: { ...REAL, isActive: true } });
    console.log("real branch updated:", REAL.code);
  } else if (await prisma.branch.count({ where: { isActive: true } })) {
    // Rename the first existing dev branch in place (preserves slots/servces FKs)
    // and deactivate any others — avoids orphaning generated dev slots.
    const first = await prisma.branch.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
    if (first) {
      await prisma.branch.update({ where: { id: first.id }, data: { ...REAL, isActive: true } });
      console.log("dev branch converted to real branch:", first.code, "→", REAL.code);
    }
  } else {
    await prisma.branch.create({ data: REAL });
    console.log("real branch created:", REAL.code);
  }

  // Deactivate any other branches — dev/test locations must not publish.
  const others = await prisma.branch.findMany({ where: { NOT: { code: REAL.code } } });
  for (const b of others) {
    await prisma.branch.update({ where: { id: b.id }, data: { isActive: false, acceptsOnlineBookings: false } });
    console.log("deactivated dev branch:", b.code);
  }

  const real = await prisma.branch.findUniqueOrThrow({ where: { code: REAL.code } });
  await prisma.branch.update({
    where: { id: real.id },
    data: {
      acceptsOnlineBookings: true,
      homeConsultationsEnabled: true,
      homeConsultationNote: null, // no client timings provided — neutral copy shown
      homeServiceAreas: null,     // none configured → requests require clinic confirmation
    },
  });

  // Ensure all services are offered at the real branch (dev seed may have
  // linked services to the old dev branches only).
  const services = await prisma.service.findMany({ where: { isActive: true } });
  for (const s of services) {
    await prisma.branchService.upsert({
      where: { branchId_serviceId: { branchId: real.id, serviceId: s.id } },
      create: { branchId: real.id, serviceId: s.id, isActive: true },
      update: { isActive: true },
    });
  }
  console.log(`linked ${services.length} active services to ${REAL.code}`);
}

main().finally(() => prisma.$disconnect());
