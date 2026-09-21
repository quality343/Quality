import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { searchAppointmentsForStaff } from "@/server/services/queries";
import { isSheetSyncConfigured } from "@/server/services/google-sheets";
import { AppointmentsTable } from "./AppointmentsTable";
import { listBranches, listServices } from "@/server/services/queries";

export const metadata = { title: "Appointments" };

type SearchParams = Promise<{
  q?: string;
  branch?: string;
  service?: string;
  status?: string;
  date?: string;
  type?: string;
  when?: string;
}>;

const STATUS_OPTIONS = ["BOOKED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(...CLINIC_OPS_ROLES);
  const sp = await searchParams;
  const [appointments, branches, services] = await Promise.all([
    searchAppointmentsForStaff({
      q: sp.q,
      branchId: sp.branch,
      serviceId: sp.service,
      status: sp.status,
      date: sp.date,
      type: sp.type,
      when: sp.when,
    }),
    listBranches(),
    listServices(),
  ]);

  const activeFilters = [sp.q, sp.branch, sp.service, sp.status, sp.date, sp.type, sp.when].filter(Boolean).length;

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Appointments"
        description="Guest and registered bookings. Confirm, check in, complete, cancel, reschedule or mark no-shows."
      />

      <Card bare className="mb-4">
        <form method="GET" className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="block text-xs font-semibold text-ink-600">
              Search name or mobile
            </label>
            <input
              id="q"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="e.g. Priya or 98765…"
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="branch" className="block text-xs font-semibold text-ink-600">Branch</label>
            <select id="branch" name="branch" defaultValue={sp.branch ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-2 text-sm">
              <option value="">All</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="service" className="block text-xs font-semibold text-ink-600">Service</label>
            <select id="service" name="service" defaultValue={sp.service ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-2 text-sm">
              <option value="">All</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type" className="block text-xs font-semibold text-ink-600">Type</label>
            <select id="type" name="type" defaultValue={sp.type ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-2 text-sm">
              <option value="">All</option>
              <option value="CLINIC_VISIT">Clinic visit</option>
              <option value="HOME_CONSULTATION">Home consultation</option>
            </select>
          </div>
          <div>
            <label htmlFor="when" className="block text-xs font-semibold text-ink-600">Date range</label>
            <select id="when" name="when" defaultValue={sp.when ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-2 text-sm">
              <option value="">All</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-ink-600">Status</label>
            <select id="status" name="status" defaultValue={sp.status ?? ""} className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-2 text-sm">
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-xs font-semibold text-ink-600">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={sp.date ?? ""}
              className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white px-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Apply filters
            </button>
            {activeFilters > 0 && (
              <a
                href="/portal/admin/appointments"
                className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-ink-700 hover:border-brand-300"
              >
                Clear ({activeFilters})
              </a>
            )}
          </div>
        </form>
      </Card>

      <Card bare>
        {appointments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="calendar"
              title={activeFilters ? "No appointments match these filters" : "No appointments yet"}
              message={
                activeFilters
                  ? "Try widening the date range or clearing filters."
                  : "Appointments appear here as guests book online or staff add them."
              }
            />
          </div>
        ) : (
          <AppointmentsTable
            appointments={appointments}
            sheetSyncConfigured={isSheetSyncConfigured()}
          />
        )}
      </Card>
    </>
  );
}
