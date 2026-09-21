import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { listReportsForPatientUser } from "@/server/services/queries";

export const metadata = { title: "My reports" };

export default async function PatientReportsPage() {
  const user = await requireRole("PATIENT");
  const reports = await listReportsForPatientUser(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Patient portal"
        title="My reports"
        description="Finalized clinical reports released by your audiologist."
      />

      {reports.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No reports yet"
          message="When your audiologist finalizes a report, it will appear here to view and download."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink-900">{r.title}</h2>
                <p className="mt-0.5 text-sm text-ink-500">
                  {r.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <a
                href={`/api/reports/${r.id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                View report
              </a>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
