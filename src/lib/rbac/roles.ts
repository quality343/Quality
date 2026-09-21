/**
 * Role vocabulary — the single source of truth for role names.
 *
 * These values used to come from a PostgreSQL `enum` via `@prisma/client`.
 * Turso is libSQL/SQLite, and Prisma does not support enums on SQLite, so the
 * database column is now plain text and this union carries the type instead.
 *
 * What that means in practice — worth knowing, because it is the one real
 * trade-off of the Turso migration:
 * - The database no longer rejects an unknown role value. Nothing outside this
 *   union should ever be written, and `roleHasPermission()` denies anything it
 *   does not recognise, so an unexpected value fails closed rather than open.
 * - `ROLES` is deliberately dependency-free (no imports) so the edge middleware
 *   can use it without pulling in the database client.
 *
 * Keep this list in sync with `docs/RBAC.md`. Removing a member is a breaking
 * change for existing rows.
 */
export const ROLES = [
  "PATIENT",
  "AUDIOLOGIST",
  "THERAPIST",
  "CLINIC_STAFF",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type UserRole = (typeof ROLES)[number];
