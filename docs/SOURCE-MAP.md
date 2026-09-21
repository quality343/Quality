# Quality Hearing Care — Application Source

## Layout

```
src/
├── app/
│   ├── (public)/            # Marketing website — public, indexable
│   │   ├── page.tsx         # Home
│   │   ├── about/           # About Us
│   │   ├── services/        # Services (+ [slug] detail)
│   │   ├── diagnostic-services/
│   │   ├── hearing-tests/
│   │   ├── hearing-aids/    # (+ brands, models)
│   │   ├── therapy-services/
│   │   ├── cochlear-implant/
│   │   ├── branches/        # (+ [slug])
│   │   ├── blog/            # (+ [slug])
│   │   ├── gallery/
│   │   ├── contact/
│   │   └── book-appointment/
│   ├── (auth)/
│   │   ├── login/           # login + register placeholders (Phase 1)
│   │   └── register/
│   ├── (portal)/portal/     # session-guarded app shell w/ sidebar
│   │   ├── patient/         # dashboard, appointments, assessments, results,
│   │   │                    # reports, hearing-aid, therapy, follow-ups, notifications
│   │   ├── staff/           # dashboard, patients, appointments, assessments,
│   │   │                    # results, notes, hearing-aids, therapy, follow-ups
│   │   └── admin/           # dashboard, users, patients, staff, branches,
│   │                        # services, appointments, hearing-aids, therapy, blog,
│   │                        # gallery, notifications, settings, audit-logs
│   ├── api/health/          # liveness probe (no PHI)
│   ├── globals.css          # ⚠ design tokens — single source of brand truth
│   ├── layout.tsx           # fonts, metadata, skip-link
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                  # Container, Button, Card, Badge, PageHeader,
│   │                        # PlaceholderNotice, Icon, input shells
│   ├── layout/              # SiteHeader, SiteFooter, PortalSidebar
│   └── brand/               # BrandLogo (official-logo slot + fallback mark)
├── lib/
│   ├── rbac/permissions.ts  # role → permission matrix + roleHasPermission()
│   ├── audit.ts             # recordAuditEvent() (DB-backed, never throws)
│   ├── env.ts               # typed, validated server env access (Zod)
│   ├── logo.ts              # official-logo file detection
│   └── validation/          # Zod schemas (grows from Phase 1)
├── server/
│   ├── db.ts                # Prisma client singleton
│   └── services/            # business logic + server-side authorization (Phase 1+)
├── middleware.ts            # security headers + portal route protection (Phase 1)
└── types/
```

## Conventions

- Server Components by default; `"use client"` only for real interactivity.
- Every color/spacing/radius value comes from `globals.css` tokens — never hardcode.
- All public placeholder content uses `PlaceholderNotice` (honest "planned module" panels);
  no fake data, no copied content from the reference project.
- Portals are guarded by middleware **and** by service-layer permission checks.
