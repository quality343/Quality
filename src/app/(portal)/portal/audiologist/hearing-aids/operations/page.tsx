import { requireRole } from "@/lib/auth/guards";
import { patientDisplayName } from "@/lib/patient-display";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/server/db/prisma";
import { DemoManager } from "./DemoManager";
import { FittingManager } from "./FittingManager";
import { DispensingManager } from "./DispensingManager";
import { ServiceManager } from "./ServiceManager";
import { WarrantyManager } from "./WarrantyManager";
import { AftercareManager } from "./AftercareManager";

export const metadata = { title: "Hearing aid operations" };

const modelInclude = { include: { brand: { select: { name: true } } } } as const;

export default async function AidOperationsPage() {
  await requireRole("AUDIOLOGIST", "CLINIC_STAFF");

  const [demos, fittings, dispensings, serviceRecords, aftercare, warranties, patients, devices] =
    await Promise.all([
      prisma.hearingAidDemo.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          item: { include: { model: modelInclude } },
          patient: { select: { user: { select: { name: true } }, mrn: true } },
          staff: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.hearingAidFitting.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          item: { include: { model: modelInclude } },
          patient: { select: { user: { select: { name: true } }, mrn: true } },
          audiologist: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.hearingAidDispensing.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          item: { include: { model: modelInclude } },
          patient: { select: { user: { select: { name: true } }, mrn: true } },
          dispensedBy: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.hearingAidServiceRecord.findMany({
        orderBy: { reportedAt: "desc" },
        take: 40,
        include: {
          item: { include: { model: modelInclude } },
          patient: { select: { user: { select: { name: true } }, mrn: true } },
        },
      }),
      prisma.hearingAidFollowUp.findMany({
        orderBy: { dueDate: "asc" },
        take: 40,
        include: { patient: { select: { user: { select: { name: true } }, mrn: true } } },
      }),
      prisma.hearingAidWarranty.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          item: { include: { model: modelInclude } },
          patient: { select: { user: { select: { name: true } }, mrn: true } },
        },
      }),
      prisma.patient.findMany({
        orderBy: { user: { name: "asc" } },
        take: 50,
        select: { id: true, mrn: true, user: { select: { name: true } } },
      }),
      prisma.hearingAidInventoryItem.findMany({
        where: { status: { in: ["AVAILABLE", "RESERVED", "FITTED", "DEMO", "DISPENSED", "REPAIR"] } },
        orderBy: { serialNo: "asc" },
        include: { model: modelInclude, branch: { select: { name: true } } },
      }),
    ]);

  const patientOpts = patients.map((p) => ({ id: p.id, label: `${patientDisplayName(p)} (${p.mrn})` }));
  const deviceOpts = devices.map((d) => ({
    id: d.id,
    label: `${d.model.brand.name} ${d.model.modelName} · ${d.serialNo} (${d.status})`,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Audiologist"
        title="Hearing aid operations"
        description="Demos, fittings, dispensing, service, and aftercare — every action is audited and permission-checked."
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Demos ({demos.length})</h2>
          <Card bare>
            <DemoManager
              demos={demos.map((d) => ({
                id: d.id,
                patientName: patientDisplayName(d.patient),
                device: `${d.item.model.brand.name} ${d.item.model.modelName} · ${d.item.serialNo}`,
                status: d.status,
                expectedReturnAt: d.expectedReturnAt.toISOString(),
                startedAt: d.startedAt?.toISOString() ?? null,
                actualReturnAt: d.actualReturnAt?.toISOString() ?? null,
              }))}
              patients={patientOpts}
              devices={deviceOpts.filter((d) => d.label.includes("(AVAILABLE)") || d.label.includes("(DEMO)"))}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Fittings ({fittings.length})</h2>
          <Card bare>
            <FittingManager
              fittings={fittings.map((f) => ({
                id: f.id,
                patientName: patientDisplayName(f.patient),
                device: `${f.item.model.brand.name} ${f.item.model.modelName} · ${f.item.serialNo}`,
                earSide: f.earSide,
                status: f.status,
                audiologist: f.audiologist?.user.name ?? "—",
                followUpDate: f.followUpDate?.toISOString() ?? null,
              }))}
              patients={patientOpts}
              devices={deviceOpts}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Dispensing ({dispensings.length})</h2>
          <Card bare>
            <DispensingManager
              records={dispensings.map((d) => ({
                id: d.id,
                patientName: patientDisplayName(d.patient),
                device: `${d.item.model.brand.name} ${d.item.model.modelName} · ${d.item.serialNo}`,
                status: d.status,
                dispensedAt: d.dispensedAt?.toISOString() ?? null,
                acknowledged: d.patientAcknowledgedAt != null,
              }))}
              patients={patientOpts}
              devices={deviceOpts}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Service &amp; repairs ({serviceRecords.length})</h2>
          <Card bare>
            <ServiceManager
              records={serviceRecords.map((r) => ({
                id: r.id,
                patientName: patientDisplayName(r.patient),
                device: `${r.item.model.brand.name} ${r.item.model.modelName} · ${r.item.serialNo}`,
                serviceType: r.serviceType,
                status: r.status,
                issue: r.issueDescription,
                reportedAt: r.reportedAt.toISOString(),
              }))}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Warranty ({warranties.length})</h2>
          <Card bare>
            <WarrantyManager
              warranties={warranties.map((w) => ({
                id: w.id,
                patientName: patientDisplayName(w.patient),
                device: `${w.item.model.brand.name} ${w.item.model.modelName} · ${w.item.serialNo}`,
                provider: w.provider,
                reference: w.reference,
                startDate: w.startDate.toISOString(),
                endDate: w.endDate.toISOString(),
                status: w.status,
              }))}
              patients={patientOpts}
              devices={deviceOpts.filter((d) => d.label.includes("(DISPENSED)") || d.label.includes("(REPAIR)"))}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Aftercare follow-ups ({aftercare.length})</h2>
          <Card bare>
            <AftercareManager
              items={aftercare.map((f) => ({
                id: f.id,
                patientName: patientDisplayName(f.patient),
                reason: f.reason,
                status: f.status,
                dueDate: f.dueDate.toISOString(),
                outcome: f.outcome,
              }))}
              patients={patientOpts}
            />
          </Card>
        </section>

        <p className="text-xs text-ink-400">
          <Badge tone="neutral">Note</Badge> Fitting records document programming in
          plain language — the application does not connect to or program physical
          hearing aids.
        </p>
      </div>
    </>
  );
}
