import type { UserRole } from "@/lib/rbac/roles";
import { CLINIC_OPS_ROLES, DEFERRED_PORTAL_AREAS } from "@/lib/rbac/permissions";

/**
 * Role → portal home mapping. Kept dependency-free (no next/*, no Prisma
 * client) so middleware on the edge runtime and server code can both import it.
 *
 * Product scope: ONE clinic-operations portal for the single Hyderabad clinic.
 * ADMIN, CLINIC_STAFF and SUPER_ADMIN all land there. The clinical and patient
 * portals are deferred — roles that would land in them are routed to
 * /portal/unavailable, which explains the status instead of showing a dashboard
 * that is not part of this product.
 */
export const ROLE_PORTAL_HOME: Record<UserRole, string> = {
  PATIENT: "/portal/patient",
  AUDIOLOGIST: "/portal/audiologist",
  THERAPIST: "/portal/therapist",
  CLINIC_STAFF: "/portal/admin",
  ADMIN: "/portal/admin",
  SUPER_ADMIN: "/portal/admin",
};

/** Neutral landing page for roles whose portal is deferred. */
export const DEFERRED_PORTAL_HOME = "/portal/unavailable";

export function portalHomeFor(role: UserRole): string {
  return ROLE_PORTAL_HOME[role];
}

/** True when the role may work the clinic-operations portal. */
export function isClinicOpsRole(role: UserRole | undefined | null): boolean {
  return !!role && (CLINIC_OPS_ROLES as readonly UserRole[]).includes(role);
}

/** True when the role's own portal is deferred in this product. */
export function isDeferredRole(role: UserRole): boolean {
  return DEFERRED_PORTAL_AREAS.some(
    (area) => ROLE_PORTAL_HOME[role] === `/portal/${area}`,
  );
}
