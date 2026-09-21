import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import {
  roleHasPermission,
  CLINIC_OPS_ROLES,
  type Permission,
} from "@/lib/rbac/permissions";
import { portalHomeFor } from "./portal-home";

export { CLINIC_OPS_ROLES };

export type { UserRole };

/** Session user shape — minimum data needed for authorization and UI. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
};

/**
 * Resolves the current session user server-side from the Auth.js session.
 * Returns null when unauthenticated. NEVER derive this from client input.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const { id, email, name, role, phone } = session.user;
  if (!id || !role) return null;
  return {
    id,
    email: email ?? "",
    name: name ?? "",
    phone: phone ?? null,
    role: role as UserRole,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export function hasRole(
  user: SessionUser | null,
  ...roles: UserRole[]
): boolean {
  return user !== null && roles.includes(user.role);
}

export function canAccess(user: SessionUser | null, permission: Permission): boolean {
  return user !== null && roleHasPermission(user.role, permission);
}

/** For Server Components: redirect unauthenticated users to login. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * For Server Components: enforce role. Wrong role → redirect to the user's own
 * portal home (denial is also audited there by middleware; this is defense in
 * depth for direct component access).
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect(portalHomeFor(user.role));
  }
  return user;
}

/** For Route Handlers / Server Actions: throw instead of redirect. */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRoleOrThrow(
  ...roles: UserRole[]
): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export function requirePermissionOrThrow(
  user: SessionUser,
  permission: Permission,
): void {
  if (!canAccess(user, permission)) throw new ForbiddenError();
}

/// ─── Role ↔ portal routing ──────────────────────────────────────────────────

// Re-exported from the dependency-free module middleware also uses, so the
// mapping can only ever be defined once.
export {
  ROLE_PORTAL_HOME,
  portalHomeFor,
  isClinicOpsRole,
  isDeferredRole,
} from "./portal-home";

export const ROLE_LABEL: Record<UserRole, string> = {
  PATIENT: "Patient",
  AUDIOLOGIST: "Audiologist",
  THERAPIST: "Therapist",
  CLINIC_STAFF: "Clinic Staff",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Admin",
};
