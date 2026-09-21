/**
 * Display name for a patient relation. Registered patients use their User
 * name; guests fall back to the guest profile name, then the MRN.
 */
export function patientDisplayName(
  p: { name?: string | null; user?: { name: string } | null; mrn?: string | null },
): string {
  return p.user?.name ?? p.name ?? p.mrn ?? "Patient";
}
