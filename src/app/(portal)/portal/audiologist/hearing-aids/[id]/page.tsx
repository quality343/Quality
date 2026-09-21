import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { patientDisplayName } from "@/lib/patient-display";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/server/db/prisma";
import { getModelDetail } from "@/server/services/hearingaid";
import { NotFoundError } from "@/lib/service-errors";
import { RecommendationForm } from "./RecommendationForm";

export const metadata = { title: "Model details" };

const DEVICE_LABELS: Record<string, string> = {
  BTE: "Behind-the-ear",
  RIC: "Receiver-in-canal",
  ITE: "In-the-ear",
  ITC: "In-the-canal",
  CIC: "Completely-in-canal",
  IIC: "Invisible-in-canal",
};

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("AUDIOLOGIST");
  const { id } = await params;

  let model;
  try {
    model = await getModelDetail(user, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const [branchNames, recentPatients] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.patient.findMany({
      orderBy: { user: { name: "asc" } },
      take: 50,
      select: { id: true, mrn: true, user: { select: { name: true } } },
    }),
  ]);

  const availByBranch = new Map<string, number>();
  for (const item of model.inventory) {
    if (item.status === "AVAILABLE") {
      availByBranch.set(item.branchId, (availByBranch.get(item.branchId) ?? 0) + 1);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={model.brand.name}
        title={model.modelName}
        description={model.description ?? undefined}
        actions={<Badge tone={model.status === "ACTIVE" ? "brand" : "neutral"}>{model.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Specifications</h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-ink-500">Device type</dt>
                <dd className="text-sm text-ink-900">{DEVICE_LABELS[model.deviceType] ?? model.deviceType}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-500">Technology level</dt>
                <dd className="text-sm text-ink-900">{model.technologyLevel}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-500">Model code</dt>
                <dd className="font-mono text-sm text-ink-900">{model.modelCode}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-500">Catalogue price</dt>
                <dd className="text-sm text-ink-900">
                  {model.priceInr != null ? `₹${model.priceInr.toLocaleString("en-IN")}` : "On request"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-500">Warranty</dt>
                <dd className="text-sm text-ink-900">
                  {model.warrantyMonths != null
                    ? `${model.warrantyMonths} months (manufacturer-recorded only)`
                    : "As recorded per device"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-500">Brand website</dt>
                <dd className="text-sm text-ink-900">
                  {model.brand.website ? (
                    <a href={model.brand.website} target="_blank" rel="noreferrer noopener" className="text-brand-700 underline">
                      {model.brand.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-ink-900">Features</h2>
            {model.features.length === 0 ? (
              <p className="mt-2 text-sm text-ink-400">No features recorded for this model.</p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {model.features.map((f) => (
                  <li key={f.featureId} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    <span>
                      <span className="font-medium text-ink-900">{f.feature.label}</span>
                      {f.detail ? <span className="text-ink-500"> — {f.detail}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-400">
              Features are recorded per model in the catalogue; a feature listed here
              applies to this model only, never assumed across products.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Availability</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {branchNames.map((b) => (
                <li key={b.id} className="flex items-center justify-between">
                  <span className="text-ink-600">{b.name}</span>
                  <Badge tone={availByBranch.get(b.id) ? "brand" : "neutral"}>
                    {availByBranch.get(b.id) ? `${availByBranch.get(b.id)} available` : "—"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <RecommendationForm
            modelId={model.id}
            modelLabel={`${model.brand.name} ${model.modelName}`}
            patients={recentPatients.map((p) => ({ id: p.id, label: `${patientDisplayName(p)} (${p.mrn})` }))}
          />
        </div>
      </div>
    </>
  );
}
