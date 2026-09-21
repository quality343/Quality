import { roleHasPermission, type Permission, type Role } from "./permissions";

/**
 * Acting-user shape used by the service layer. Phase 1 populates it from the
 * Auth.js session; until then nothing should construct it from client input.
 */
export type ActingUser = {
  id: string;
  role: Role;
  /** Home branch for BRANCH_STAFF/clinical roles; undefined for ADMIN+. */
  branchId?: string;
};

export class PermissionDeniedError extends Error {
  constructor(
    public readonly permission: Permission,
    public readonly role: Role,
  ) {
    super(`Role ${role} lacks permission ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Server-side authorization gate. Throws PermissionDeniedError when the role
 * lacks the permission; callers translate this into 403 responses or redirect
 * to the /403 page. Never call with values derived from client input.
 */
export function requirePermission(user: ActingUser, permission: Permission): void {
  if (!roleHasPermission(user.role, permission)) {
    throw new PermissionDeniedError(permission, user.role);
  }
}
