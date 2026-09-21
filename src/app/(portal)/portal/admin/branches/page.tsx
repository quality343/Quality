import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { CLIENT } from "@/lib/client-info";
import { listBranches } from "@/server/services/queries";
import { BranchForm } from "./BranchForm";

export const metadata = { title: "Clinic information" };

/**
 * Clinic information. QUALITY Hearing Care publishes ONE clinic in Hyderabad —
 * this page edits that record (address, phone, what the website may offer) and
 * lists any record that is deliberately not published, instead of presenting a
 * multi-branch directory.
 */
export default async function ClinicInformationPage() {
  await requireRole(...CLINIC_OPS_ROLES);
  const branches = await listBranches(false);
  const published = branches.filter((b) => b.isActive);
  const hidden = branches.filter((b) => !b.isActive);

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Clinic information"
        description="The details visitors see for the Hyderabad clinic, and what the website is allowed to offer."
      />

      <Card className="mb-6 border-brand-200 bg-brand-50/60">
        <h2 className="text-sm font-semibold text-ink-900">
          Public contact details come from the client record
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          The website footer, contact page and map link use the client-provided
          details: {CLIENT.phone} · {CLIENT.email} · {CLIENT.addressOneLine}
        </p>
      </Card>

      {published.length === 0 ? (
        <Card className="mb-6">
          <p className="text-sm text-ink-600">
            No clinic is published right now, so the website shows contacts only.
            Publish the Hyderabad clinic below to accept online bookings.
          </p>
        </Card>
      ) : null}

      {published.map((branch) => (
        <Card key={branch.id} className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{branch.name}</h2>
              <p className="mt-1 text-sm text-ink-500">
                {branch.city ?? "City not set"} · code {branch.code}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Published</Badge>
              {branch.acceptsOnlineBookings ? (
                <Badge tone="neutral">Online booking on</Badge>
              ) : (
                <Badge tone="accent">Online booking off</Badge>
              )}
              {branch.homeConsultationsEnabled ? (
                <Badge tone="neutral">Home consultations</Badge>
              ) : null}
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Address
              </dt>
              <dd className="mt-0.5 text-ink-700">{branch.address || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Phone
              </dt>
              <dd className="mt-0.5 text-ink-700">{branch.phone || "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border pt-2">
            <BranchForm
              clinic={{
                id: branch.id,
                code: branch.code,
                name: branch.name,
                city: branch.city,
                address: branch.address,
                phone: branch.phone,
                isActive: branch.isActive,
                acceptsOnlineBookings: branch.acceptsOnlineBookings,
                homeConsultationsEnabled: branch.homeConsultationsEnabled,
                homeConsultationNote: branch.homeConsultationNote,
                homeServiceAreas: branch.homeServiceAreas,
                homeMaxPerDay: branch.homeMaxPerDay,
              }}
            />
          </div>
        </Card>
      ))}

      {hidden.length > 0 ? (
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Not published</h2>
          <p className="mt-1 text-sm text-ink-500">
            These records are hidden from the website and from booking. Nothing is
            deleted — publishing one only happens if the clinic actually opens
            another location.
          </p>
          <ul className="mt-4 divide-y divide-border">
            {hidden.map((branch) => (
              <li key={branch.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-ink-800">{branch.name}</span>
                    <span className="flex items-center gap-2 text-xs text-ink-500">
                      <span>code {branch.code}</span>
                      <Badge tone="neutral">Hidden</Badge>
                    </span>
                  </summary>
                  <BranchForm
                    clinic={{
                      id: branch.id,
                      code: branch.code,
                      name: branch.name,
                      city: branch.city,
                      address: branch.address,
                      phone: branch.phone,
                      isActive: branch.isActive,
                      acceptsOnlineBookings: branch.acceptsOnlineBookings,
                      homeConsultationsEnabled: branch.homeConsultationsEnabled,
                      homeConsultationNote: branch.homeConsultationNote,
                      homeServiceAreas: branch.homeServiceAreas,
                      homeMaxPerDay: branch.homeMaxPerDay,
                    }}
                  />
                </details>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
