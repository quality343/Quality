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

export function checkProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
): EnvFinding[] {
  const findings: EnvFinding[] = [];
  const add = (f: EnvFinding) => findings.push(f);

  // ── Turso (libSQL) connection ─────────────────────────────────────────────
  const tursoUrl = env.TURSO_DATABASE_URL?.trim();
  if (!tursoUrl) {
    add({
      level: "error",
      variable: "TURSO_DATABASE_URL",
      message: "Not set — no page or API that touches data can render.",
      fix: "Set it to libsql://<database>-<org>.turso.io (Turso dashboard → the database). See docs/DEPLOYMENT.md.",
    });
  } else if (tursoUrl.startsWith("file:")) {
    add({
      level: "error",
      variable: "TURSO_DATABASE_URL",
      message: "Points at a local file, which a deployed function cannot reach.",
      fix: "Use the libsql:// URL of the Turso database. A file: URL is only for local, offline work.",
    });
  } else if (isLocalHost(hostOf(tursoUrl))) {
    add({
      level: "error",
      variable: "TURSO_DATABASE_URL",
      message: "Points at a local address that a deployed function cannot reach.",
      fix: "Replace it with the libsql:// URL of the Turso database.",
    });
  }

  // A remote Turso database rejects anonymous connections, so the token is as
  // required as the URL. Rotate it if it has ever been shared or committed.
  if (tursoUrl && !tursoUrl.startsWith("file:") && !env.TURSO_AUTH_TOKEN?.trim()) {
    add({
      level: "error",
      variable: "TURSO_AUTH_TOKEN",
      message: "Not set — a remote Turso database refuses anonymous connections, so every query fails.",
      fix: "Create a token in the Turso dashboard and set it. Treat it as a password: it grants read-write access.",
    });
  }

  // Left over from the PostgreSQL era. Harmless, but it means someone may still
  // believe the app is reading from Postgres.
  if (env.DATABASE_URL?.trim() && !env.SKIP_ENV_CHECK) {
    add({
      level: "warning",
      variable: "DATABASE_URL",
      message: "Is set, but the application now uses Turso — this value is ignored.",
      fix: "Remove it from Netlify (and from .env) so the real database is not misread. Keep the old Postgres instance until you have confirmed the migration.",
    });
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
