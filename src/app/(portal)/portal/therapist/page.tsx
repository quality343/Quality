import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Therapist Dashboard" };

export default async function TherapistDashboardPage() {
  const user = await requireRole("THERAPIST");

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Therapist Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Your therapy schedule, plans, and patient progress in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Today&apos;s sessions</h2>
          <div className="mt-4">
            <EmptyState
              icon="calendar"
              title="No sessions scheduled"
              message="Your therapy sessions will appear here once scheduling opens."
            />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Active plans</h2>
          <div className="mt-4">
            <EmptyState
              icon="shield"
              title="No active therapy plans"
              message="Therapy plans you create will appear here."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
