import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPatientAidOverview } from "@/server/services/hearingaid";
import { DecisionButtons } from "./DecisionButtons";
import { ServiceRequestForm } from "./ServiceRequestForm";

export const metadata = { title: "My hearing aids" };

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PatientHearingAidsPage() {
  const user = await requireRole("PATIENT");
  const overview = await getPatientAidOverview(user.id);

  if (!overview) {
    return (
      <>
        <PageHeader eyebrow="Patient portal" title="My hearing aids" />
        <EmptyState icon="check" title="No hearing aid records" message="Records appear here after your assessment and fitting." />
      </>
    );
  }

  const { recommendations, fittings, dispensings, warranties, serviceRecords, followUps, demos } = overview;

  return (
    <>
      <PageHeader
        eyebrow="Patient portal"
        title="My hearing aids"
        description="Recommendations from your audiologist, your devices, fittings, warranty, service, and aftercare — all in one place."
      />

      <div className="space-y-8">
        {/* Recommendations */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Recommendations</h2>
          {recommendations.length === 0 ? (
            <Card>
              <p className="text-sm text-ink-500">
                No recommendations yet. After your assessment, your audiologist may
                prepare one for your review — nothing is automatic.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((r) => (
                <Card key={r.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink-900">
                      {r.model.brand.name} {r.model.modelName}
                    </h3>
                    <div className="flex gap-2">
                      <Badge tone="brand">{r.status}</Badge>
                      <Badge tone={r.patientDecision === "ACCEPTED" ? "brand" : r.patientDecision === "PENDING" ? "accent" : "neutral"}>
                        Your decision: {r.patientDecision.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="font-medium text-ink-600">Your audiologist&apos;s explanation</dt>
                      <dd className="text-ink-700">{r.reason}</dd>
                    </div>
                    {r.listeningNeeds ? (
                      <div>
                        <dt className="font-medium text-ink-600">Your listening needs (as recorded)</dt>
                        <dd className="text-ink-500">{r.listeningNeeds}</dd>
                      </div>
                    ) : null}
                    {r.followUpPlan ? (
                      <div>
                        <dt className="font-medium text-ink-600">Follow-up plan</dt>
                        <dd className="text-ink-500">{r.followUpPlan}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="font-medium text-ink-600">Recommended by</dt>
                      <dd className="text-ink-500">
                        {r.audiologist.user.name}, {fmtDate(r.createdAt)}
                      </dd>
                    </div>
                  </dl>
                  {r.status === "APPROVED" && r.patientDecision === "PENDING" ? (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-ink-700">
                        Would you like to go ahead with this recommendation? This is not a
                        purchase — your answer simply tells your audiologist how to proceed.
                      </p>
                      <DecisionButtons recommendationId={r.id} />
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Devices & fittings */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">My devices &amp; fittings</h2>
          {fittings.length === 0 ? (
            <EmptyState icon="check" title="No fittings yet" message="Fitting records appear here once your audiologist completes one." showPhaseNote={false} />
          ) : (
            <div className="space-y-3">
              {fittings.map((f) => (
                <Card key={f.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">
                      {f.item.model.brand.name} {f.item.model.modelName}
                    </span>
                    <Badge tone="neutral">{f.earSide === "BILATERAL" ? "Both ears" : f.earSide === "RIGHT" ? "Right ear" : "Left ear"}</Badge>
                    <Badge tone="brand">{f.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    Fitted by {f.audiologist.user.name} · {fmtDate(f.fittingDate)}
                  </p>
                </Card>
              ))}
            </div>
          )}
          {dispensings.some((d) => d.status === "DISPENSED") ? (
            <p className="mt-3 text-sm text-ink-500">
              🎉 Your device{dispensings.filter((d) => d.status === "DISPENSED").length > 1 ? "s were" : " was"} dispensed — see warranty below.
            </p>
          ) : null}
        </section>

        {/* Warranty */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Warranty</h2>
          {warranties.length === 0 ? (
            <EmptyState icon="shield" title="No warranty on record" message="Warranty appears here only when recorded and verified by our staff." showPhaseNote={false} />
          ) : (
            <div className="space-y-3">
              {warranties.map((w) => (
                <Card key={w.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{w.provider}</span>
                    <Badge tone={w.status === "ACTIVE" ? "brand" : "neutral"}>{w.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {fmtDate(w.startDate)} – {fmtDate(w.endDate)}
                    {w.reference ? ` · Ref ${w.reference}` : ""}
                  </p>
                  {w.coverageNotes ? (
                    <p className="mt-1 text-sm text-ink-500">{w.coverageNotes}</p>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Service */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Service &amp; repairs</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ServiceRequestForm
              devices={fittings.map((f) => ({
                id: f.item.id,
                label: `${f.item.model.brand.name} ${f.item.model.modelName}`,
              }))}
            />
            <Card bare>
              <ul className="divide-y divide-border">
                {serviceRecords.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-ink-400">No service requests yet.</li>
                ) : (
                  serviceRecords.map((r) => (
                    <li key={r.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink-900">
                          {r.item.model.brand.name} {r.item.model.modelName}
                        </span>
                        <Badge tone={r.status === "COMPLETED" ? "neutral" : "brand"}>{r.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500">{r.issueDescription}</p>
                      <p className="text-xs text-ink-400">Reported {fmtDate(r.reportedAt)}</p>
                    </li>
                  ))
                )}
              </ul>
            </Card>
          </div>
        </section>

        {/* Demo history & aftercare */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink-900">Demo history</h2>
            {demos.length === 0 ? (
              <EmptyState icon="clock" title="No demos yet" message="Trial periods appear here when arranged with your audiologist." showPhaseNote={false} />
            ) : (
              <Card bare>
                <ul className="divide-y divide-border">
                  {demos.map((d) => (
                    <li key={d.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink-900">
                          {d.item.model.brand.name} {d.item.model.modelName}
                        </span>
                        <Badge tone={d.status === "ACTIVE" ? "brand" : "neutral"}>{d.status}</Badge>
                      </div>
                      <p className="text-xs text-ink-400">
                        {fmtDate(d.startedAt)} → returned {fmtDate(d.actualReturnAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink-900">Aftercare</h2>
            {followUps.length === 0 ? (
              <EmptyState icon="heart" title="No aftercare scheduled" message="Check-ins after your fitting appear here." showPhaseNote={false} />
            ) : (
              <Card bare>
                <ul className="divide-y divide-border">
                  {followUps.map((f) => (
                    <li key={f.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink-900">{f.reason.replace(/_/g, " ").toLowerCase()}</span>
                        <Badge tone={f.status === "DONE" ? "neutral" : "brand"}>{f.status}</Badge>
                      </div>
                      <p className="text-xs text-ink-400">Due {fmtDate(f.dueDate)}</p>
                      {f.outcome ? <p className="mt-0.5 text-xs text-ink-500">{f.outcome}</p> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
