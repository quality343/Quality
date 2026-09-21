# Database Domain Plan — QUALITY Hearing Care

## 0. Platform — Turso (libSQL), and what changed

The production database is **Turso** (libSQL), reached through Prisma's `@prisma/adapter-libsql`
driver adapter. The connection URL lives in the `TURSO_DATABASE_URL` environment variable and is
deliberately **not** written down here — this repository is public, and the database host is not
something a stranger needs. The project ran on
PostgreSQL before this migration; the old PostgreSQL migration history is preserved in
`prisma/migrations-postgres-archive/` and is no longer applied anywhere.

Turso is SQLite-compatible, and Prisma's SQLite connector supports a **narrower language** than
its PostgreSQL one. Three things had to change, and they are the whole cost of the migration:

| PostgreSQL feature | Turso/SQLite | Consequence |
|---|---|---|
| 29 `enum` blocks | plain `TEXT` | The database no longer rejects an unknown value. The vocabulary lives in `src/lib/rbac/roles.ts` (roles) and `CLINICAL_TEST_TYPES` (test kinds). Authorization fails **closed**: `roleHasPermission()` denies anything it does not recognise. |
| 4 `Json` columns (`TestResult.payload`, `Audiogram.data`, `Report.content`, `AuditLog.metadata`) | `TEXT`, JSON-encoded | Read with `parseJsonSafe()` (`src/lib/json.ts`), write with `JSON.stringify()`. Decoding happens at the data boundary, not in components. |
| `@db.VarChar(n)` native types | removed | Length limits are no longer enforced by the database. They are enforced by the `zod` schemas in `src/lib/validation/`, which is where user input is checked anyway. |

Two SQL features were also unavailable and were worked around rather than dropped:

- **`skipDuplicates` on `createMany`** is unsupported on SQLite. The catalogue actions now filter
already-linked rows explicitly, so the outcome stays idempotent.
- **`mode: "insensitive"`** is PostgreSQL-only. It was removed from the admin searches — SQLite's
`LIKE` is already case-insensitive for ASCII, so search behaviour is unchanged.

### The one guarantee that had to survive

Preventing two visitors from booking the same slot does **not** rely on database locking, so it
transfers intact. It is a **partial unique index**:

```sql
CREATE UNIQUE INDEX "Appointment_active_slot_unique"
  ON "Appointment"("slotId")
  WHERE "slotId" IS NOT NULL
    AND "status" IN ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS');
```

SQLite supports partial indexes, so this is identical to the PostgreSQL original. The booking
service maps the resulting violation to the visitor-facing "This time slot is no longer
available." It is partial on purpose: cancelled and completed appointments keep their `slotId` for
history, so a released slot becomes bookable again without deleting the row.

Prisma's schema language cannot express a partial index, so it lives in raw SQL
(`prisma/migrations/00000000000001_init_sqlite/migration.sql`). Verified by
`scripts/test-turso-concurrency.ts` (a 2-way and an 8-way race, plus the sequential case) and
re-checked on every deploy by `scripts/db-prepare.ts`, which fails the build if it is missing.

### Migrations

Prisma Migrate does not support Turso. The baseline is rendered with
`prisma migrate diff --from-empty --to-schema-datamodel` and applied by
`scripts/turso-apply-schema.ts`. See docs/DEPLOYMENT.md §4 for the change workflow.

---

Status: **proposal** (explanatory) for the domain model below. The tables actually implemented in
`prisma/schema.prisma` are described in §2; relate the sections below to planned work.

<!-- Original framing retained: this document defined relationships before implementation. -->

## 1. Entity map

```
users ─┬─ 1:1 ─ patients ─┬─ appointments ── appointment_slots
       │                  ├─ hearing_assessments ─ test_results ─ audiograms
       │                  ├─ clinical_notes
       │                  ├─ reports
       │                  ├─ hearing_aid_recommendations ─ hearing_aid_fittings
       │                  ├─ hearing_aid_service_records
       │                  ├─ therapy_plans ─ therapy_sessions
       │                  └─ follow_ups
       ├─ 1:1 ─ staff ───┘ (providers staff appointments, assessments, sessions)
       └─ audit_logs (actor)

branches ─┬─ staff            services ─┬─ appointments
          ├─ patients           └─ branch_services (which branch offers what)
          └─ appointment_slots

hearing_aid_brands ─ hearing_aid_models ─┬─ hearing_aid_recommendations
hearing_aid_features ←─(join)─ hearing_aid_models

therapy_services ─ therapy_plans
notifications (user-scoped) · blog_posts · gallery_items (admin-authored)
```

## 2. Entities and relationships

### Identity & organization
| Entity | Relationships | Key points |
| --- | --- | --- |
| `users` | 1:1 optional `patients`, 1:1 optional `staff`; 1:N `notifications`; 1:N `audit_logs` (as actor) | One login identity per person; `role` enum now, join-table upgrade path documented in RBAC doc |
| `roles` | N:M `users` (future) | Starter uses an enum; a `roles`/`user_roles` join is introduced if per-user permission overrides are needed |
| `branches` | 1:N `staff`, 1:N `patients` (home branch), 1:N `appointment_slots`, M:N `services` via `branch_services` | Code + name unique; soft-disable via `isActive` |
| `patients` | Belongs to `users` (unique), belongs to `branches` (home branch, optional) | MRN unique; demographics minimal and purposeful |
| `staff` | Belongs to `users` (unique), belongs to `branches` | `role` mirrors user role (AUDIOLOGIST / THERAPIST / BRANCH_STAFF); license number for clinicians |

### Appointments
| Entity | Relationships | Key points |
| --- | --- | --- |
| `services` | M:N `branches` via `branch_services`; 1:N `appointments`; 1:N `therapy_plans` (when therapy-type) | Category: diagnostic / hearing_test / hearing_aid / therapy / cochlear |
| `appointment_slots` | Belongs to `branch` (+ optional staff); 1:1 `appointments` when booked | Generated from provider working hours; uniqueness prevents double-booking |
| `appointments` | Belongs to `patient`, `slot`, `service`, `branch`; optional `staff` (provider); 1:N `follow_ups` | Status machine: BOOKED → CHECKED_IN → IN_PROGRESS → COMPLETED / CANCELLED / NO_SHOW |

### Clinical core
| Entity | Relationships | Key points |
| --- | --- | --- |
| `hearing_assessments` | Belongs to `patient` + `staff` (audiologist) + `appointment` (optional); 1:N `test_results` | Encounter-level record: history, complaints, referral |
| `test_results` | Belongs to `assessment`; `testType` enum: PTA / SPEECH / TYMPANOMETRY / ABR / OAE / VESTIBULAR / TINNITUS / SPECIALIZED / CI_EVAL | One row per test performed; typed JSON payload per test kind |
| `audiograms` | 1:1:1 with PTA `test_result`; air/bone conduction per ear, threshold table | Frequencies 250 Hz–8 kHz; **stored data, not interpretation**; interpretation lives in signed notes |
| `clinical_notes` | Belongs to `patient` + `author` (staff); optional link to assessment/test | Signed & immutable once signed (edits create new revision) |
| `reports` | Belongs to `patient`; optional links to assessment/appointment; file reference | Generated document PDFs; access via guarded download |
| `follow_ups` | Polymorph-ish: belongs to `patient`; optional `appointment`, `fitting`, or `therapy_plan` origin | Due dates + status drive the follow-up queue |

### Hearing-aid catalogue & lifecycle
| Entity | Relationships | Key points |
| --- | --- | --- |
| `hearing_aid_brands` | 1:N `hearing_aid_models` | Admin-managed catalogue |
| `hearing_aid_models` | Belongs to `brand`; `type` (BTE/RIC/ITE/ITC/CIC/IIC); M:N `hearing_aid_features` via join; 1:N `recommendations`, `fittings` | Price band, availability per branch optional |
| `hearing_aid_features` | M:N `models` | Normalized feature tags (rechargeable, BT streaming, telecoil…) |
| `hearing_aid_recommendations` | Belongs to `patient` + `staff` (author); references 1..N candidate models; 1:1 optional `fittings` | Includes audiologist rationale; **decision is the professional's, never auto-generated** |
| `hearing_aid_fittings` | 1:1 `recommendation`; belongs to `staff` (fitter) | Ear/mold details, serials, warranty start, fit verification |
| `hearing_aid_service_records` | Belongs to `fitting`/patient; type REPAIR / SERVICE / PART_REPLACE | Aftercare history trail |

### Therapy
| Entity | Relationships | Key points |
| --- | --- | --- |
| `therapy_services` | 1:N `therapy_plans` | e.g. auditory-verbal, speech-language, tinnitus counseling (catalogue) |
| `therapy_plans` | Belongs to `patient` + `therapist` (staff) + `therapy_service`; 1:N `therapy_sessions`, `follow_ups` | Goals + frequency + review date |
| `therapy_sessions` | Belongs to `plan` + `therapist` + optional `appointment` | Session notes + progress rating feed progress tracking |

### Platform
| Entity | Relationships | Key points |
| --- | --- | --- |
| `notifications` | Belongs to `user` | In-app first; type, payload ref, read-at |
| `blog_posts` | Belongs to `author` (user) | CMS-managed; draft/published states |
| `gallery_items` | Belongs to `branch` (optional) | Image ref + caption + ordering |
| `audit_logs` | Belongs to `user` (actor, nullable for system) | Append-only; entity type/id + action; no PHI in metadata |

## 2b. Role simplification (2026-09-19) — no schema change

The role cleanup deliberately touched **no table and no enum value**. `UserRole` keeps
its six values because dropping `AUDIOLOGIST` / `THERAPIST` / `SUPER_ADMIN` / `PATIENT`
would fail on existing rows and destroy audit history. `ADMIN` and `CLINIC_STAFF` now map
to the same operations portal (see `docs/RBAC.md`), and the deferred clinical tables
(assessments, audiograms, therapy, hearing-aid lifecycle) remain intact and unused by the
public product.

Stale development rows observed in the local database (an inactive `Vijayawada Branch`
with no staff, appointments or address, and `Test …` accounts created by the test suites)
are left in place: the application hides unpublished clinics from the website and from
booking, so no test data reaches the public site. A production cut-over should delete or
archive them explicitly rather than relying on visibility flags.

## 3. Integrity & lifecycle rules

1. **One person, one account**: a user is a patient XOR staff (constraint enforced in service layer + DB checks; a staff member's family member gets their own account).
2. **Appointment occupancy** is enforced by a unique/partial-exclusion constraint at the slot level — never by UI state.
3. **Clinical immutability**: signed notes and finalized reports are never mutated; corrections create superseding records with `supersedesId`.
4. **Soft references**: when staff leave, records keep their `staffId`; `users.isActive=false` blocks login without destroying clinical history.
5. **Deletes are forbidden** for clinical entities; status fields (`isActive`, `status`) implement everything as soft state.
6. **Audit everything security-relevant**: logins, record views (clinical), mutations, exports, permission-denied attempts.

## 4. Guest-booking amendments (implemented 2026-09-18)

- **Guest patients**: `patients.userId` is now nullable with an `isGuest` flag and
  contact fields captured at booking. A guest patient has NO user row (cannot log in,
  cannot see clinical modules). Repeated bookings with the same mobile reuse one guest
  row — a future account registration can attach a `userId` to link history.
- **Booking reference & manage token**: `appointments.booking_ref` (public,
  `QHC-XXXXXXXX`) plus `manage_token_hash` (SHA-256 of a token shown once on the
  confirmation). Lookup requires reference + booking mobile; cancellation requires the
  token.
- **Slot exclusivity is status-scoped**: the old blanket `unique(appointments.slot_id)`
  is now a partial unique index over ACTIVE statuses only (`BOOKED`, `CHECKED_IN`,
  `IN_PROGRESS`). Cancelled / completed / no-show rows keep their slot reference for
  history while releasing the time slot for rebooking.
- **Idempotency**: `appointments.idempotency_key` (unique, client-generated per booking
  attempt) makes retried submissions return the original appointment.
