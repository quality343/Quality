/**
 * Export every row of every model from the CURRENT PostgreSQL database to a
 * single JSON file.
 *
 * This must run BEFORE the Prisma schema is switched to sqlite and the client
 * is regenerated — afterwards Prisma can no longer talk to PostgreSQL at all.
 * Reading through Prisma (rather than pg_dump) means dates, cuid ids and nested
 * objects come out already shaped the way the new client expects.
 *
 * Usage: npx tsx scripts/dump-postgres.ts [outputPath]
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

/** Prisma serialises DateTime as ISO strings and Json as-is, which is exactly
 *  what the import step wants. */
function serialise(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return { __date: value.toISOString() };
  if (Array.isArray(value)) return value.map(serialise);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serialise(v);
    return out;
  }
  return value;
}

async function main() {
  const outPath = process.argv[2] ?? ".tmp-pgdump.json";
  const models = Prisma.dmmf.datamodel.models;
  const dump: Record<string, unknown[]> = {};
  let total = 0;

  for (const model of models) {
    const delegate = (prisma as unknown as Record<string, { findMany: (a?: unknown) => Promise<unknown[]> }>)[
      model.name.charAt(0).toLowerCase() + model.name.slice(1)
    ];
    if (!delegate?.findMany) {
      console.warn(` - ${model.name}: no delegate, skipped`);
      continue;
    }
    const rows = await delegate.findMany();
    dump[model.name] = serialise(rows) as unknown[];
    total += rows.length;
    if (rows.length > 0) console.log(`   ${model.name.padEnd(28)} ${rows.length}`);
  }

  writeFileSync(outPath, JSON.stringify(dump), "utf8");
  console.log(`\nDumped ${models.length} models, ${total} rows -> ${outPath}`);
}

main()
  .catch((e) => {
    console.error("DUMP FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
