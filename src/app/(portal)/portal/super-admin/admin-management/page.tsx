import { requireRole } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/EmptyState";
import { PORTALS } from "@/lib/auth/portal-nav";

export const metadata = { title: "Admin Management" };

export default async function Page() {
  const user = await requireRole("SUPER_ADMIN");
  const { areaTitle } = PORTALS.SUPER_ADMIN;

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          {areaTitle}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Admin Management
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Signed in as {user.name}.
        </p>
      </header>
      <EmptyState icon="users" title="Admin Management" message="Administrator accounts will be managed here." />
    </>
  );
}
