import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listAssessmentsForPatientUser } from "@/server/services/queries";
import { AudiogramChart } from "@/components/clinical/AudiogramChart";
import type { PtaPayload } from "@/lib/validation/clinical";

export const metadata = { title: "My hearing tests" };

const TEST_LABEL: Record<string, string> = {
  PTA: "Pure Tone Audiometry",
  SPEECH: "Speech Audiometry",
  TYMPANOMETRY: "Tympanometry",
  ABR: "ABR / BERA",
  OAE: "OAE",
  VESTIBULAR: "Vestibular",
  TINNITUS: "Tinnitus",
  SPECIALIZED: "Specialized",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "In progress",
  COMPLETED: "Awaiting review",
  REVIEWED: "Reviewed",
  REPORTED: "Report available",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  DRAFT: "accent",
  COMPLETED: "brand",
  REVIEWED: "brand",
  REPORTED: "neutral",
  CANCELLED: "neutral",
};

export default async function PatientHearingTestsPage() {
  const user = await requireRole("PATIENT");
  const assessments = await listAssessmentsForPatientUser(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Patient portal"
        title="My hearing tests"
        description="Your assessments and recorded results. Charts show recorded data; the meaning of your results is explained by your audiologist."
      />

      {assessments.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            No hearing tests yet. Book an appointment and your audiologist will start
            an assessment during your visit.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {assessments.map((a) => {
            const pta = a.testResults.find((t) => t.testType === "PTA");
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-ink-900">
                    {a.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <Badge tone={STATUS_TONE[a.status] ?? "neutral"}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </div>

                <ul className="mt-3 flex flex-wrap gap-2">
                  {a.testResults.map((t) => (
                    <li key={t.id}>
                      <Badge tone="neutral">{TEST_LABEL[t.testType] ?? t.testType}</Badge>
                    </li>
                  ))}
                  {a.testResults.length === 0 ? (
                    <li className="text-sm text-ink-400">No recorded tests yet.</li>
                  ) : null}
                </ul>

                {a.reviewText ? (
                  <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                      Your audiologist&apos;s explanation
                    </p>
                    <p className="mt-1 text-sm text-ink-700">{a.reviewText}</p>
                  </div>
                ) : null}

                {pta ? (
                  <div className="mt-4">
                    <AudiogramChart data={pta.payload as PtaPayload} />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
