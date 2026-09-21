import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { searchAppointmentsForStaff } from "@/server/services/queries";
import { AppointmentsTable } from "../appointments/AppointmentsTable";

export const metadata = { title: "Home consultations" };

type SearchParams = Promise<{ when?: string }>;

/**
 * Home-consultation worklist. These requests carry a patient's home address, so
 * the view is limited to authorized clinic staff and is never indexed, never
 * rendered publicly and never placed in a URL.
 */
export default async function HomeConsultationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(...CLINIC_OPS_ROLES);
  const sp = await searchParams;
  const when = sp.when === "past" || sp.when === "upcoming" ? sp.when : undefined;

  const appointments = await searchAppointmentsForStaff({
    type: "HOME_CONSULTATION",
    ...(when ? { when } : {}),
  });

  const pending = appointments.filter(
    (a) =>
      a.homeConfirmationStatus !== "CONFIRMED" &&
      a.status !== "CANCELLED" &&
      a.status !== "COMPLETED",
  ).length;

  const filters: { label: string; when?: string }[] = [
    { label: "All" },
    { label: "Upcoming", when: "upcoming" },
    { label: "Past", when: "past" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Home consultations"
        description="Requests for a visit at the patient's address. Call the patient to fix the exact time, then confirm the appointment."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label="Filter home consultations" className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = (f.when ?? "") === (when ?? "");
            return (
              <a
                key={f.label}
                href={f.when ? `?when=${f.when}` : "?"}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold ${
                  active
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-border text-ink-700 hover:border-brand-300"
                }`}
              >
                {f.label}
              </a>
            );
          })}
        </nav>
        <p className="text-sm text-ink-500">
          {appointments.length} request{appointments.length === 1 ? "" : "s"}
          {pending > 0 ? ` · ${pending} awaiting confirmation` : ""}
        </p>
      </div>

      <Card bare>
        {appointments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="home"
              title="No home consultations"
              message="Requests from the website appear here with the patient's address and preferred time."
            />
          </div>
        ) : (
          <AppointmentsTable appointments={appointments} />
        )}
      </Card>

      <p className="mt-4 text-xs text-ink-500">
        Patient addresses are private. Do not copy them into email, chat or any
        other system outside this portal.
      </p>
    </>
  );
}
