# Deployment — Netlify

QUALITY Hearing Care deploys to Netlify from `github.com/quality343/Quality`
(branch `main`). This document covers the one-time setup and the environment
variables the app actually reads.

The app is a server-rendered Next.js 15 application with Prisma on PostgreSQL,
so it needs a **hosted Postgres database** and a **set of environment
variables**. Nothing runs without them.

---

## 1. Environment variables

Set these in **Netlify → Site configuration → Environment variables**. Every
value here is read from `process.env` by the code — this list is exhaustive and
verified against `src/lib/env.ts`, `src/lib/env-guard.ts` and
`src/lib/notifications.ts`.

### Required

| Variable | Scope | Example / how to get it | What breaks without it |
|---|---|---|---|
| `DATABASE_URL` | server | `postgresql://user:pass@ep-xxx-pooler...neon.tech/db?sslmode=require&pgbouncer=true&connection_limit=1` | Every page that reads data throws. Must be **pooled** — serverless functions open many short-lived connections. |
| `DIRECT_URL` | server | Same as above but the **unpooled** host (Neon: drop `-pooler`; Supabase: port `5432`) | Migrations during build may fail through a transaction pooler. Strongly recommended. |
| `AUTH_SECRET` | server | `openssl rand -base64 32` | Auth.js cannot sign sessions — `/login` is unusable. Use a **different value per environment**; never reuse the dev one. |
| `AUTH_TRUST_HOST` | server | `true` | **The one that bites.** Auth.js v5 auto-trusts the host only on Vercel/Cloudflare. On Netlify's proxy, staff sign-in fails with `UntrustedHost`. |
| `NEXT_PUBLIC_SITE_URL` | build + client | `https://qualityhearing.netlify.app` (or the custom domain) | Canonical tags, `sitemap.xml` and `robots.txt` emit `localhost:3000`. Inlined at **build time** — changing it needs a redeploy, not a restart. |

`DATABASE_URL`, `DIRECT_URL` and `AUTH_SECRET` are secrets: put them in the
Netlify UI only, never in `netlify.toml` (which is committed).

### Optional

| Variable | Default | Purpose |
|---|---|---|
| `SKIP_DB_MIGRATE` | unset | Set `true` for a branch/preview deploy that must build without touching the database. |
| `SKIP_ENV_CHECK` | unset | Set `true` to bypass the build-time environment check. Emergency use only. |
| `NOTIFY_EMAIL` / `NOTIFY_SMS` | unset | **Leave unset.** No provider is implemented; enabling them would claim messages were sent. See `src/lib/notifications.ts` for the integration point. |
| `ADMIN_*` | unset | Used only by the one-time admin provisioning command (§5). Delete after running. |
| `SUPER_ADMIN_*` | unset | Legacy bootstrap for a **deferred** role. Leave unset for this product. |

`NODE_VERSION` and `NEXT_TELEMETRY_DISABLED` are set in `netlify.toml`; Netlify
provides `NODE_ENV` itself.

### Do not set

`SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` are test-suite fixtures. They must never
exist in a deployed environment.

---

## 2. One-time setup

1. **Create the database.** Neon or Supabase (both have free tiers). Create the
   project, then copy **both** connection strings — the pooled one for
   `DATABASE_URL`, the direct one for `DIRECT_URL`.
2. **Connect the repository.** Netlify → *Add new site* → *Import an existing
   project* → pick `quality343/Quality`.
3. **Confirm the build settings.** Netlify reads them from `netlify.toml`:
   - Build command: `npm run build:netlify`
   - Publish directory: `.next`
   - The Next.js runtime plugin (`@netlify/plugin-nextjs`) is auto-installed.
     `netlify.toml` also declares it explicitly.
4. **Add the environment variables** from §1 *before* the first deploy. The
   build fails on purpose if a required one is missing.
5. **Deploy.** Watch the build log for the pipeline in §3.

---

## 3. What the build does

`netlify.toml` sets the build command to `npm run build:netlify`, which runs
four steps in order:

```
npm install                          → postinstall: prisma generate
tsx scripts/check-env.ts             → validate environment (fails the deploy on error)
tsx scripts/migrate-deploy.ts        → prisma migrate deploy over DIRECT_URL
next build                           → compile and prerender
```

Two details worth knowing:

- **`prisma generate` runs automatically** via the `postinstall` script. Without
  it, `next build` fails on a missing Prisma engine. This is the single most
  common Next.js + Prisma + Netlify failure.
- **Migrations run at build time** through `DIRECT_URL`, not `DATABASE_URL`,
  because Prisma's migration engine issues DDL that a transaction pooler cannot
  carry. The URL is passed to the child process only — it never appears in the
  build log.

---

## 4. Schema changes after go-live

Locally, create and test a migration as usual (`npm run db:migrate`), commit the
generated folder under `prisma/migrations/`, and push. The next deploy applies
it. Never edit a migration that has already been applied to production.

To apply migrations manually against production:

```bash
DIRECT_URL="<production direct url>" npx prisma migrate deploy
```

---

## 5. Provision the real admin account

The test suite creates `admin.*@test.local` with a predictable password on every
run. That account is a test artifact and must **not** be the clinic's real login.

Create the real one against the production database:

```bash
DIRECT_URL="<production direct url>" \
ADMIN_NAME="Clinic Admin" \
ADMIN_EMAIL="qualityhearing.pro@gmail.com" \
ADMIN_PASSWORD="<unique strong password>" \
npx tsx scripts/provision-admin.ts
```

- Idempotent: re-running without flags changes nothing and tells you so.
- `--reset` rotates the password and re-asserts the `ADMIN` role.
- Rejects weak passwords (length, character classes, obvious words).
- Links a `Staff` row, and the clinic branch when exactly one branch exists.
- Writes a `bootstrap.admin` audit event.
- **Delete the `ADMIN_*` values afterwards.**

Staff sign in at `/login` (not linked from the public site). Fine-grained
authorization lives in `src/lib/rbac/permissions.ts`.

---

## 6. Verifying a deploy

```bash
npm run env:check        # same check the build runs, advisory locally
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm run build:netlify    # full production pipeline end to end
```

After deploying, confirm:

- `/` and the other nine public routes return 200.
- `/login` returns 200 and rejects bad credentials with a generic message.
- An anonymous request to `/portal/admin` is redirected to `/login`.
- `/sitemap.xml` and `/robots.txt` contain the production origin, not localhost.
- `/portal/*` responses carry `X-Robots-Tag: noindex`.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails: `Environment variable not found: DATABASE_URL` | Variable not set, or set only for *Functions* scope while the build needs it | Set it for **all** scopes (Build + Functions + Runtime). |
| Build fails: `@prisma/client did not initialize yet` | `postinstall` was skipped (`--ignore-scripts`) | Confirm the install command does not pass `--ignore-scripts`; it must not in `netlify.toml`. |
| Build fails on `prisma migrate deploy` | Migration ran over the pooler | Set `DIRECT_URL` to the unpooled host. |
| Build passes, but every page returns 500 | `DATABASE_URL` points at the pooler without `pgbouncer=true&connection_limit=1`, or the database is unreachable | Check the function logs — `src/instrumentation.ts` prints a loud `[env]` block at boot. |
| Staff sign-in fails, page reloads | `AUTH_TRUST_HOST` not `"true"` | Set it in the Netlify UI and redeploy. |
| `sitemap.xml` shows `localhost:3000` | `NEXT_PUBLIC_SITE_URL` missing or set after the build | Set it and **redeploy** (it is inlined at build time). |
| Preview/branch builds fail with no database | Preview contexts have no DB | Set `SKIP_DB_MIGRATE=true` for those contexts. |

---

## 8. Known limitations

- **E-mail and SMS are not wired.** `src/lib/notifications.ts` is a prepared
  seam: bookings are confirmed in-app only, and nothing claims a message was
  sent. Implement `sendEmail`/`sendSMS` there and flip `NOTIFY_EMAIL` /
  `NOTIFY_SMS` when a provider (Resend, SES, MSG91, Twilio) is chosen.
- **Rate limiting is documented, not enforced.** Public forms and the booking
  endpoint validate server-side but have no request throttle. If abuse appears,
  put Netlify's rate limiting or a WAF rule in front of
  `/book-appointment` and `/api/*`.
- **Photography is licensed stock** standing in for the clinic's own photos.
  See `public/images/README.md` for how to swap each one via `src/lib/images.ts`.
