# Target Architecture — QUALITY Hearing Care

## 1. Style: modular monolith (Next.js 15)

One deployable Next.js 15 (App Router) application containing the public website and all three
portals, with a PostgreSQL database accessed through Prisma. Rationale:

- The product is one brand with shared layout, tokens, and identity across public + portals.
- Next.js Server Actions / Route Handlers give a backend in the same codebase and language,
  with end-to-end type safety from Prisma schema → API → UI.
- Every module (appointments, audiology, therapy, catalogues, CMS) lives behind a clear
  `src/lib` + `src/server` boundary so it can later be extracted into a separate service if
  traffic or compliance demands it. We do **not** start with microservices.

## 2. Layers

```
Browser (desktop / tablet / mobile)
  │
  ├── Public website           (Server Components, statically rendered where possible)
  ├── Auth pages               (login / register → Auth.js credentials, DB sessions)
  ├── Patient portal           (Server Components + Server Actions; session-guarded)
  ├── Staff portal             (session + RBAC-guarded; clinical tooling)
  └── Admin portal             (session + RBAC-guarded; management + CMS)
        │
        ▼
Route Handlers / Server Actions        ← validation layer (Zod) on EVERY boundary
        │
        ▼
Service layer  (src/server/services/*) — business rules, authorization checks, audit calls
        │
        ▼
Prisma ORM → PostgreSQL
        │
        ├── Object storage (S3-compatible) for documents/reports & gallery images (Phase 4+)
        └── Notification transports (email/SMS providers) behind an internal interface
```

## 3. Decisions by concern

| Concern | Decision | Notes |
| --- | --- | --- |
| Frontend | Next.js 15 App Router, React Server Components by default, client components only for interactivity (menus, forms) | Tailwind CSS v4 with design tokens; no UI framework lock-in |
| Backend | Route Handlers (`/api/*`) for machine-facing endpoints, Server Actions for portal form mutations | All input validated with Zod at the boundary; service layer never trusts callers |
| Database | PostgreSQL 16 + Prisma | Relational integrity matters for appointments, clinical records, catalogue; migrations are versioned |
| Auth | Auth.js (NextAuth) v5, credentials provider with `bcrypt` (cost ≥ 12) hashes, **database sessions** (HTTP-only, SameSite=Lax cookies) | JWT avoided so sessions can be revoked; MFA and OTP login are Phase 5+ |
| RBAC | Role → permission matrix evaluated **server-side** in the service layer (`src/lib/rbac`); UI hides controls only as a courtesy | See `docs/RBAC.md` |
| File/document storage | Start on local disk under `storage/` with a guarded download route; move to S3-compatible object storage before go-live | Patient reports are never under `public/`; downloads go through an authorization check that streams the file |
| Image storage | Gallery/brand images under `public/` until CMS phase; then object storage + image transform | |
| Notifications | Internal `notify()` interface with pluggable transports (log now, email/SMS provider later); `notifications` table is the source of in-app state | Templates versioned in code |
| Appointment scheduling | Slots generated per branch × service × provider working hours; double-booking prevented by a DB-level exclusion constraint on `appointment_slots` | Conflict checks happen in a transaction, not in the UI |
| Audit logging | Append-only `audit_logs` via `recordAuditEvent()`; every security-relevant mutation calls it | Never store PHI in metadata — only entity type + id |
| Validation | Zod schemas shared between Route Handlers, Server Actions, and forms | One schema per domain object in `src/lib/validation` |
| Rate limiting | Middleware-based limiter (per IP + per account) on auth and booking endpoints | Phase 2 |
| Secrets | Environment variables only (`src/lib/env.ts` is the single server-side accessor); `.env*` is gitignored | No secrets in client bundles — `NEXT_PUBLIC_` prefix reserved for non-sensitive values |

## 4. Protected-health-information (PHI) rules

1. PHI renders only inside session-guarded portal routes; public pages contain none.
2. API responses are filtered by role **server-side**; the client never decides visibility.
3. Every read/write of clinical data is attributable (session user) and auditable.
4. Clinical conclusions (diagnosis-type statements) are entered/reviewed by authorized
   professionals only — the software never auto-generates diagnoses.
5. Backups and exports are treated as PHI; only ADMIN/SUPER_ADMIN roles may export, and
   exports are audit-logged.

## 5. Environments

| Environment | Purpose | Notes |
| --- | --- | --- |
| Local | Dockerized PostgreSQL (`docker-compose.yml`) | `npm run db:migrate` applies migrations |
| Staging | Same build, `DATABASE_URL` pointing at managed Postgres | Smoke tests + RBAC review before release |
| Production | Managed Postgres + object storage + HTTPS | `npm run db:deploy` only (no dev migrations) |
