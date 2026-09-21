import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  listAppointmentsForPatientUser,
  listBranches,
  listServices,
} from "@/server/services/queries";
import { BookingWizard } from "./BookingWizard";

export const metadata = { title: "My appointments" };

function formatSlot(d: Date): string {
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  BOOKED: "brand",
  CHECKED_IN: "brand",
  IN_PROGRESS: "brand",
  COMPLETED: "neutral",
  CANCELLED: "accent",
  NO_SHOW: "accent",
};

export default async function PatientAppointmentsPage() {
  const user = await requireRole("PATIENT");
  const [appointments, branches, services] = await Promise.all([
    listAppointmentsForPatientUser(user.id),
    listBranches(),
    listServices(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Patient portal"
        title="My appointments"
        description="Book a visit at a branch near you, or review your upcoming and past appointments."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card bare>
            {appointments.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-400">
                No appointments yet — pick a branch and slot to book your first visit.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {appointments.map((a) => (
                  <li key={a.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink-900">{a.slot ? formatSlot(a.slot.startsAt) : "Time TBC"}</span>
                      <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                        {a.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {a.service.name} · {a.branch.name}
                      {a.staff ? ` · ${a.staff.user.name}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="mt-4">
            <Button href="/portal/patient/hearing-tests" variant="secondary" size="sm">
              View hearing tests
            </Button>
          </div>
        </div>

        <BookingWizard
          branches={branches.map((b) => ({ id: b.id, name: b.name, city: b.city }))}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </>
  );
}
