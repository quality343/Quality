/**
 * ONE-TIME MIGRATION TOOL — PostgreSQL dialect → SQLite/libSQL dialect.
 *
 * Turso is libSQL (SQLite-compatible), and Prisma's SQLite connector supports a
 * narrower language than its PostgreSQL one. This rewrites the schema
 * mechanically and prints exactly what it changed, so the migration is
 * reviewable rather than a hand edit across ~60 places.
 *
 * What it does, and why:
 *   1. datasource → `sqlite` with a local file URL. The real Turso URL/token are
 *      supplied to the driver adapter at runtime, not through the datasource.
 *   2. adds `previewFeatures = ["driverAdapters"]`, required for
 *      `@prisma/adapter-libsql` on Prisma 6.x.
 *   3. removes every `enum` and turns each field that used one into `String`,
 *      quoting its default. Prisma does not support enums on SQLite.
 *   4. drops `@db.VarChar(n)` / `@db.Text` native types — PostgreSQL-only, and
 *      Prisma rejects them for SQLite. Length limits therefore become an
 *      application-level concern (documented in docs/DATABASE.md).
 *   5. turns `Json` fields into `String` (JSON-encoded). Prisma does not support
 *      the Json type on SQLite.
 *
 * Idempotency: safe to re-run. Steps 3–5 are no-ops once applied; step 2 is
 * skipped if the preview feature is already present.
 *
 * Usage: npx tsx scripts/transform-schema-to-sqlite.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCHEMA = path.join("prisma", "schema.prisma");

let schema = readFileSync(SCHEMA, "utf8");
const notes: string[] = [];

// ── 1. datasource ───────────────────────────────────────────────────────────
if (schema.includes('provider = "postgresql"')) {
  schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
  notes.push('datasource provider: "postgresql" → "sqlite"');
}
if (/url\s*=\s*env\("DATABASE_URL"\)/.test(schema)) {
  schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url      = "file:./dev.db"');
  notes.push("datasource url: env(DATABASE_URL) → file:./dev.db (adapter supplies the real URL)");
}

// ── 2. driver adapters preview feature ──────────────────────────────────────
// Prisma 6.19 reports driverAdapters as GA, so declaring it only produces a
// deprecation warning. Remove the flag if an earlier migration added it.
if (schema.includes("previewFeatures = [\"driverAdapters\"]")) {
  schema = schema.replace(/^\s*previewFeatures\s*=\s*\["driverAdapters"\]\r?\n/gm, "");
  notes.push("generator: removed driverAdapters preview flag (GA in Prisma 6.19)");
}

// ── 3. enums → String ───────────────────────────────────────────────────────
const enumNames = [...schema.matchAll(/^enum (\w+) \{[\s\S]*?^\}/gm)].map((m) => m[1]);
if (enumNames.length > 0) {
  schema = schema.replace(/^enum \w+ \{[\s\S]*?^\}\r?\n?/gm, "");
  notes.push(`removed ${enumNames.length} enum blocks (Prisma/SQLite does not support enums)`);

  let converted = 0;
  for (const name of enumNames) {
    // Field line whose type is exactly this enum, followed by an optional
    // `[]` (list) or `?` (nullable) and then optional attributes.
    const re = new RegExp(`^(\\s*)(\\w+)(\\s+)${name}(\\[\\])?(\\?)?(\\s+[^\\r\\n]*)?$`, "gm");
    schema = schema.replace(re, (_line, indent, field, space, arrayType, optional, rest = "") => {
      converted += 1;
      // Quote bare enum defaults: @default(PATIENT) → @default("PATIENT").
      // Function defaults (now(), cuid()) never appear on enum fields.
      const attrs = rest.replace(/@default\(([A-Za-z_][A-Za-z0-9_]*)\)/, (_m: string, v: string) => `@default("${v}")`);
      return `${indent}${field}${space}String${arrayType ?? ""}${optional ?? ""}${attrs}`;
    });
  }
  notes.push(`converted ${converted} enum-typed fields to String`);
}

// ── 4. PostgreSQL native types ──────────────────────────────────────────────
const before = schema.length;
schema = schema.replace(/\s+@db\.VarChar\(\d+\)/g, "").replace(/\s+@db\.Text/g, "");
if (schema.length !== before) {
  notes.push("dropped @db.VarChar(n) / @db.Text attributes (PostgreSQL-only native types)");
}

// ── 5. Json → String ────────────────────────────────────────────────────────
let jsonFields = 0;
schema = schema.replace(/^(\s*\w+\s+)Json(\?)?(\s|$)/gm, (_m, pre, opt = "", post) => {
  jsonFields += 1;
  return `${pre}String${opt}${post}`;
});
if (jsonFields > 0) notes.push(`converted ${jsonFields} Json fields to String (JSON-encoded)`);

writeFileSync(SCHEMA, schema, "utf8");

console.log("Schema transformed:\n");
for (const n of notes) console.log("  •", n);
if (notes.length === 0) console.log("  (nothing to do — already transformed)");
