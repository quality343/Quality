import { createPrismaClient } from "./db";
/**
 * Dev convenience: generate OPEN slots for the next 5 business days at every
 * active branch (9:30–13:00 & 14:00–17:30 IST, 30-min). Safe to re-run —
 * idempotent per (branch, startsAt). Dev data only.
 */

const prisma = createPrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  let created = 0;
  for (const b of branches) {
    for (let day = 1; day <= 5; day += 1) {
      const d = new Date();
      d.setDate(d.getDate() + day);
      if (d.getDay() === 0) continue; // skip Sundays
      for (const [from, to] of [[9.5 * 60, 13 * 60], [14 * 60, 17.5 * 60]] as const) {
        for (let m = from; m < to; m += 30) {
          const startsAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m / 60), m % 60);
          const exists = await prisma.appointmentSlot.findFirst({
            where: { branchId: b.id, startsAt, staffId: null },
            select: { id: true },
          });
          if (exists) continue;
          await prisma.appointmentSlot.create({
            data: {
              branchId: b.id,
              startsAt,
              endsAt: new Date(startsAt.getTime() + 30 * 60_000),
              status: "OPEN",
            },
          });
          created += 1;
        }
      }
    }
  }
  console.log(`created ${created} slots across ${branches.length} branches`);
}

main().finally(() => prisma.$disconnect());
