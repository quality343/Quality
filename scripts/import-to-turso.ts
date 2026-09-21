/**
 * Load the PostgreSQL dump into Turso.
 *
 * Pair with scripts/dump-postgres.ts. Types are mapped using Prisma's own
 * metadata rather than a hand-written list, so nothing can be missed:
 * - `{ __date: iso }` markers are revived to real Date objects for DateTime
 *   columns (SQLite stores them as DATETIME text);
 * - any value that is an object going into a String column is JSON-encoded —
 *   that is exactly the former `Json` fields (test payloads, report content,
 *   audit metadata), which SQLite cannot express as JSON in Prisma.
 *
 * Rows are inserted in dependency order (parents before children) so foreign
 * keys hold, and this is what the tests then verify.
 *
 * Usage: npx tsx scripts/import-to-turso.ts [dumpPath]
 */
import { Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import { loadLocalEnv } from "./load-local-env";
import { createPrismaClient } from "./db";

loadLocalEnv();

const prisma = createPrismaClient();

type Row = Record<string, unknown>;

/** DMMF gives the *mapped* field list and its scalar types for a model. */
function scalarTypes(modelName: string): Map<string, string> {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  const out = new Map<string, string>();
  for (const f of model?.fields ?? []) {
    if (f.kind === "scalar") out.set(f.name, f.type);
  }
  return out;
}

/** Models this one points at through a required/owned foreign key. */
function dependencies(modelName: string): string[] {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  return (model?.fields ?? [])
    .filter((f) => f.kind === "object" && (f.relationFromFields?.length ?? 0) > 0)
    .map((f) => f.type)
    .filter((t) => t !== modelName && Prisma.dmmf.datamodel.models.some((m) => m.name === t));
}

/** Parents before children (depth-first, cycle-tolerant). */
function insertionOrder(): string[] {
  const order: string[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();
  const visit = (name: string) => {
    if (done.has(name) || visiting.has(name)) return;
    visiting.add(name);
    for (const d of dependencies(name)) visit(d);
    visiting.delete(name);
    done.add(name);
    order.push(name);
  };
  for (const m of Prisma.dmmf.datamodel.models) visit(m.name);
  return order;
}

function revive(value: unknown, type: string | undefined): unknown {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map((v) => revive(v, type));
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.__date === "string") return new Date(obj.__date);
    // Former Json column → text.
    if (type === "String") return JSON.stringify(value);
    return value;
  }
  return value;
}

async function main() {
  const dumpPath = process.argv[2] ?? ".tmp-pgdump.json";
  const dump = JSON.parse(readFileSync(dumpPath, "utf8")) as Record<string, Row[]>;

  const order = insertionOrder();
  let totalRows = 0;
  let totalModels = 0;

  for (const modelName of order) {
    const rows = dump[modelName];
    if (!rows || rows.length === 0) continue;

    const types = scalarTypes(modelName);
    const data = rows.map((raw) => {
      const out: Row = {};
      for (const [k, v] of Object.entries(raw)) {
        // Drop keys the model no longer has, rather than sending junk.
        if (!types.has(k)) continue;
        out[k] = revive(v, types.get(k));
      }
      return out;
    });

    const delegate = (prisma as unknown as Record<string, { createMany: (a: unknown) => Promise<{ count: number }> }>)[
      modelName.charAt(0).toLowerCase() + modelName.slice(1)
    ];

    // SQLite caps bound parameters per statement (~999), so chunk by column count.
    const chunkSize = Math.max(1, Math.floor(800 / Math.max(1, types.size)));
    let inserted = 0;
    for (let i = 0; i < data.length; i += chunkSize) {
      const res = await delegate.createMany({ data: data.slice(i, i + chunkSize) });
      inserted += res.count;
    }

    totalRows += inserted;
    totalModels += 1;
    console.log(`   ${modelName.padEnd(30)} ${inserted}`);
  }

  console.log(`\nImported ${totalRows} rows across ${totalModels} models.`);
}

main()
  .catch((e) => {
    console.error("\nIMPORT FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
