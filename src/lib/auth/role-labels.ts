export const ROLE_LABEL = {
  PATIENT: "Patient",
  AUDIOLOGIST: "Audiologist",
  THERAPIST: "Therapist",
  CLINIC_STAFF: "Clinic Staff",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Admin",
} as const;

export type RoleLabelKey = keyof typeof ROLE_LABEL;
