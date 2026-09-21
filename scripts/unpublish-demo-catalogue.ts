import { createPrismaClient } from "./db";
/**
 * Unpublish seeded demo hearing-aid rows.
 *
 * The catalogue was seeded with clearly-fictional brands and models
 * ("Aurora Acoustics (demo)", "Horizon 5", …) plus invented prices. Those rows
 * must never be published as if they were real products, so this script moves
 * them out of the public `ACTIVE` state into `INACTIVE`.
 *
 * Non-destructive and reversible:
 *   - no rows are deleted
 *   - admin catalogue pages still list INACTIVE models
 *   - re-publishing is a status change once real, client-approved products
 *     are entered (Admin → Aid Catalogue), at which point the public
 *     catalogue and the homepage showcase light up automatically
 *
 * Run:  npx tsx scripts/unpublish-demo-catalogue.ts
 */

const prisma = createPrismaClient();

async function main() {
  // Match the seeded demo brands by their explicit "(demo)" marker rather than
  // by guessing model names, so any real products are left untouched.
  const demoBrands = await prisma.hearingAidBrand.findMany({
    where: { name: { contains: "(demo)" } },
    select: { id: true, name: true },
  });

  if (demoBrands.length === 0) {
    console.log("No demo brands found — nothing to unpublish.");
    return;
  }

  const result = await prisma.hearingAidModel.updateMany({
    where: { brandId: { in: demoBrands.map((b) => b.id) }, status: "ACTIVE" },
    data: { status: "INACTIVE", isFeatured: false },
  });

  console.log(
    `Unpublished ${result.count} demo model(s) from ${demoBrands.length} demo brand(s):`,
  );
  for (const brand of demoBrands) console.log(`  · ${brand.name}`);
  console.log(
    "They remain in the admin catalogue as INACTIVE and can be published once real products are entered.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
