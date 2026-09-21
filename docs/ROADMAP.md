# Development Roadmap — QUALITY Hearing Care

Order matters: each phase depends on the previous one. Nothing in later phases is started
without the owner's approval.

## Phase 0 — Foundation ✅ (this prompt)
- Next.js 15 + TypeScript + Tailwind v4 scaffold, App Router structure, route groups
  `(public)` / `(auth)` / `(portal)`.
- Design-token system + component primitives + branded shell (header/footer/portal sidebar).
- Placeholder pages for every planned public section (honest "planned module" notices —
  no fake data, no copied content).
- Starter Prisma schema (users/patients/staff/branches/audit_logs), dockerized Postgres,
  RBAC permission matrix, audit helper, security headers, docs (audit, architecture,
  database, RBAC, design system, roadmap).

## Phase 1 — Authentication & identity (NEXT)
- Auth.js v5 credentials login, bcrypt hashes, DB sessions, register → patient profile.
- RBAC middleware guarding `/portal/*`; role-based redirects; logout; account activation.
- First real server actions with Zod validation + audit events.
- Admin/Super-admin **seed-only** bootstrap account (no open registration for staff).
- **Acceptance:** a PATIENT can register, log in, and see an empty-but-real dashboard;
  unauthorized portal access redirects; logins appear in `audit_logs`.

## Phase 2 — Organization & scheduling
- Admin CRUD: branches, services, staff, working hours.
- Slot generation per branch/service/provider; conflict-safe booking transaction.
- Public service pages become data-driven; booking flow (public + patient portal).
- Notifications table + in-app bell; email transport hook.
- **Acceptance:** a slot cannot be double-booked at DB level; branch staff can manage
  appointments within their branch only.

## Phase 3 — Clinical core (audiology)
- Hearing assessments + test results (PTA air/bone, speech SRT/WRS/SAT, tympanometry,
  ABR, OAE, vestibular, tinnitus — data entry forms per test type).
- Audiogram model + visualization (SVG chart, per-ear thresholds, print-friendly).
- Clinical notes (signed, revision-safe), report generation (PDF) + guarded downloads.
- Audiologist dashboard: worklist, review state machine.
- **Acceptance:** audiologists can record a full PTA and produce a signed audiogram report;
  patients see results only for themselves; all access audited.

## Phase 4 — Hearing-aid lifecycle + therapy
- Catalogue admin: brands → models → features; branch availability.
- Recommendation → demo → fitting → warranty → repair/service records.
- Therapy services, therapy plans, sessions, progress tracking, follow-ups queue.
- **Acceptance:** full hearing-aid workflow traceable per patient; therapist can run a
  plan → session → progress loop.

## Phase 5 — CMS, comms & hardening
- Blog CMS + Gallery CMS (object storage for images), notifications center.
- Rate limiting (auth/booking), MFA/OTP optional, data-export tooling (audit-logged),
  backup/restore runbook, staging deploy, Lighthouse/a11y pass.

## Phase 6 — Go-live
- Production deploy (managed Postgres + object storage + HTTPS), monitoring, error tracking,
  seed real branch/service content with the owner, staff training, launch.## Explicitly out of scope until defined

- Any automatic diagnosis / clinical scoring. Conclusions are entered by professionals only.
- Payments/insurance, telephony, lab integrations — future decisions with the owner.
- Real patient data entry (no fake seed patients beyond auth-testing placeholders removed
  before go-live).

---

# REVISED ROADMAP (owner decision, 2026-09-17)

The product is now a **simple clinic website + guest appointment booking + one
clinic-operations portal**, for **one clinic in Hyderabad**. Clinical core (Phase 3),
hearing-aid lifecycle (Phase 4), therapy, patient accounts, multi-branch management and
the audiologist/super-admin portals are **deferred, not deleted** — code, schema, and
tests remain and compile; they are simply not part of the primary product, and their
routes are closed.

## Revised Phase 1 — Public clinic website ✅
All public pages exist and are data-driven where the business manages content
(services, branches, hearing-aid catalogue).

## Revised Phase 2 — Guest appointment booking ✅ (2026-09-18)
- `/book-appointment`: 7-step public wizard (branch → service → date → slot → details
  → review → confirmation). No account required.
- Server-side booking through the existing conflict-safe scheduling service; the
  partial unique index makes active-slot double-booking impossible at DB level.
- Idempotency keys (double-click/retry safe), rate limiting on all public endpoints.
- Guest self-service: `QHC-XXXXXXXX` reference, one-time manage token (view/cancel),
  two-factor lookup (`/booking-lookup`).
- Admin worklist: search/filter, status machine, atomic reschedule, guest badges.
- Email/SMS seam prepared (`src/lib/notifications.ts`) — honest no-op until a provider
  is configured.
- Tests: 29 guest-booking checks + regression suites for phases 2–3 (27) and 4 (50).

## Revised Phase 3 — Role simplification & portal cleanup ✅ (2026-09-19)
- **One operations portal** (`/portal/admin`, titled "Clinic operations") shared by
  `ADMIN` and `CLINIC_STAFF`; `/portal/clinic/**` consolidated into it.
- **Deferred portals closed**: patient, audiologist, therapist and super-admin areas
  redirect to `/portal/unavailable` instead of rendering dashboards the client never
  asked for. Enum values, tables, clinical code and tests are preserved.
- **Nav rebuilt** to clinic operations: Dashboard, Appointments, Home Consultations,
  Availability (slot generation, moved out of the legacy clinic desk), Services,
  Hearing Aids, Clinic Information, Enquiries.
- **Four placeholder modules removed** (Patients, Staff, Reports, User Accounts — each
  was an empty "will open here" page) and redirected; patient contact search lives in
  the appointments worklist.
- **Clinic Information** now edits the single Hyderabad clinic: address, phone, website
  visibility, online-booking switch and the home-consultation settings (enabled, service
  areas, max per day, note). Non-published records are listed as hidden, not deleted.
- **Credentials**: nothing is rendered anywhere; `/login` is a staff sign-in page,
  unlinked and `noindex`.
- No schema changes, no data deleted.

## Revised Phase 4 — Notifications & production prep (NEXT)
Email/SMS provider integration (the seam is ready), a11y + performance pass, security
review, provisioning a real admin account with a unique password, deployment preparation.

Full detail of the implemented guest phase: `docs/SCOPE-REVISION.md` §12.
