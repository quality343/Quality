import { requireRole } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/EmptyState";
import { PORTALS } from "@/lib/auth/portal-nav";

export const metadata = { title: "Appointments" };

export default async function Page() {
  const user = await requireRole("AUDIOLOGIST");
  const { areaTitle } = PORTALS.AUDIOLOGIST;

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          {areaTitle}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Appointments
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Signed in as {user.name}.
        </p>
      </header>
      <EmptyState icon="calendar" title="Appointments" message="Today's schedule and upcoming appointments will appear here." />
    </>
  );
}
