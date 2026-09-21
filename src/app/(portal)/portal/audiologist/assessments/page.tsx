import { requireRole } from "@/lib/auth/guards";
import { patientDisplayName } from "@/lib/patient-display";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listAssessmentsForStaff } from "@/server/services/queries";
import { StartAssessmentForm } from "./StartAssessmentForm";

export const metadata = { title: "Assessments" };

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  DRAFT: "accent",
  COMPLETED: "brand",
  REVIEWED: "brand",
  REPORTED: "neutral",
  CANCELLED: "neutral",
};

export default async function AudiologistAssessmentsPage() {
  const user = await requireRole("AUDIOLOGIST");
  const assessments = await listAssessmentsForStaff(user);

  return (
    <>
      <PageHeader
        eyebrow="Audiologist"
        title="Hearing assessments"
        description="Start an assessment, record test data, then hand off for review and reporting."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card bare>
            {assessments.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-ink-400">
                No assessments yet — start one for a patient on the right.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {assessments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink-900">{patientDisplayName(a.patient)}</span>
                        <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>{a.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {a.patient.mrn} · {a._count.testResults} test(s) ·{" "}
                        {a.audiologist?.user.name ?? "unassigned"} ·{" "}
                        {a.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <a
                      href={`/portal/audiologist/assessments/${a.id}`}
                      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <StartAssessmentForm />
      </div>
    </>
  );
}
