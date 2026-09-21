/**
 * Next.js instrumentation — runs once when the server boots.
 *
 * We re-run the environment guard here so a misconfigured deploy is visible in
 * the function logs even if `npm run env:check` was bypassed (SKIP_ENV_CHECK,
 * or a variable changed in the Netlify UI without a redeploy).
 *
 * It deliberately logs rather than throws: the build step already refuses to
 * publish a misconfigured production deploy, so throwing here would only turn a
 * single broken feature into a total outage for visitors who came to read
 * about hearing care.
 */
export async function register() {
  // Only the Node.js runtime has the full environment (Edge middleware runs
  // with a restricted env and has no business reading DATABASE_URL).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // During `next build`, static generation also boots this module — the build
  // step already validated the environment, so don't repeat the report.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { checkProductionEnv, formatFindings } = await import("@/lib/env-guard");
  const findings = checkProductionEnv();

  if (findings.length > 0) {
    console.error(`\n[env] ${formatFindings(findings)}\n`);
  }
}
