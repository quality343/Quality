/**
 * Build-time environment check (runs as the first step of `build:netlify`).
 *
 * Fails the deploy when a required variable is missing or still pointing at
 * localhost, so a broken production site is caught before it is published
 * rather than discovered by the first visitor who tries to sign in.
 *
 * Enforcement:
 * - strict when Netlify says this is a production deploy (CONTEXT=production),
 *   when NETLIFY=true, or when ENV_CHECK_STRICT=true
 * - advisory everywhere else (local `npm run env:check` prints the report and
 *   exits 0, so it stays useful during development)
 *
 * Escape hatch: SKIP_ENV_CHECK=true (documented in docs/DEPLOYMENT.md).
 */
import { checkProductionEnv, formatFindings, hasErrors } from "../src/lib/env-guard";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

if (process.env.SKIP_ENV_CHECK === "true") {
  console.log("[env] SKIP_ENV_CHECK=true — skipping environment validation.");
  process.exit(0);
}

const findings = checkProductionEnv();
const strict =
  process.env.ENV_CHECK_STRICT === "true" ||
  process.env.NETLIFY === "true" ||
  process.env.CONTEXT === "production";

console.log(formatFindings(findings));

if (hasErrors(findings)) {
  if (strict) {
    console.error(
      "\n[env] Failing the build. Fix the ERRORS above in Netlify → Site configuration → Environment variables.",
    );
    process.exit(1);
  }
  console.warn(
    "\n[env] Not a production deploy, so these are reported but not fatal. " +
      "They WILL fail a Netlify production build.",
  );
}
