import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Audiologist Dashboard" };

export default async function AudiologistDashboardPage() {
  const user = await requireRole("AUDIOLOGIST");

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Audiologist Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Your clinical workday at a glance — schedule, assessments, and reviews.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Today</h2>
          <div className="mt-4">
            <EmptyState
              icon="calendar"
              title="No appointments scheduled"
              message="Your schedule will appear here once appointment management opens."
            />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Awaiting review</h2>
          <div className="mt-4">
            <EmptyState
              icon="ear"
              title="No pending reviews"
              message="Assessments awaiting your review will appear here."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
