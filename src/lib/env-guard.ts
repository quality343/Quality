/**
 * Production environment guard.
 *
 * Two callers share this logic so the rules can never drift:
 * - `scripts/check-env.ts` runs during the Netlify build, so a misconfigured
 *   deploy fails *before* it goes live.
 * - `src/instrumentation.ts` runs it once at server boot and reports the same
 *   findings in the function logs (cold starts are rare enough that a single
 *   loud block is enough to find the cause of a broken production deploy).
 *
 * `errors` mean the app cannot serve traffic correctly. `warnings` are things
 * that will silently degrade one feature — worth knowing, not worth an outage.
 *
 * SECURITY: this module only ever inspects env var *names*, lengths and URL
 * hosts. It never echoes a value, so nothing sensitive can reach a build log.
 */

export type EnvFinding = {
  level: "error" | "warning";
  variable: string;
  message: string;
  fix: string;
};

/** Hosts that only exist on a developer machine or inside CI. */
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "host.docker.internal"];

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalHost(host: string | null): boolean {
  return host !== null && LOCAL_HOSTS.includes(host);
}

/**
 * Signals a pooled (transaction-mode) connection. Prisma needs a *direct*
 * connection to run migrations, so a match here means `DIRECT_URL` should be set.
 */
function looksPooled(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("-pooler.") ||
    lower.includes("pgbouncer=true") ||
    lower.includes(":6543/") ||
    lower.includes("pooled")
  );
}

export function checkProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
): EnvFinding[] {
  const findings: EnvFinding[] = [];
  const add = (f: EnvFinding) => findings.push(f);

  // ── DATABASE_URL ──────────────────────────────────────────────────────────
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    add({
      level: "error",
      variable: "DATABASE_URL",
      message: "Not set — no page or API that touches data can render.",
      fix: "Add your hosted Postgres URL (Neon / Supabase / Railway). See docs/DEPLOYMENT.md.",
    });
  } else {
    const host = hostOf(databaseUrl);
    if (!host || isLocalHost(host)) {
      add({
        level: "error",
        variable: "DATABASE_URL",
        message: `Points at a local address that a deployed function cannot reach.`,
        fix: "Replace the project-local 127.0.0.1:5433 URL with a hosted, pooled Postgres URL.",
      });
    }
    if (looksPooled(databaseUrl) && !env.DIRECT_URL?.trim()) {
      add({
        level: "warning",
        variable: "DIRECT_URL",
        message:
          "DATABASE_URL looks pooled, but DIRECT_URL is not set. Migrations may fail over a transaction pooler.",
        fix: "Set DIRECT_URL to the unpooled host (Neon: same URL without `-pooler`; Supabase: port 5432).",
      });
    }
  }

  // ── AUTH_SECRET ───────────────────────────────────────────────────────────
  const authSecret = env.AUTH_SECRET?.trim();
  if (!authSecret) {
    add({
      level: "error",
      variable: "AUTH_SECRET",
      message: "Not set — Auth.js cannot sign sessions, so /login is unusable.",
      fix: "Generate with `openssl rand -base64 32` and set it. Use a different value per environment.",
    });
  } else if (authSecret.length < 32) {
    add({
      level: "error",
      variable: "AUTH_SECRET",
      message: `Too short (${authSecret.length} chars); Auth.js requires at least 32.`,
      fix: "Generate with `openssl rand -base64 32` and replace it.",
    });
  }

  // ── AUTH_TRUST_HOST ───────────────────────────────────────────────────────
  // Auth.js v5 auto-trusts the host only on Vercel/Cloudflare. Behind Netlify's
  // proxy it throws UntrustedHost and every staff sign-in fails.
  if (env.AUTH_TRUST_HOST?.trim() !== "true") {
    add({
      level: "error",
      variable: "AUTH_TRUST_HOST",
      message:
        'Not set to "true" — Auth.js will reject the request host and staff login will fail with UntrustedHost.',
      fix: 'Set AUTH_TRUST_HOST="true" on Netlify.',
    });
  }

  // ── NEXT_PUBLIC_SITE_URL ──────────────────────────────────────────────────
  // Inlined at build time: canonical URLs, sitemap.xml and robots.txt all use it.
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteHost = hostOf(siteUrl);
  if (!siteUrl) {
    add({
      level: "warning",
      variable: "NEXT_PUBLIC_SITE_URL",
      message: "Not set — sitemap.xml and robots.txt will emit http://localhost:3000 URLs.",
      fix: "Set it to the deployed origin (e.g. https://qualityhearing.netlify.app).",
    });
  } else if (isLocalHost(siteHost)) {
    add({
      level: "warning",
      variable: "NEXT_PUBLIC_SITE_URL",
      message: "Still points at localhost, so search engines would be given unreachable URLs.",
      fix: "Set it to the deployed origin and redeploy (it is inlined at build time).",
    });
  }

  // ── Notification switches ────────────────────────────────────────────────
  // No provider is wired yet; enabling these would claim messages were sent.
  for (const [name, label] of [
    ["NOTIFY_EMAIL", "email"],
    ["NOTIFY_SMS", "SMS"],
  ] as const) {
    if (env[name]?.trim() === "true") {
      add({
        level: "warning",
        variable: name,
        message: `Enabled, but no ${label} provider is implemented — nothing will actually be sent.`,
        fix: "Unset it, or implement the transport in src/lib/notifications.ts first.",
      });
    }
  }

  return findings;
}

export function formatFindings(findings: EnvFinding[]): string {
  if (findings.length === 0) return "Environment check: all required variables look correct.";

  const render = (level: EnvFinding["level"]) => {
    const group = findings.filter((f) => f.level === level);
    if (group.length === 0) return "";
    const heading = level === "error" ? "ERRORS (must be fixed)" : "WARNINGS (will degrade a feature)";
    return [
      heading,
      ...group.map((f, i) => `  ${i + 1}. ${f.variable}: ${f.message}\n     → ${f.fix}`),
    ].join("\n");
  };

  return ["Environment check found problems:", render("error"), render("warning")]
    .filter(Boolean)
    .join("\n\n");
}

export function hasErrors(findings: EnvFinding[]): boolean {
  return findings.some((f) => f.level === "error");
}
