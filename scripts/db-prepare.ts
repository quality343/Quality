/**
 * Deploy-time database preparation.
 *
 * Replaces the old `prisma migrate deploy` step. That command cannot be used any
 * more: Prisma Migrate does not support Turso (libSQL), so migrations are not
 * applied with Prisma at all — the schema is rendered to SQL and applied to
 * Turso directly (see prisma/migrations/00000000000001_init_sqlite/migration.sql).
 *
 * Behaviour, designed to be safe to run on every deploy:
 * - tables already present → verify and continue, changing nothing;
 * - database empty         → apply the baseline schema (first deploy);
 * - `SKIP_DB_MIGRATE=true` → skip entirely (preview builds with no database).
 *
 * It never prints the connection string or the token.
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

const SQL_FILE = path.join("prisma", "migrations", "00000000000001_init_sqlite", "migration.sql");

const APPLICATION_TABLES = [
  "User",
  "Branch",
  "Service",
  "Staff",
  "AppointmentSlot",
  "Appointment",
  "ContactEnquiry",
  "AuditLog",
];

/**
 * Additive column migrations for databases created before a column existed.
 *
 * SQLite has no `ADD COLUMN IF NOT EXISTS`, and re-running an ALTER is an error,
 * so each entry is checked against `pragma_table_info` first and applied only
 * when missing. That makes this safe on every deploy: the fresh-database path
 * gets these columns from the baseline SQL, and an older database catches up
 * here. Only ever additive — nothing is dropped or rewritten.
 */
const COLUMN_ADDITIONS: { table: string; column: string; ddl: string }[] = [
  {
    table: "Appointment",
    column: "googleSheetSyncStatus",
    ddl: 'ALTER TABLE "Appointment" ADD COLUMN "googleSheetSyncStatus" TEXT',
  },
  {
    table: "Appointment",
    column: "googleSheetSyncedAt",
    ddl: 'ALTER TABLE "Appointment" ADD COLUMN "googleSheetSyncedAt" DATETIME',
  },
  {
    table: "Appointment",
    column: "googleSheetSyncError",
    ddl: 'ALTER TABLE "Appointment" ADD COLUMN "googleSheetSyncError" TEXT',
  },
];

function fail(message: string): never {
  console.error(`[db] ${message}`);
  process.exit(1);
}

async function main() {
  if (process.env.SKIP_DB_MIGRATE === "true") {
    console.log("[db] SKIP_DB_MIGRATE=true — skipping database preparation.");
    return;
  }

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url) fail("TURSO_DATABASE_URL is not set, so the build cannot verify the database.");
  if (!url.startsWith("file:") && !authToken) {
    fail("TURSO_AUTH_TOKEN is not set (required for a remote Turso database).");
  }

  const client = createClient(authToken ? { url, authToken } : { url });

  const existing = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%'",
  );
  const tables = existing.rows.map((r) => String(r.name));

  if (tables.length === 0) {
    console.log("[db] Empty database — applying the baseline schema (first deploy).");
    const sql = readFileSync(SQL_FILE, "utf8");
    await client.executeMultiple(sql);
    const after = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%' AND name NOT LIKE 'libsql_%'",
    );
    console.log(`[db] Applied. ${after.rows.length} tables created.`);
    return;
  }

  // Schema already there: confirm the tables the app cannot run without, and the
  // index that prevents double-booking, rather than assuming.
  const missing = APPLICATION_TABLES.filter((t) => !tables.includes(t));
  if (missing.length > 0) {
    fail(`Database is missing required table(s): ${missing.join(", ")}. The schema is out of date.`);
  }

  const guard = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'Appointment_active_slot_unique'",
  );
  if (guard.rows.length !== 1) {
    // Worth failing the build over: without it two visitors could book the same slot.
    fail(
      "The double-booking guard (partial unique index Appointment_active_slot_unique) is missing. " +
        "Re-apply prisma/migrations/00000000000001_init_sqlite/migration.sql before going live.",
    );
  }

  // Backfill any additive columns this database predates. Always a no-op once
  // applied, so it is safe on every deploy.
  let added = 0;
  for (const { table, column, ddl } of COLUMN_ADDITIONS) {
    const info = await client.execute(`PRAGMA table_info("${table}")`);
    const has = info.rows.some((r) => String(r.name) === column);
    if (has) continue;
    await client.execute(ddl);
    added += 1;
    console.log(`[db] Added missing column ${table}.${column}`);
  }
  if (added > 0) console.log(`[db] Applied ${added} additive column change(s).`);

  console.log(
    `[db] Schema present (${tables.length} tables), double-booking guard verified` +
      `${added > 0 ? `, ${added} column(s) added` : ""}.`,
  );
}

main().catch((e) => {
  console.error("[db] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
