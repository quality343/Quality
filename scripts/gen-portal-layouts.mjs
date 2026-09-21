// One-time codegen for the six role portal layouts. Kept for provenance;
// regenerate only if the layout template changes.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const areas = [
  ["patient", "PATIENT", "Patient Portal"],
  ["audiologist", "AUDIOLOGIST", "Audiologist Portal"],
  ["therapist", "THERAPIST", "Therapist Portal"],
  ["clinic", "CLINIC_STAFF", "Clinic Portal"],
  ["admin", "ADMIN", "Admin Portal"],
  ["super-admin", "SUPER_ADMIN", "Super Admin Portal"],
];

const template = (role) => `import { PortalShell } from "@/components/layout/PortalShell";
import { requireRole } from "@/lib/auth/guards";
import { PORTALS } from "@/lib/auth/portal-nav";
import { getBrandAssets } from "@/lib/logo";

export default async function ${role.charAt(0).toUpperCase() + role.slice(1)}PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side role enforcement (middleware already gates; this is defense in
  // depth). Cross-role attempts are redirected by requireRole and audited in
  // middleware-adjacent service code, not on routine authorized loads.
  const user = await requireRole("${role}");
  const { logoSrc, logoMarkSrc } = getBrandAssets();
  const def = PORTALS.${role};

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
`;

for (const [area, role] of areas.map(([a, r]) => [a, r])) {
  const dir = resolve(root, `src/app/(portal)/portal/${area}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "layout.tsx"), template(role));
  console.log("wrote", area);
}
