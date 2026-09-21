# Authentication & Identity — QUALITY Hearing Care

Status: implemented in Phase 1. This document reflects the actual implementation.

## 1. Stack

- **Auth.js v5** (`next-auth@5beta`) with the **credentials provider**
- **JWT sessions** (stateless, HttpOnly, SameSite=Lax cookie, 8-hour expiry)
- **bcryptjs** password hashing, cost factor 12
- **Prisma** identity models: `User`, `Patient`, `Staff`, `Branch`, `AuditLog`

JWT (not database sessions) was chosen so middleware can gate routes at the edge
without a DB round-trip; the tradeoff (no instant server-side revocation) is
listed in §9.

## 2. Roles

`UserRole` enum on `User.role` (database-backed):

| Role | Portal home | Status | Provisioned via |
| --- | --- | --- | --- |
| `ADMIN` | `/portal/admin` | **Active** | Internal only (seed / test scripts) |
| `CLINIC_STAFF` | `/portal/admin` | **Active** | Internal only (seed / test scripts) |
| `SUPER_ADMIN` | `/portal/admin` | Deferred | One-time bootstrap script (§7) |
| `AUDIOLOGIST` | → `/portal/unavailable` | Deferred | Internal only |
| `THERAPIST` | → `/portal/unavailable` | Deferred | Internal only |
| `PATIENT` | → `/portal/unavailable` | Deferred | Public self-registration (kept for a later phase) |

Updated 2026-09-19: the product ships **one** portal — clinic operations — shared by
`ADMIN` and `CLINIC_STAFF`. The legacy clinic desk (`/portal/clinic/**`) is consolidated
into `/portal/admin/**`; deferred areas (`patient`, `audiologist`, `therapist`,
`super-admin`) are closed and redirect to `/portal/unavailable`. See `docs/RBAC.md`.

`/login` is now a **staff sign-in** page: not linked from the public site, `noindex`,
and it tells visitors that booking needs no account.

## 3. Identity relationships

```
User (login identity: email, phone, passwordHash, role, isActive)
 ├── 1:1 Patient   (patients; created at public registration)
 └── 1:1 Staff     (audiologist/therapist/clinic staff/admins; branch assignment)
```

- A user is a patient **or** a staff member, never both (service-layer rule).
- `passwordHash` is never selected into client-visible payloads.
- Deactivation (`isActive=false`) blocks login without destroying history.

## 4. Flows

### Patient registration (`/register`)
1. Client form → Server Action (`registerAction`).
2. Zod validation: name, email, Indian mobile (normalized to 10 digits),
   password ≥8 with letter+number, confirm-match.
3. Duplicate email/phone → field errors (pre-check + `P2002` race handling).
4. `User` (role PATIENT) + `Patient` (auto MRN) created in one transaction.
5. Auto sign-in → redirect to `/portal/patient`.
6. Audit: `auth.register.success` / `auth.register.duplicate`.

### Login (`/login`)
- Identifier = email **or** mobile number.
- `authorize()` compares bcrypt with a **dummy-hash equalizer** when the user
  doesn't exist → uniform timing and one generic error message (prevents user
  enumeration).
- Inactive accounts are rejected and audited (`auth.login.blocked_inactive`).
- Success → JWT carries `{ sub, role, phone }` → role-based redirect.
- Audit: `auth.login.success` / `auth.login.failure`.

### Logout
- Server action (`logoutAction`) → audit `auth.logout` → cookie cleared → `/`.

### Password reset
- Not implemented (no email infrastructure yet). The login page says so
  explicitly and points to the branch — **no fake reset emails are sent**.
- `hashPassword()`/`verifyPassword()` in `src/server/auth/password.ts` and the
  `passwordSchema` in `src/lib/validation/auth.ts` are the extension points.

## 5. Route protection (three layers)

1. **Edge middleware** (`src/middleware.ts`): `/portal/**` requires a valid JWT
   cookie; otherwise → `/login?next=…`. Role↔prefix map:
   `patient→PATIENT`, `audiologist→AUDIOLOGIST`, `therapist→THERAPIST`,
   `clinic→CLINIC_STAFF`, `admin→ADMIN+SUPER_ADMIN`, `super-admin→SUPER_ADMIN`.
   Wrong role → redirect to the user's own portal home. Unknown area → own home.
   Security headers are set here on every response.
2. **Server layouts**: each role area's layout calls `requireRole(ROLE)` —
   redirecting unauthorized users even if middleware were bypassed.
3. **Utilities** (`src/lib/auth/guards.ts`): `getCurrentUser()`, `requireAuth()`,
   `requireRole()`, `hasRole()`, `canAccess()`, plus throwing variants
   (`requireUser()`, `requireRoleOrThrow()`, `requirePermissionOrThrow()`) for
   API routes/actions. Roles are **always** read from the server session, never
   from client input.

The middleware uses a deliberately **edge-safe** auth config (no Prisma/bcrypt);
the full config lives in `src/server/auth/config.ts` behind `/api/auth/*`.

## 6. Audit events (Phase 1 vocabulary)

`auth.login.success`, `auth.login.failure`, `auth.login.blocked_inactive`,
`auth.logout`, `auth.register.success`, `auth.register.duplicate`,
`bootstrap.super_admin`. Records never contain passwords, tokens, or PHI —
actor id, action, entity, IP/UA only. Viewer UI arrives in a later phase
(data is already accumulating).

## 7. First SUPER_ADMIN bootstrap

```bash
SUPER_ADMIN_NAME="Owner Name" \
SUPER_ADMIN_EMAIL="owner@yourdomain" \
SUPER_ADMIN_PASSWORD="use-a-long-strong-password" \
npx tsx scripts/seed-super-admin.ts
```

- Creates the SUPER_ADMIN (+ linked `Staff` row), audit-logged.
- Existing email? Re-run with `--promote` to grant the role and reset password.
- **Remove the env values afterwards.** Never commit them.
- No public registration path exists for any staff role.

## 8. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✔ | PostgreSQL connection (local dev: project-local instance, port 5433) |
| `AUTH_SECRET` | ✔ | JWT signing (generate: `openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | dev/proxy | `true` when running behind a trusted host/proxy |
| `NEXT_PUBLIC_SITE_URL` | – | Canonical URL for metadata |
| `SUPER_ADMIN_NAME/EMAIL/PASSWORD` | bootstrap only | One-time seed; remove after use |

## 9. Local development setup

```bash
npm install
powershell -NoProfile -File scripts/dev-db-start.ps1   # project-local PG16 on :5433
npx prisma migrate dev                                  # apply schema
npm run dev                                             # http://localhost:3000
```

The dev DB data directory (`.localdb/`) is gitignored. First run needs
`initdb` (see the script's header comment).

## 10. Security considerations & remaining work

Implemented: bcrypt(12) hashing; HttpOnly/SameSite=Lax JWT cookies; uniform
auth-failure messaging; duplicate-field signup errors; server-side role
enforcement at middleware + layout + utility layers; audit trail; security
headers (`X-Frame-Options`, `nosniff`, referrer, permissions-policy); no
secrets in source; Zod validation on every auth boundary.

Remaining for production review (tracked in ROADMAP):

- **Rate limiting** on login/register (strategy: per-IP + per-identifier sliding
  window at the middleware/action layer) — Phase 2.
- **Server-side session revocation** (JWT strategy revokes on cookie loss/
  password change only) — revisit if instant revocation becomes a requirement.
- Password reset via email/SMS OTP — when messaging infrastructure lands.
- MFA for staff roles — recommended before go-live.
- Formal compliance review (this project makes **no** HIPAA/regulatory
  certification claim; practices here are sensible baselines, not legal
  compliance).
