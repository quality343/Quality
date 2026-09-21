import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listServices } from "@/server/services/queries";
import { ServiceForm } from "./ServiceForm";

export const metadata = { title: "Services" };

const CATEGORY_LABEL: Record<string, string> = {
  DIAGNOSTIC: "Diagnostic",
  HEARING_TEST: "Hearing test",
  HEARING_AID: "Hearing aid",
  THERAPY: "Therapy",
  COCHLEAR: "Cochlear implant",
};

export default async function AdminServicesPage() {
  await requireRole(...CLINIC_OPS_ROLES);
  const services = await listServices(false);

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Service catalogue"
        description="Bookable services with duration and category. Branches choose which ones they offer."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card bare>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-700">{s.code}</td>
                      <td className="px-4 py-3 font-medium text-ink-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <Badge tone="brand">{CATEGORY_LABEL[s.category] ?? s.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{s.durationMinutes} min</td>
                    </tr>
                  ))}
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-ink-400">
                        No services yet — create the first bookable service.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Add a service</h2>
          <ServiceForm />
        </Card>
      </div>
    </>
  );
}
