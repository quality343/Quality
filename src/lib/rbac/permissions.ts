/**
 * RBAC matrix — single source of truth for server-side authorization.
 * Role checks gate portal areas; permission checks gate business actions
 * (enforced in the service layer from Phase 2 onward). UI checks are cosmetic
 * only. See docs/RBAC.md.
 *
 * Product scope (2026-09): QUALITY Hearing Care is a single Hyderabad clinic
 * website with guest booking + one clinic-operations portal. ADMIN and
 * CLINIC_STAFF are the two active operational roles and share the same portal
 * and the same clinic-operations permissions; the enum values are retained so
 * existing rows keep working (no destructive migration). PATIENT and the
 * clinical roles (AUDIOLOGIST / THERAPIST / SUPER_ADMIN) are DEFERRED: their
 * portals are not part of this product and are redirected (see
 * DEFERRED_PORTAL_AREAS).
 */

// The role list itself lives in ./roles so the edge middleware can import it
// without pulling in database code. Re-exported to keep existing imports working.
import { ROLES, type UserRole } from "./roles";

export { ROLES };

/** Alias kept for existing call sites — the vocabulary is `UserRole`. */
export type Role = UserRole;

export const PERMISSIONS = [
  // Patient self-service
  "appointment.book.self",
  "patient.read.own",
  "audiogram.read.own",
  "report.read.own",
  "service.request.create",
  "profile.manage.own",
  "aid.read.own",           // own recommendations/fittings/warranty/service
  "aid.service.request",    // submit a repair/service request for own device

  // Appointment operations (branch-scoped)
  "appointment.manage.branch",

  // Clinical data
  "patient.read",
  "assessment.create",
  "assessment.review",
  "audiogram.manage",
  "note.create",
  "report.generate",

  // Hearing-aid workflow
  "aid.catalogue.read",
  "aid.recommend.create",
  "aid.recommend.decide", // record the PATIENT's decision (staff records it)
  "aid.demo.manage",
  "fitting.record",
  "aid.dispense",
  "aid.warranty.manage",
  "aid.service.manage",
  "aid.aftercare.manage",

  // Therapy workflow
  "therapy.plan.create",
  "therapy.session.record",
  "therapy.progress.read",

  // Administration
  "user.manage",
  "staff.manage",
  "branch.manage",
  "service.manage",
  "aid.catalogue.manage",
  "blog.manage",
  "gallery.manage",
  "report.view.org",
  "notification.send",

  // Super admin
  "settings.manage",
  "audit.read",
  "role.assign",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PATIENT: readonly Permission[] = [
  "appointment.book.self",
  "patient.read.own",
  "audiogram.read.own",
  "report.read.own",
  "service.request.create",
  "profile.manage.own",
  "aid.read.own",
  "aid.service.request",
];

const AUDIOLOGIST: readonly Permission[] = [
  "appointment.manage.branch",
  "patient.read",
  "assessment.create",
  "assessment.review",
  "audiogram.manage",
  "note.create",
  "report.generate",
  "aid.catalogue.read",
  "aid.recommend.create",
  "aid.recommend.decide",
  "aid.demo.manage",
  "fitting.record",
  "aid.dispense",
  "aid.warranty.manage",
  "aid.service.manage",
  "aid.aftercare.manage",
  "therapy.progress.read",
];

const THERAPIST: readonly Permission[] = [
  "appointment.manage.branch",
  "patient.read",
  "note.create",
  "therapy.plan.create",
  "therapy.session.record",
  "therapy.progress.read",
];

/**
 * Clinic operations role. Behaves as one role with ADMIN at the product level:
 * front-desk and clinic-management duties, but never clinical write access.
 * `user.manage` / `settings.manage` / `audit.read` stay out of this set.
 */
const CLINIC_STAFF: readonly Permission[] = [
  "appointment.manage.branch",
  "patient.read",
  "notification.send",
  "branch.manage",
  "service.manage",
  "staff.manage",
  "report.view.org",
  "aid.catalogue.read",
  "aid.catalogue.manage",
  "aid.demo.manage",
  "aid.service.manage", // operational: log & progress service jobs (no clinical permissions)
];

const ADMIN: readonly Permission[] = [
  "appointment.manage.branch",
  "patient.read",
  "report.generate",
  "therapy.progress.read",
  "user.manage",
  "staff.manage",
  "branch.manage",
  "service.manage",
  "aid.catalogue.read",
  "aid.catalogue.manage", // catalogue & inventory administration only
  "blog.manage",
  "gallery.manage",
  "report.view.org",
  "notification.send",
];

const SUPER_ADMIN: readonly Permission[] = [
  ...ADMIN,
  "settings.manage",
  "audit.read",
  "role.assign",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  PATIENT,
  AUDIOLOGIST,
  THERAPIST,
  CLINIC_STAFF,
  ADMIN,
  SUPER_ADMIN,
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * The clinic-operations roles. ADMIN and CLINIC_STAFF are interchangeable at the
 * product level; SUPER_ADMIN is retained for future platform administration and
 * currently routes to the same portal.
 */
export const CLINIC_OPS_ROLES = ["ADMIN", "CLINIC_STAFF", "SUPER_ADMIN"] as const;

/**
 * Portal areas that exist in the codebase but are NOT part of the current
 * product. Middleware redirects these to /portal/unavailable instead of
 * rendering a dashboard the client was never meant to see. Clinical code and
 * tables are preserved for later phases — only the routes are closed.
 */
export const DEFERRED_PORTAL_AREAS = [
  "patient",
  "audiologist",
  "therapist",
  "super-admin",
] as const;

/**
 * Roles allowed to access a given portal area prefix. Areas absent from this
 * map are either deferred (see DEFERRED_PORTAL_AREAS) or do not exist.
 * `/portal/clinic` was consolidated into the clinic-operations portal.
 */
export const PORTAL_ROLES: Record<string, readonly Role[]> = {
  admin: CLINIC_OPS_ROLES,
};
