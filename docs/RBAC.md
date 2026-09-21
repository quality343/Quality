# RBAC — QUALITY Hearing Care

Last revised: 2026-09-19 (role simplification & portal cleanup).

## 1. Product scope this model serves

QUALITY Hearing Care is a **single clinic in Hyderabad**: a public website, guest
appointment booking (clinic visit and home consultation), and **one clinic-operations
portal** for staff. There is no patient account portal, no audiologist portal, no
super-admin portal and no multi-branch administration in this release.

That gives **two operational access levels**:

| Level | Who | Access |
| --- | --- | --- |
| `PUBLIC / GUEST` | Visitors, patients | Website + booking, no account, no login |
| `ADMIN / CLINIC_STAFF` | Clinic operators | `/portal/admin/**` — the clinic-operations portal |

"Admin" and "Clinic Staff" are **one product role** with one portal and one permission
set (see §3). The `UserRole` enum still holds six values so existing rows keep working —
removing enum values would require a destructive migration and destroy history, which the
product rules forbid.

## 2. Role status

| Enum value | Status | Portal home | Notes |
| --- | --- | --- | --- |
| `ADMIN` | **Active** | `/portal/admin` | Clinic operations |
| `CLINIC_STAFF` | **Active** | `/portal/admin` | Same portal and permissions as ADMIN |
| `SUPER_ADMIN` | **Deferred** | `/portal/admin` | Retained for future platform work; `/portal/super-admin` is closed |
| `AUDIOLOGIST` | **Deferred** | → `/portal/unavailable` | Clinical tooling deferred |
| `THERAPIST` | **Deferred** | → `/portal/unavailable` | Therapy deferred |
| `PATIENT` | **Deferred** | → `/portal/unavailable` | Guests book without an account |

Deferred means: the enum value, the code, the database tables and the tests are all
preserved, but the routes render nothing and the portal is not linked anywhere.
`src/lib/rbac/permissions.ts` → `DEFERRED_PORTAL_AREAS` is the single list middleware
enforces.

## 3. Permission matrix (product-relevant permissions)

Enforced server-side in the service layer (`roleHasPermission`) — never by the UI.

| Permission | PATIENT | AUDIOLOGIST | THERAPIST | CLINIC_STAFF | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- | --- | --- |
| `appointment.book.self` | ✔ | | | | | |
| `appointment.manage.branch` | | ✔ | ✔ | ✔ | ✔ | ✔ |
| `patient.read` | | ✔ | ✔ | ✔ | ✔ | ✔ |
| `patient.read.own` | ✔ | | | | | |
| `service.request.create` | ✔ | | | | | |
| `branch.manage` | | | | ✔ | ✔ | ✔ |
| `service.manage` | | | | ✔ | ✔ | ✔ |
| `staff.manage` | | | | ✔ | ✔ | ✔ |
| `aid.catalogue.read` | | ✔ | | ✔ | ✔ | ✔ |
| `aid.catalogue.manage` | | | | ✔ | ✔ | ✔ |
| `aid.demo.manage` | | ✔ | | ✔ | ✔ | ✔ |
| `aid.service.manage` | | ✔ | | ✔ | ✔ | ✔ |
| `notification.send` | | | | ✔ | ✔ | ✔ |
| `report.view.org` | | | | ✔ | ✔ | ✔ |
| `user.manage` | | | | | ✔ | ✔ |
| `settings.manage` / `audit.read` / `role.assign` | | | | | | ✔ |
| Clinical writes (`assessment.*`, `audiogram.manage`, `note.create`, `report.generate`, `therapy.*`, `fitting.record`, `aid.dispense`, `aid.recommend.*`) | | ✔ (scoped) | ✔ (therapy) | **never** | `report.generate` only | as ADMIN |

`CLINIC_STAFF` was extended in this revision from a front-desk subset to full clinic
operations (branch, service, staff and catalogue administration) so the two operational
roles genuinely behave as one. It deliberately still has **no clinical write access** —
tests assert that (`scripts/test-phase4.ts`: "clinic lacks recommend.create",
"clinic lacks dispense", "clinic has demo.manage (ops)").

## 4. Enforcement points (defense in depth)

1. **Middleware** (`src/middleware.ts`, edge): session check for `/portal/**`, deferred-area
   redirect to `/portal/unavailable`, consolidation of `/portal/clinic/**` into
   `/portal/admin/**`, and area ↔ role enforcement driven by `PORTAL_ROLES` in
   `src/lib/rbac/permissions.ts` (one source of truth for both edge and server).
2. **Portal layouts**: `requireRole(...CLINIC_OPS_ROLES)` in the clinic-operations layout
   and in every page under it.
3. **Service layer** (`src/server/services/*`): every mutation takes the acting user and
   checks permissions + scope (`where: { patientId }` / `branchId` from the server).
4. **Server actions / route handlers**: Zod validation before delegating.
5. **UI**: nav and buttons are cosmetic; they never carry the authorization decision.

## 5. Denial behaviour

- Unauthenticated on `/portal/**` → redirect to `/login?next=…` (307). Verified for guests.
- Authenticated in the wrong area → redirect to own portal home (deferred roles then land
  on `/portal/unavailable`).
- Deferred areas (`patient`, `audiologist`, `therapist`, `super-admin`) → `/portal/unavailable`
  for every role; the page states the product scope and offers the paths that do exist.
- Server actions / handlers throw `ForbiddenError` → generic message, no internals leaked.
- Denied attempts are audit-logged (`access.denied`) with actor, route and required
  permission; no passwords or secrets are ever logged.

## 6. Credentials

No credentials, test or otherwise, are rendered anywhere in the application: not in public
pages, not in the portal, not in docs served by the site. Local development accounts are
created by seed/test scripts (`scripts/seed-*.ts`, `scripts/test-*.ts`) which are **not**
reachable over HTTP; their values live only in those scripts and in the operator's
environment. Production accounts must be provisioned with a unique password — see
`docs/AUTH.md` §7.

### 6.1 Account consolidation (2026-09-21)

The account list held 13 logins, all inherited from earlier phases. It was reduced to the
single operational administrator:

| | |
|---|---|
| **Active** | `qualityhearing.pro@gmail.com` — role `ADMIN`, linked to Kukatpally (KPHB) |
| **Deactivated** | 12 accounts (test artifacts, demo accounts, and the deferred legacy roles) |
| **Deleted** | none — see below |

**Why deactivate instead of delete.** `authorize()` already refuses an inactive user and
records `auth.login.blocked_inactive`, so `isActive = false` is a real lockout, not a
cosmetic flag. Deleting would have been actively harmful: `Staff.userId` is
`ON DELETE RESTRICT`, so the delete fails for anyone with a staff row, while
`AuditLog.actorId`, `Appointment.bookedById`, `Notification.userId` and `Patient.userId`
are `ON DELETE SET NULL` — silently erasing *who did what* from the audit trail and
detaching a patient's history. Every one of the 12 accounts in fact had references
(audit rows, a staff row, or a patient row), so none could be removed without loss.
Nothing was deleted, and appointments, services, branches, slots and audit records are
untouched.

**Legacy roles retired** (accounts deactivated, portals already closed): `CLINIC_STAFF`,
`AUDIOLOGIST`, `SUPER_ADMIN`, plus the `PATIENT` test logins. They remain valid values in
the `role` column — see §2 — but no active account holds one.

Maintenance script: `npx tsx scripts/consolidate-admin-accounts.ts` (reports by default;
`--apply` acts). It is idempotent, keeps the designated admin active **before** touching
anything else so the clinic cannot be locked out, and writes an
`admin.accounts.consolidated` audit event.

**One caveat worth understanding.** Sessions are JWTs, so a session issued *before* an
account was deactivated stays valid until it expires (8 hours) even though that account can
no longer sign in. Nothing in the current list had an outstanding session, but if you ever
deactivate a compromised account, also rotate `AUTH_SECRET` to invalidate every existing
token immediately.

**Keeping it clean.** `scripts/test-phases-2-3.ts` creates throwaway accounts
(`…@test.local`) and deletes them again in its `finally` block — verified: running the full
suite against the live database leaves exactly the one active admin. Their credentials live
only in those scripts, as §6 describes. Do not leave those accounts behind, and never let
one hold role `ADMIN` in production.

## 7. Upgrade path

The starter stores a single `role` text column on `users` (it was a PostgreSQL enum before
the Turso migration — SQLite cannot express one, so the vocabulary lives in
`src/lib/rbac/roles.ts` and the database no longer rejects an unknown value; authorization
still fails closed). If per-user overrides, multiple roles per person, or a real
multi-branch product return later, add `roles` + `user_roles` join tables and swap
`roleHasPermission()` internals — call sites (`requireRole`, `requirePermissionOrThrow`)
do not change.
