import { PortalShell } from "@/components/layout/PortalShell";
import { requireRole } from "@/lib/auth/guards";
import { PORTALS } from "@/lib/auth/portal-nav";
import { getBrandAssets } from "@/lib/logo";

export default async function TherapistPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side role enforcement (middleware already gates; this is defense in
  // depth). Cross-role attempts are redirected by requireRole and audited via the
  // central audit helper — not on routine authorized loads.
  const user = await requireRole("THERAPIST");
  const { logoSrc, logoMarkSrc } = getBrandAssets();
  const def = PORTALS.THERAPIST;

  return (
    <PortalShell
      areaTitle={def.areaTitle}
      items={def.items}
      user={{ name: user.name, email: user.email, role: user.role }}
      logoSrc={logoSrc}
      logoMarkSrc={logoMarkSrc}
    >
      {children}
    </PortalShell>
  );
}
