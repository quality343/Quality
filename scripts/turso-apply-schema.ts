/**
 * Apply the baseline schema to Turso.
 *
 * Why this exists: Prisma Migrate does not support Turso (libSQL), so
 * `prisma migrate deploy` cannot be used against it. The supported workflow is
 * to render the schema to SQL and apply that SQL to the database — which is
 * exactly what this does, using the same libSQL client the app uses.
 *
 * It is:
 * - idempotent-ish: refuses to run if the schema already exists (pass --force to
 *   override), so it cannot silently half-apply over live data;
 * - safe to inspect: it prints the SQL file it is about to run and the tables it
 *   created, and never contains a credential.
 *
 * Usage:
 *   npx tsx scripts/turso-apply-schema.ts            # apply, refuse if tables exist
 *   npx tsx scripts/turso-apply-schema.ts --dry-run  # print the SQL only
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

const SQL_FILE = path.join("prisma", "migrations", "00000000000001_init_sqlite", "migration.sql");

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");

  if (!url) {
    console.error("TURSO_DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!url.startsWith("file:") && !authToken) {
    console.error("TURSO_AUTH_TOKEN is not set (required for a remote Turso database).");
    process.exit(1);
  }

  const sql = readFileSync(SQL_FILE, "utf8");
  const statements = sql.split(/;\s*(?:\r?\n|$)/).filter((s) => s.replace(/--.*$/gm, "").trim().length > 0);
  console.log(`Schema file: ${SQL_FILE}`);
  console.log(`Statements : ${statements.length}`);
  console.log(`Target     : ${url.replace(/\/\/.*@/, "//***@")}`);

  if (dryRun) {
    console.log("\n--- DRY RUN: SQL that would be applied ---\n");
    console.log(sql);
    return;
  }

  const client = createClient(authToken ? { url, authToken } : { url });

  const existing = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%'",
  );
  const existingNames = existing.rows.map((r) => String(r.name));

  if (existingNames.length > 0 && !force) {
    console.error(
      `\nRefusing to apply: the database already has ${existingNames.length} table(s), ` +
        `e.g. ${existingNames.slice(0, 5).join(", ")}.\n` +
        "Re-run with --force only if you intend to apply the baseline on top of existing data.",
    );
    process.exit(1);
  }

  // executeMultiple runs the whole script in one round trip. SQLite DDL is
  // transactional, so a failure part-way leaves no half-built schema.
  await client.executeMultiple(sql);

  const after = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%' ORDER BY name",
  );
  const indexes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'",
  );
  const partial = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type = 'index' AND name = 'Appointment_active_slot_unique'",
  );

  console.log(`\nTables created  : ${after.rows.length}`);
  console.log(`Indexes created : ${indexes.rows.length}`);
  console.log(
    `Double-booking guard present : ${partial.rows.length === 1 ? "YES (partial unique index on Appointment.slotId)" : "NO — PROBLEM"}`,
  );
  console.log("\nTables:");
  console.log("  " + after.rows.map((r) => String(r.name)).join(", "));
}

main().catch((e) => {
  console.error("\nAPPLY FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
