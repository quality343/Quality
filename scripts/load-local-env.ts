/**
 * Load `.env` for locally-run scripts.
 *
 * `next build` and `next dev` read `.env` themselves, but a bare `tsx script.ts`
 * does not — so `npm run env:check` and `npm run admin:provision` would look
 * unconfigured on a normal dev machine.
 *
 * SAFETY: Node's `process.loadEnvFile` does **not** override variables that are
 * already set (verified on Node 20.20). That matters here: when an operator runs
 * `DIRECT_URL="<production>" npx tsx scripts/provision-admin.ts`, the explicit
 * value always wins, so a stale local `.env` can never silently redirect a
 * production command at the dev database.
 *
 * Skipped entirely on Netlify, where the platform injects the real environment
 * and no `.env` file exists.
 */
export function loadLocalEnv(): void {
  if (process.env.NETLIFY || process.env.CONTEXT) return;
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // No .env file present — nothing to load.
  }
}
