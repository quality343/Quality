import { requireRole } from "@/lib/auth/guards";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Super Admin Dashboard" };

export default async function SuperAdminDashboardPage() {
  const user = await requireRole("SUPER_ADMIN");

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Super Admin Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Platform-level administration — settings, roles, and audit oversight.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">System status</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Authentication operational
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Audit logging active
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ink-400" />
              Business modules pending (Phase 2+)
            </li>
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Security events</h2>
          <div className="mt-4">
            <EmptyState
              icon="clock"
              title="Audit viewer coming soon"
              message="The full audit-trail viewer opens with the admin tooling phase."
            />
          </div>
        </Card>
      </div>
    </>
  );
}
