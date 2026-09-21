# QUALITY Hearing Care — JOY OF HEARING

A modern hearing-care platform: public website, patient portal, and staff portals for
audiologists, therapists, branch staff, and administrators.

> **Status:** Phases 0–3 — foundation, authentication/RBAC, scheduling, and the clinical
> chain (assessment → tests → audiogram → review → report). Hearing-aid lifecycle,
> therapy modules, and CMS are next (`docs/ROADMAP.md`).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** — full-stack modular monolith
- **Tailwind CSS v4** with a token-based design system (`src/app/globals.css`)
- **PostgreSQL 16** + **Prisma** ORM
- Auth: **Auth.js v5** with database sessions (Phase 1)

## Quick start

```bash
npm install
cp .env.example .env          # set DATABASE_URL, AUTH_SECRET
powershell -NoProfile -File scripts/dev-db-start.ps1   # local PG16 on :5433 (or use docker-compose)
npm run db:migrate            # apply schema
npx tsx scripts/seed-org.ts   # branches + services (org baseline)
npm run dev                   # http://localhost:3000
```

First SUPER_ADMIN (one-time, then remove the env values):

```bash
SUPER_ADMIN_NAME="..." SUPER_ADMIN_EMAIL="..." SUPER_ADMIN_PASSWORD="..." \
  npx tsx scripts/seed-super-admin.ts
```

See `docs/AUTH.md` for the full authentication architecture and
`docs/CLINICAL-FLOW.md` for the end-to-end care workflow.

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run db:studio`, `npm run db:deploy` (production migrations only).

## Documentation

| Doc | Contents |
| --- | --- |
| `docs/AUDIT.md` | Pre-build inspection findings (empty workspace) |
| `docs/AUTH.md` | Authentication, roles, route protection, super-admin bootstrap |
| `docs/CLINICAL-FLOW.md` | Implemented care workflow end to end |
| `docs/ARCHITECTURE.md` | Target architecture and layer decisions |
| `docs/DATABASE.md` | Entity-relationship plan for the whole domain |
| `docs/RBAC.md` | Roles, permission matrix, enforcement points |
| `docs/DESIGN-SYSTEM.md` | Brand tokens, components, accessibility rules |
| `docs/ROADMAP.md` | Phases 0–6 in dependency order |
| `docs/SOURCE-MAP.md` | Source tree map and conventions |
| `public/brand/README.md` | How to install the official logo |

## Principles

1. One brand, one logo — the official supplied file, never a generic icon.
2. RBAC enforced server-side; UI hiding is cosmetic only.
3. No fake patient data; placeholders are honest "planned module" notices.
4. Clinical conclusions come from authorized professionals — never auto-generated.
5. Original content only; the reference project influenced business structure, not branding.
