/**
 * Deploy-time migration runner.
 *
 * Why this exists instead of running bare `prisma migrate deploy`:
 *
 * Prisma's migration engine issues DDL, which a *pooled* connection in
 * transaction mode (PgBouncer, Neon's `-pooler` host, Supabase's port 6543)
 * cannot reliably carry — migrations fail against the very URL the app needs at
 * runtime. So we run migrations against `DIRECT_URL` when it is set, and leave
 * the pooled `DATABASE_URL` untouched for the running app.
 *
 * Behaviour:
 * - `DIRECT_URL` set     → migrate through it (recommended in production).
 * - only `DATABASE_URL`  → migrate through that (fine locally / a plain DB).
 * - both missing         → exit 1 with a readable message.
 * - `SKIP_DB_MIGRATE=true` → skip entirely (branch/preview builds with no DB).
 *
 * Never prints the connection string — credentials must not reach build logs.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { loadLocalEnv } from "./load-local-env";

// Netlify injects the real environment; locally this reads .env. An explicitly
// exported URL always wins (see scripts/load-local-env.ts).
loadLocalEnv();

const pooled = process.env.DATABASE_URL;
const direct = process.env.DIRECT_URL || pooled;

if (process.env.SKIP_DB_MIGRATE === "true") {
  console.log("[migrate] SKIP_DB_MIGRATE=true — skipping database migrations.");
  process.exit(0);
}

if (!direct) {
  console.error(
    [
      "[migrate] No database connection configured.",
      "          Set DIRECT_URL (preferred) or DATABASE_URL to your production Postgres URL,",
      "          or set SKIP_DB_MIGRATE=true if this build should not touch the database.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(
  process.env.DIRECT_URL
    ? "[migrate] Running migrations over the direct (non-pooled) connection."
    : "[migrate] DIRECT_URL is not set — running migrations over DATABASE_URL.\n" +
        "          If that URL points at a pooler (PgBouncer / Neon -pooler / Supabase :6543),\n" +
        "          migrations may fail. Set DIRECT_URL to the unpooled host.",
);

/**
 * Run the Prisma CLI through `node` rather than the `npx` shim.
 *
 * Node refuses to spawn a `.cmd` file on Windows without a shell (the
 * CVE-2024-27980 hardening) and a shell would mean quoting a connection string
 * — something we deliberately avoid with credentials. Invoking the CLI's own
 * entry point is equivalent to `npx prisma` and portable.
 */
function prismaCommand(): { file: string; args: string[] } {
  try {
    const cli = createRequire(import.meta.url).resolve("prisma/build/index.js");
    return { file: process.execPath, args: [cli, "migrate", "deploy"] };
  } catch {
    return { file: process.platform === "win32" ? "npx.cmd" : "npx", args: ["prisma", "migrate", "deploy"] };
  }
}

const { file, args } = prismaCommand();
const result = spawnSync(file, args, {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});

if (result.error) {
  console.error("[migrate] Could not launch Prisma:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    "[migrate] `prisma migrate deploy` failed — see the output above.\n" +
      "          If it mentions P3005 or a shadow/pooler error, set DIRECT_URL to the\n" +
      "          unpooled host (see docs/DEPLOYMENT.md → Troubleshooting).",
  );
}

process.exit(result.status ?? 1);
