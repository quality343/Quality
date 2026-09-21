import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  listAppointmentsForPatientUser,
  unreadNotificationCount,
} from "@/server/services/queries";

export const metadata = { title: "Patient Dashboard" };

export default async function PatientDashboardPage() {
  const user = await requireRole("PATIENT");
  const [appointments, unread] = await Promise.all([
    listAppointmentsForPatientUser(user.id),
    unreadNotificationCount(user.id),
  ]);

  const upcoming = appointments
    .filter((a) => a.status === "BOOKED" || a.status === "CHECKED_IN" || a.status === "IN_PROGRESS")
    .slice(0, 3);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Patient Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Your care journey at QUALITY Hearing Care — appointments, results, and
          reports in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-ink-900">Upcoming appointments</h2>
            <a href="/portal/patient/appointments" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Book / manage →
            </a>
          </div>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-400">
                Nothing upcoming — book a visit to get started.
              </p>
            ) : (
              upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{a.service.name}</p>
                    <p className="text-xs text-ink-500">
                      {a.slot?.startsAt.toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      · {a.branch.name}
                    </p>
                  </div>
                  <Badge>{a.status.replace("_", " ")}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Your account</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Name</dt>
              <dd className="font-medium text-ink-900">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Email</dt>
              <dd className="font-medium text-ink-900">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Mobile</dt>
              <dd className="font-medium text-ink-900">{user.phone ?? "—"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a href="/portal/patient/hearing-tests" className="font-semibold text-brand-700 hover:text-brand-800">
              My hearing tests →
            </a>
            <a href="/portal/patient/notifications" className="font-semibold text-brand-700 hover:text-brand-800">
              Notifications{unread > 0 ? ` (${unread} unread)` : ""} →
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}
