# Deployment — Netlify

QUALITY Hearing Care deploys to Netlify from `github.com/quality343/Quality`
(branch `main`). This document covers the one-time setup and the environment
variables the app actually reads.

The app is a server-rendered Next.js 15 application with Prisma on **Turso**
(libSQL/SQLite), so it needs a **Turso database** and a **set of environment
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
| `TURSO_DATABASE_URL` | server | `libsql://<database>-<org>.aws-ap-south-1.turso.io` — `turso db show <name> --url` | Every page that reads data throws. Do **not** use a `file:` URL here in production. |
| `TURSO_AUTH_TOKEN` | server | `turso db tokens create <name>` | A remote Turso database refuses anonymous connections, so every query fails. This token grants **read-write** access to all clinic data — treat it as a password. |
| `AUTH_SECRET` | server | `openssl rand -base64 32` | Auth.js cannot sign sessions — `/login` is unusable. Use a **different value per environment**; never reuse the dev one. |
| `AUTH_TRUST_HOST` | server | `true` | **The one that bites.** Auth.js v5 auto-trusts the host only on Vercel/Cloudflare. On Netlify's proxy, staff sign-in fails with `UntrustedHost`. |
| `NEXT_PUBLIC_SITE_URL` | build + client | `https://qualityhearingcarepro.in` — **already set in `netlify.toml`**, so nothing to add in the UI | Only an override: canonical tags, `sitemap.xml` and `robots.txt` fall back to that same domain from `src/lib/site-url.ts`. It is inlined at **build time** — changing it needs a redeploy, not a restart. |
| `GOOGLE_SHEETS_WEBHOOK_URL` | server | The Apps Script web-app URL, ending in **`/exec`** | Appointments are not mirrored to the spreadsheet. Bookings still work. |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | server | `openssl rand -hex 32`, matching `SHEET_WEBHOOK_SECRET` in the Apps Script | Same, plus the build fails if only one of the pair is set. |

`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET` and
`GOOGLE_SHEETS_WEBHOOK_SECRET` are secrets: put them
in the Netlify UI only, never in `netlify.toml` (which is committed). Never give
one a `NEXT_PUBLIC_` prefix — that would ship it to every browser. Any PostgreSQL
`DATABASE_URL`/`DIRECT_URL` left over from before the migration are ignored by
the application and can be deleted from Netlify.

### Optional

| Variable | Default | Purpose |
|---|---|---|
| `SKIP_DB_MIGRATE` | unset | Set `true` for a branch/preview deploy that must build without touching the database. |
| `SKIP_ENV_CHECK` | unset | Set `true` to bypass the build-time environment check. Emergency use only. |
| `NOTIFY_EMAIL` / `NOTIFY_SMS` | unset | **Leave unset.** No provider is implemented; enabling them would claim messages were sent. See `src/lib/notifications.ts` for the integration point. |
| `GOOGLE_SHEETS_TIMEOUT_MS` | `8000` | How long a booking waits for the spreadsheet before giving up. The mirror is best-effort, so keep this small. |
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
tsx scripts/db-prepare.ts            → apply the baseline schema on a first deploy,
                                       then verify the schema AND the double-booking guard
next build                           → compile and prerender
```

Two details worth knowing:

- **`prisma generate` runs automatically** via the `postinstall` script. Without
  it, `next build` fails on a missing Prisma engine. This is the single most
  common Next.js + Prisma + Netlify failure.
- **There is no `prisma migrate deploy` step any more.** Prisma Migrate does not
  support Turso, so migrations are not applied by Prisma at all — the schema is
  rendered to SQL and applied to Turso directly (see docs/DATABASE.md).
  `db-prepare.ts` applies it once on an empty database and verifies it on every
  later deploy, failing the build if the partial unique index that prevents
double-booking has gone missing.

---

## 4. Schema changes after go-live

Prisma Migrate does not support Turso, so this works differently from the
PostgreSQL era — there is no `prisma migrate dev` / `migrate deploy` here:

1. Edit `prisma/schema.prisma`.
2. Render the change to SQL and review it:
   ```bash
   npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma --script
   ```
3. Apply it to Turso (the Turso CLI, or `scripts/turso-apply-schema.ts` for the
   baseline) and confirm with `npm run db:verify`.

Never drop `Appointment_active_slot_unique` — it is the only thing preventing two
visitors from booking the same slot. `db-prepare.ts` fails the build if it is
missing. `prisma/migrations-postgres-archive/` keeps the old PostgreSQL history
for reference only; it is not applied to Turso.

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
- `/sitemap.xml` and `/robots.txt` contain `https://qualityhearingcarepro.in`, not localhost.
- `/portal/*` responses carry `X-Robots-Tag: noindex`.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails: `TURSO_DATABASE_URL is not set` | Variable not set, or set only for *Functions* scope while the build needs it | Set it for **all** scopes (Build + Functions + Runtime). |
| Build fails: `@prisma/client did not initialize yet` | `postinstall` was skipped (`--ignore-scripts`) | Confirm the install command does not pass `--ignore-scripts`; it must not in `netlify.toml`. |
| Build fails in `db-prepare.ts` | The database is missing tables, or the double-booking index was dropped | Re-apply `prisma/migrations/00000000000001_init_sqlite/migration.sql` (or `--force` if the schema genuinely needs rebuilding). |
| Build passes, but every page returns 500 | `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` wrong, expired, or the token lacks read-write access | Check the function logs — `src/instrumentation.ts` prints a loud `[env]` block at boot. A revoked Turso token is the usual cause. |
| Staff sign-in fails, page reloads | `AUTH_TRUST_HOST` not `"true"` | Set it in the Netlify UI and redeploy. |
| `sitemap.xml` shows an unexpected origin | `NEXT_PUBLIC_SITE_URL` set in the Netlify UI (that wins over `netlify.toml`) or set after the build | Correct it and **redeploy** (it is inlined at build time). Unset is fine — it falls back to the domain in `src/lib/site-url.ts`. |
| Preview/branch builds fail with no database | Preview contexts have no DB | Set `SKIP_DB_MIGRATE=true` for those contexts. |

---

## 8. Known limitations

- **E-mail and SMS are not wired.** `src/lib/notifications.ts` is a prepared
  seam: bookings are confirmed in-app only, and nothing claims a message was
  sent. Implement `sendEmail`/`sendSMS` there and flip `NOTIFY_EMAIL` /
  `NOTIFY_SMS` when a provider (Resend, SES, MSG91, Twilio) is chosen.
- **Rate limiting is documented, not enforced.** Public forms validate
  server-side but have no request throttle. If abuse appears, put Netlify's
  rate limiting or a WAF rule in front of `/contact` and `/api/*`.
- **The public booking flow was retired.** `/book-appointment`, `/booking/…`
  and `/booking-lookup` are permanent redirects to `/home-consultation` and
  `/contact`. The clinic is contacted by WhatsApp, phone or email instead; the
  admin portal still manages the internal appointment records.
- **Photography is licensed stock** standing in for the clinic's own photos.
  See `public/images/README.md` for how to swap each one via `src/lib/images.ts`.
