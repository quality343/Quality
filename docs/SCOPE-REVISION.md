# Simplified Clinic Website — Codebase Audit

Scope change (2026-09-17): from full clinical platform to a simple clinic website with
appointment booking. This audit inventories what exists, what the new scope needs, and
what happens to completed work. **No code was changed for this document.**

> **UPDATE (Revised Phase 2, 2026-09-18): guest booking is now implemented.**
> See §10 at the bottom of this document. Registered-patient booking, the full
> clinical core, and the hearing-aid lifecycle remain as before; guests can now
> book without an account.

## 1. Current architecture

- Next.js 15 App Router + React 19 + TypeScript, Tailwind v4 design tokens.
- Route groups: `src/app/(public)` (marketing), `(auth)` (login/register/logout),
  `(portal)` (six role-protected portals).
- Server services layer (`src/server/services/*.ts`) — authorization + Zod validation
  + audit inside every mutation. Server actions thin-wrap these.
- Prisma + PostgreSQL, Auth.js v5 (JWT session cookie, edge middleware), bcrypt hashes.
- Central RBAC: `src/lib/rbac/permissions.ts` (6 roles × 38 permissions),
  `src/lib/auth/guards.ts`, middleware portal-prefix enforcement, per-portal layouts.
- Audit trail (`AuditLog`) with append-only discipline; security headers in middleware.

## 2. Existing routes & dashboards (63 route files)

- **Public (12):** home, about, services, diagnostic-services, hearing-tests,
  hearing-aids (+brands), therapy-services, cochlear-implant, branches, gallery, blog,
  contact, book-appointment.
- **Auth (3):** login, register, logout.
- **Portals (48):** patient (8 pages), audiologist (9), therapist (7), clinic (5),
  admin (9), super-admin (7).
- **API (5 areas):** `/api/health`, `/api/auth/*`, `/api/slots`, `/api/reports/[id]`,
  `/api/aid-catalogue`.

## 3. Database models (Prisma, 33 models)

Identity: User, Patient, Staff, Branch, AuditLog.
Scheduling: Service, BranchService, AppointmentSlot (unique slotId on Appointment →
DB-level double-booking prevention), Appointment, Notification.
Clinical (deferred): HearingAssessment, TestResult, Audiogram, ClinicalNote, Report,
FollowUp.
Hearing-aid lifecycle (deferred): Brand, Model, Feature (+join), InventoryItem,
Recommendation, Demo, Fitting, Dispensing, Warranty, ServiceRecord, Accessory
(+compatibility), AftercareFollowUp.
CMS-ready: GalleryItem.

## 4. Roles & permissions today

Six roles: PATIENT, AUDIOLOGIST, THERAPIST, CLINIC_STAFF, ADMIN, SUPER_ADMIN.
Enforcement is layered (middleware → portal layouts → service-layer permissions);
patient/staff data separation and branch scoping are tested. Staff accounts are
seed-only (no public staff registration).

## 5. Booking functionality already implemented

- Admin/clinic: slot generation (branch/day/window/length, idempotent), appointment
  list with server-validated status machine (BOOKED → CHECKED_IN → IN_PROGRESS →
  COMPLETED; CANCELLED/NO_SHOW frees the slot), book-for-patient (walk-in/phone).
- Patient: booking wizard (branch → service → live open slots via `/api/slots` →
  confirm), cancellations, in-app notifications.
- Integrity: concurrent double-booking race test passes (exactly one winner);
  cross-role denials and branch-scoping tested.
- Gap vs new scope: booking **requires a patient account** today. The revised product
  wants guest booking with name + mobile (no account, no login).

## 6. Retain (required for the simplified website)

- Whole foundation: stack, design system, branding, security headers, middleware.
- Auth.js login + PATIENT role (optional accounts for status tracking).
- Branch / Service CRUD + public data-driven pages (already exist).
- Slot generation, appointment state machine, conflict-safe booking (all of it).
- Notifications (in-app) — Phase 4 target "booking status".
- AuditLog (keep for admin actions; cheapest security win in the codebase).
- Admin portal shell + branches/services/appointments pages (nearly the whole
  "Admin dashboard" phase is already built).

## 7. Defer (hide from navigation, keep code + tables intact)

- Audiologist / Therapist / Super-admin portals (routes stay; middleware keeps guarding
  them; nav entries are the switch).
- Clinical core: assessments, tests, audiograms, notes, reports.
- Hearing-aid lifecycle internals (recommendation→fitting→dispensing→warranty→service);
  the **public hearing-aids page** stays as a catalogue browser (read-only).
- Blog/Gallery CMS placeholders.

## 8. Safe modifications required (new scope only)

1. **Guest booking**: extend `bookAppointment` to accept `{name, mobile, …}` without a
   session; create/find a lightweight patient record server-side; add
   `Patient.isGuest` + nullable `userId` (currently required) + a booking-lookup token
   for confirmation/status without an account. Branch-scoped duplicate protection
   (same mobile + same slot already blocked by the unique slot constraint).
2. **Portal slimming**: hide staff-only nav for the initial product; keep ADMIN +
   CLINIC_STAFF merged as "Admin / Clinic Staff" (ADMIN already covers clinic pages).
3. **Landing CTA**: `/book-appointment` currently routes guests to register/login —
   change to the guest booking form.

## 9. Risks of simplifying (and mitigations)

- Guest patients weaken the "clinical data belongs to a record" guarantee → mitigate:
  clinical modules stay permission-gated and unreachable for guest records (they have
  no user), no scope creep by leaving service code untouched.
- Two-role claim vs six-role data: keep the enum as-is (harmless), simply don't
  provision extra staff roles; avoids a destructive migration.
- Hearing-aid public page must not leak internal data — already true (unit cost is
  staff-only, catalogue price is public).
- Deletion temptation: none — every deferred module compiles and is covered by the
  77 integration tests; hiding nav is reversible.

## 10. Validation run for this audit

- `npm run lint` — clean (0 problems).
- `npx tsc --noEmit` — clean.
- App live at :3300 (HTTP 200, `/api/health` ok).
- DB spot check: 12 users, 7 open slots, 1 appointment (dev data).

## 11. Recommendation

Phase 1 of the revised plan is ~90% complete (all public pages exist; hearing-aids
page shows the real catalogue). The next implementation step is **guest appointment
booking** (Phase 2): the DB migration for guest patients, the server-side booking
extension, the public booking form with slot picker, and a confirmation page — reusing
the existing conflict-safe scheduling service unchanged.

## 12. Revised Phase 2 — IMPLEMENTED (2026-09-18)

Guest booking is live. Summary of what was built:

**Data model** (`20260917120000_guest_booking`, `20260917130000_branch_online_flag`,
`20260918090000_slot_rebookable`):
- `Patient.userId` nullable + `isGuest` flag → guests book without accounts; same
  mobile reuses one guest row (future account-link path).
- `Appointment.bookingRef` (public `QHC-XXXXXXXX`), `manageTokenHash` (SHA-256 of a
  one-time-shown token), `idempotencyKey` (unique — replays return the original).
- `Branch.acceptsOnlineBookings` master switch for public booking.
- **Slot rebookability fix:** the blanket `unique(Appointment.slotId)` was replaced by a
  partial unique index over ACTIVE statuses (`BOOKED/CHECKED_IN/IN_PROGRESS`). A
  cancelled appointment keeps its slot reference for history but releases the time for
  rebooking. (Found by the race test — cancelled slots were previously unrebookable.)

**Public flow** (`/book-appointment`): 7-step wizard (branch → service → date → time →
details → review → confirmation), mobile-first, no auth required. CTAs across the site
preselect branch/service via validated URL params. Availability comes from the public
`GET /api/slots` (rate-limited, no PHI); the server re-validates everything at confirm.

**Server-side guarantees** (spec 4–8): branch active + online-booking on, service
active + offered at that branch, slot OPEN and in the future — all inside the booking
transaction; `slotId` exclusivity enforced by the partial index (double-booking is a
db-level impossibility; losers get a friendly "no longer available" message). Idempotency
keys make double-clicks/retries return the original booking. All inputs Zod-validated
(mobile normalized to 10-digit, email optional-but-validated, note ≤300 chars).

**Guest self-service**: confirmation shows the manage link (`/booking/QHC-…?token=…`);
lookup page (`/booking-lookup`) needs reference **and** mobile (two factors); cancel
requires the private token and only works before the appointment time; the slot is
released on cancel.

**Admin** (`/portal/admin/appointments`): search by name/mobile, filter by branch /
service / status / date, inline confirm / check-in / start / complete / cancel /
no-show, and atomic reschedule (`/api/staff-slots` feeds the picker; the move itself is
one transaction — old slot released, new claimed).

**Notifications**: `src/lib/notifications.ts` is the email/SMS seam — `notifyBookingEvent`
fans events out, and with no provider configured nothing is sent and nothing claims to
be. Provider wiring = implement two functions, flip `NOTIFY_EMAIL`/`NOTIFY_SMS`.

**Tests**: `scripts/test-guest-booking.ts` — 29 checks (booking round-trip, token
security, idempotent replay, 3-way concurrent race, validation matrix, slot rejection
matrix). Full suites: phases 2–3 (27) and phase 4 (50) still pass.

## 13. Role simplification & portal cleanup (2026-09-19)

The client confirmed the product is **one clinic in Hyderabad**. Roles were reduced to the
two the business actually has, without deleting anything:

**Actives.** `ADMIN` and `CLINIC_STAFF` are one product role — one portal
(`/portal/admin`, "Clinic operations"), one nav, one permission set. `CLINIC_STAFF` gained
branch, service, staff and hearing-aid catalogue administration so both roles do the same
job; clinical write permissions stayed out of both.

**Deferred (code + data preserved, routes closed).** `AUDIOLOGIST`, `THERAPIST`,
`SUPER_ADMIN` and `PATIENT` all redirect to `/portal/unavailable`, which explains the
product scope and offers the paths that do exist. `/portal/clinic/**` (legacy clinic desk)
is consolidated into `/portal/admin/**` with permanent redirects, so old bookmarks work.

**Navigation** now matches the clinic's actual work: Dashboard, Appointments, Home
Consultations, Availability, Services, Hearing Aids, Clinic Information, Enquiries. The
slot generator moved out of the legacy clinic desk into **Availability**.

**Placeholders removed.** Four portal pages (Patients, Staff, Reports, User Accounts) were
empty "will open here" stubs from the platform phase; each is now a redirect, and the
capabilities they hinted at live in the appointments worklist or are documented as
deferred. Nothing clinical is exposed as an operational module.

**Clinic information** (single record) became editable: name, address, city, phone, website
visibility, online-booking switch, and home-consultation settings (enabled, service areas,
maximum per day, note). Unpublished records are listed as "Not published" — never deleted,
and never shown publicly.

**Security.** No credentials are rendered anywhere in the application. `/login` is a staff
sign-in page: not linked from the public site, `noindex`, and explicit that patients do not
need an account. Test/seed scripts keep their own local values and are not served over HTTP;
production needs a freshly provisioned admin account with a unique password.

**Verification.** No schema change, no data deleted. Lint, `tsc`, production build and all
regression suites (guest booking, phases 2–3, phase 4) pass, plus live checks that a guest
cannot reach `/portal/admin`, deferred areas redirect, and every public page still loads.
