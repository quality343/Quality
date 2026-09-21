import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  getAssessmentForUser,
  assertCanViewAssessment,
} from "@/server/services/clinical";
import { patientDisplayName } from "@/lib/patient-display";
import { PtaForm } from "../PtaForm";
import { OtherTestsForm } from "../OtherTestsForm";
import { ForbiddenError, NotFoundError } from "@/lib/service-errors";
import { ReviewForm } from "../ReviewForm";
import { ReportActions } from "../ReportActions";
import { CompleteAssessmentButton } from "../CompleteAssessmentButton";
import { AudiogramChart } from "@/components/clinical/AudiogramChart";
import type { PtaPayload } from "@/lib/validation/clinical";

export const metadata = { title: "Assessment" };

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  DRAFT: "accent",
  COMPLETED: "brand",
  REVIEWED: "brand",
  REPORTED: "neutral",
  CANCELLED: "neutral",
};

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

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("AUDIOLOGIST");
  const { id } = await params;

  let assessment;
  try {
    assessment = await getAssessmentForUser(user, id);
    assertCanViewAssessment(user, assessment);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }

  const ptaResult = assessment.testResults.find((t) => t.testType === "PTA");
  const otherResults = assessment.testResults.filter((t) => t.testType !== "PTA");
  const isDraft = assessment.status === "DRAFT";
  const isReviewed = assessment.status === "REVIEWED";

  return (
    <>
      <PageHeader
        eyebrow={`Assessment · ${assessment.status}`}
        title={patientDisplayName(assessment.patient)}
        description={`MRN ${assessment.patient.mrn}${
          assessment.audiologist ? ` · Audiologist: ${assessment.audiologist.user.name}` : ""
        }`}
        actions={<Badge tone={STATUS_TONE[assessment.status] ?? "neutral"}>{assessment.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Case history</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium text-ink-600">Complaints</dt>
              <dd className="text-ink-500">{assessment.complaints ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-600">History</dt>
              <dd className="text-ink-500">{assessment.history ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-600">Referred by</dt>
              <dd className="text-ink-500">{assessment.referredBy ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Tests recorded</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {assessment.testResults.length === 0 ? (
              <li className="text-ink-400">No tests recorded yet.</li>
            ) : (
              assessment.testResults.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
                  <span className="font-medium text-ink-800">{TEST_LABEL[t.testType] ?? t.testType}</span>
                  <span className="text-xs text-ink-400">
                    {t.performedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </li>
              ))
            )}
          </ul>
          {assessment.reviewText ? (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Audiologist review
              </p>
              <p className="mt-1 text-sm text-ink-700">{assessment.reviewText}</p>
              <p className="mt-1 text-xs text-ink-400">
                — {assessment.reviewer?.user.name ?? ""}
                {assessment.reviewedAt
                  ? `, ${assessment.reviewedAt.toLocaleDateString("en-IN")}`
                  : ""}
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      {isDraft ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <PtaForm assessmentId={assessment.id} />
          <OtherTestsForm assessmentId={assessment.id} />
        </div>
      ) : null}

      {ptaResult ? (
        <div className="mt-6">
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Audiogram</h2>
            <p className="mt-1 text-xs text-ink-400">
              Recorded thresholds in dB HL. This chart displays data; interpretation is
              the audiologist&apos;s review, never an automatic conclusion.
            </p>
            <div className="mt-4">
              <AudiogramChart data={ptaResult.payload as PtaPayload} />
            </div>
          </Card>
        </div>
      ) : null}

      {!isDraft && !isReviewed && assessment.status !== "COMPLETED" ? null : null}

      {assessment.status === "COMPLETED" ? (
        <div className="mt-6">
          <ReviewForm assessmentId={assessment.id} />
        </div>
      ) : null}

      {isReviewed ? (
        <div className="mt-6">
          <ReportActions assessmentId={assessment.id} />
        </div>
      ) : null}

      {isDraft ? (
        <div className="mt-6">
          <CompleteAssessmentButton assessmentId={assessment.id} hasTests={assessment.testResults.length > 0} />
        </div>
      ) : null}

      {otherResults.length > 0 || ptaResult ? (
        <div className="mt-6">
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Recorded payloads</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-muted p-3 text-xs text-ink-600">
              {JSON.stringify(assessment.testResults.map((t) => ({ type: t.testType, data: t.payload })), null, 2)}
            </pre>
          </Card>
        </div>
      ) : null}
    </>
  );
}