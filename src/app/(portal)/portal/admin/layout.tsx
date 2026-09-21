import { PortalShell } from "@/components/layout/PortalShell";
import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { CLINIC_OPS, clinicOpsNavFor } from "@/lib/auth/portal-nav";
import { getBrandAssets } from "@/lib/logo";

/**
 * The one operational portal for QUALITY Hearing Care: a single Hyderabad
 * clinic. ADMIN and CLINIC_STAFF share it (SUPER_ADMIN is retained for future
 * platform work and routes here too). Server-side role enforcement sits here as
 * defense in depth — middleware already gates /portal/**.
 */
export default async function ClinicOpsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(...CLINIC_OPS_ROLES);
  const { logoSrc, logoMarkSrc } = getBrandAssets();

  return (
    <PortalShell
      areaTitle={CLINIC_OPS.areaTitle}
      items={clinicOpsNavFor(user.role)}
      user={{ name: user.name, email: user.email, role: user.role }}
      logoSrc={logoSrc}
      logoMarkSrc={logoMarkSrc}
    >
      {children}
    </PortalShell>
  );
}
