import { NextResponse } from "next/server";
import {
  DEFERRED_PORTAL_HOME,
  ROLE_PORTAL_HOME,
} from "@/lib/auth/portal-home";
import {
  DEFERRED_PORTAL_AREAS,
  PORTAL_ROLES,
  type Role,
} from "@/lib/rbac/permissions";

/**
 * Edge middleware (deliberately Prisma/bcrypt-free, uses the lean
 * next-auth/middleware wrapper):
 * 1. Security headers on every response.
 * 2. /portal/** requires a valid session JWT cookie (checked by the wrapper).
 * 3. Portal-area enforcement for this product:
 *    - ONE clinic-operations portal (/portal/admin) for ADMIN, CLINIC_STAFF and
 *      SUPER_ADMIN.
 *    - /portal/clinic is consolidated into it (legacy links keep working).
 *    - Deferred areas (patient, audiologist, therapist, super-admin) render
 *      nothing: they redirect to /portal/unavailable so no clinical or platform
 *      dashboard is reachable in the clinic-website product.
 *    - Authenticated users entering an area they do not own go to their own
 *      portal home.
 *
 * Role mapping is imported from lib/rbac/permissions (single source of truth).
 * Cross-role denials are additionally audit-logged server-side by requireRole()
 * in the portal layouts (edge cannot reach Prisma).
 */
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/rbac/roles";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const DEFERRED_AREAS: readonly string[] = DEFERRED_PORTAL_AREAS;

/** Legacy clinic desk routes → the consolidated clinic-operations portal. */
const CLINIC_AREA_MAP: Record<string, string> = {
  "": "",
  appointments: "/appointments",
  patients: "/patients",
  staff: "/staff",
  branch: "/branches",
};

function allowedRolesForArea(area: string): readonly Role[] | undefined {
  return PORTAL_ROLES[area];
}

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/portal")) {
    // Lean edge JWT read — no provider machinery needed.
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    const role = token?.role as UserRole | undefined;

    if (!token || !role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    const segments = pathname.split("/").filter(Boolean); // ["portal", area, ...]
    const area = segments[1] ?? "";
    const ownHome = ROLE_PORTAL_HOME[role] ?? "/login";

    // Deferred modules (clinical, therapy, patient accounts, platform admin).
    if (DEFERRED_AREAS.includes(area)) {
      return NextResponse.redirect(new URL(DEFERRED_PORTAL_HOME, request.url));
    }

    // Consolidated clinic desk: keep old bookmarks working.
    if (area === "clinic") {
      const rest = segments[2] ?? "";
      const target = CLINIC_AREA_MAP[rest] ?? (rest ? `/${rest}` : "");
      return NextResponse.redirect(
        new URL(`${ROLE_PORTAL_HOME.CLINIC_STAFF}${target}`, request.url),
      );
    }

    // The neutral page for deferred portals must be reachable by any signed-in
    // role, otherwise a deferred role would loop on its own portal home.
    if (area === "unavailable") {
      // fall through to the security-header response
    } else {
      const allowed = allowedRolesForArea(area);
      if (!allowed || !allowed.includes(role as Role)) {
        return NextResponse.redirect(new URL(ownHome, request.url));
      }
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|icon.svg|api/auth).*)"],
};
