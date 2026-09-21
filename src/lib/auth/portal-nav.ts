import type { UserRole } from "@prisma/client";
import type { PortalNavItem } from "@/components/layout/PortalShell";

type PortalDef = {
  areaTitle: string;
  root: string;
  items: PortalNavItem[];
};

/** Nav item that is only shown to the listed roles. */
type RoleScopedNavItem = PortalNavItem & { roles?: readonly UserRole[] };

/**
 * The one operational portal for this product: QUALITY Hearing Care is a single
 * Hyderabad clinic, so clinic management lives in a single place. ADMIN and
 * CLINIC_STAFF see the same items; account administration stays with ADMIN.
 */
export const CLINIC_OPS = {
  areaTitle: "Clinic Operations",
  root: "/portal/admin",
} as const;

export const CLINIC_OPS_NAV: readonly RoleScopedNavItem[] = [
  { href: "/portal/admin", label: "Dashboard", icon: "heart" },
  { href: "/portal/admin/appointments", label: "Appointments", icon: "calendar" },
  { href: "/portal/admin/home-consultations", label: "Home Consultations", icon: "home" },
  { href: "/portal/admin/availability", label: "Availability", icon: "clock" },
  { href: "/portal/admin/services", label: "Services", icon: "sparkles" },
  { href: "/portal/admin/hearing-aids", label: "Hearing Aids", icon: "ear" },
  { href: "/portal/admin/branches", label: "Clinic Information", icon: "building" },
  { href: "/portal/admin/enquiries", label: "Enquiries", icon: "mail" },
];

export function clinicOpsNavFor(role: UserRole): PortalNavItem[] {
  return CLINIC_OPS_NAV.filter((item) => !item.roles || item.roles.includes(role)).map(
    ({ href, label, icon }) => ({ href, label, icon }),
  );
}

/** Unfiltered version, kept for the shared portal definitions below. */
const CLINIC_OPS_ITEMS: PortalNavItem[] = CLINIC_OPS_NAV.map(
  ({ href, label, icon }) => ({ href, label, icon }),
);

/**
 * Portals below are DEFERRED in the current product (clinical records, therapy,
 * patient accounts, platform administration). Their routes are redirected by
 * middleware to /portal/unavailable; the definitions remain so the code and
 * data are preserved for a later phase. See docs/RBAC.md.
 */
export const PORTALS: Record<UserRole, PortalDef> = {
  PATIENT: {
    areaTitle: "Patient Portal",
    root: "/portal/patient",
    items: [
      { href: "/portal/patient", label: "Dashboard", icon: "heart" },
      { href: "/portal/patient/profile", label: "Profile", icon: "users" },
      { href: "/portal/patient/appointments", label: "Appointments", icon: "calendar" },
      { href: "/portal/patient/hearing-tests", label: "Hearing Tests", icon: "ear" },
      { href: "/portal/patient/reports", label: "Reports", icon: "shield" },
      { href: "/portal/patient/hearing-aids", label: "Hearing Aids", icon: "check" },
      { href: "/portal/patient/therapy", label: "Therapy", icon: "sparkles" },
      { href: "/portal/patient/notifications", label: "Notifications", icon: "bell" },
    ],
  },
  AUDIOLOGIST: {
    areaTitle: "Audiologist Portal",
    root: "/portal/audiologist",
    items: [
      { href: "/portal/audiologist", label: "Dashboard", icon: "heart" },
      { href: "/portal/audiologist/patients", label: "Patients", icon: "users" },
      { href: "/portal/audiologist/appointments", label: "Appointments", icon: "calendar" },
      { href: "/portal/audiologist/assessments", label: "Assessments", icon: "ear" },
      { href: "/portal/audiologist/audiograms", label: "Audiograms", icon: "sparkles" },
      { href: "/portal/audiologist/reports", label: "Reports", icon: "shield" },
      { href: "/portal/audiologist/hearing-aids", label: "Hearing Aids", icon: "check" },
      { href: "/portal/audiologist/hearing-aids/operations", label: "Aid Operations", icon: "clock" },
      { href: "/portal/audiologist/follow-ups", label: "Follow-ups", icon: "clock" },
    ],
  },
  THERAPIST: {
    areaTitle: "Therapist Portal",
    root: "/portal/therapist",
    items: [
      { href: "/portal/therapist", label: "Dashboard", icon: "heart" },
      { href: "/portal/therapist/patients", label: "Patients", icon: "users" },
      { href: "/portal/therapist/appointments", label: "Appointments", icon: "calendar" },
      { href: "/portal/therapist/therapy-plans", label: "Therapy Plans", icon: "shield" },
      { href: "/portal/therapist/therapy-sessions", label: "Therapy Sessions", icon: "sparkles" },
      { href: "/portal/therapist/progress", label: "Progress", icon: "check" },
      { href: "/portal/therapist/follow-ups", label: "Follow-ups", icon: "clock" },
    ],
  },
  CLINIC_STAFF: {
    areaTitle: CLINIC_OPS.areaTitle,
    root: CLINIC_OPS.root,
    items: CLINIC_OPS_ITEMS,
  },
  ADMIN: {
    areaTitle: CLINIC_OPS.areaTitle,
    root: CLINIC_OPS.root,
    items: CLINIC_OPS_ITEMS,
  },
  SUPER_ADMIN: {
    areaTitle: CLINIC_OPS.areaTitle,
    root: CLINIC_OPS.root,
    items: CLINIC_OPS_ITEMS,
  },
};
