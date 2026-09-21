import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/server/db/prisma";
import {
  countAppointmentsToday,
  countOpenSlots,
  searchAppointmentsForStaff,
} from "@/server/services/queries";

export const metadata = { title: "Clinic Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requireRole(...CLINIC_OPS_ROLES);

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const [todayCount, openSlots, upcoming, newEnquiries, pendingHome, recent] =
    await Promise.all([
      countAppointmentsToday(),
      countOpenSlots(),
      searchAppointmentsForStaff({ when: "upcoming" }),
      prisma.contactEnquiry.count({ where: { status: "NEW" } }),
      prisma.appointment.count({
        where: { appointmentType: "HOME_CONSULTATION", homeConfirmationStatus: "PENDING_CONFIRMATION", status: { not: "CANCELLED" } },
      }),
      searchAppointmentsForStaff({}),
    ]);

  const stats = [
    { label: "Appointments today", value: todayCount, href: "/portal/admin/appointments?when=today" },
    { label: "Upcoming bookings", value: upcoming.length, href: "/portal/admin/appointments?when=upcoming" },
    { label: "Open slots", value: openSlots, href: "/portal/admin/availability" },
    { label: "New enquiries", value: newEnquiries, href: "/portal/admin/enquiries" },
  ];

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Clinic operations
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          One clinic in Hyderabad: appointments, home consultations, availability,
          services, hearing aids and clinic information.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-300"
          >
            <p className="text-3xl font-bold text-ink-900">{s.value}</p>
            <p className="mt-1 text-sm text-ink-500">{s.label}</p>
          </a>
        ))}
      </div>

      {pendingHome > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/60">
          <h2 className="text-base font-semibold text-ink-900">
            {pendingHome} home consultation{pendingHome === 1 ? "" : "s"} awaiting confirmation
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Patients are waiting for a call back to fix the exact visit time.
          </p>
          <a
            href="/portal/admin/appointments?type=HOME_CONSULTATION"
            className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Review home consultations
          </a>
        </Card>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Latest bookings</h2>
          <a href="/portal/admin/appointments" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            View all →
          </a>
        </div>
        {recent.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar"
              title="No appointments yet"
              message="Bookings from the website will appear here."
            />
          </Card>
        ) : (
          <Card bare>
            <ul className="divide-y divide-border/60">
              {recent.slice(0, 6).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium text-ink-900">{a.patient}</span>
                    <span className="text-ink-500"> · {a.service}</span>
                    {a.appointmentType === "HOME_CONSULTATION" && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        🏠 Home
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-500">
                    <span>{a.when}</span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 font-semibold text-ink-600">
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <p className="mt-10 text-xs text-ink-400">
        {startOfToday.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · India Standard Time
      </p>
    </>
  );
}
