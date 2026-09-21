import { requireRole } from "@/lib/auth/guards";
import { patientDisplayName } from "@/lib/patient-display";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/server/db/prisma";
import { CatalogueBrowser } from "./CatalogueBrowser";
import { RecommendationList } from "./RecommendationList";

export const metadata = { title: "Hearing aids" };

export default async function AudiologistHearingAidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("AUDIOLOGIST");
  const params = await searchParams;
  const val = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);

  const [brands, myRecs] = await Promise.all([
    prisma.hearingAidBrand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hearingAidRecommendation.findMany({
      where: { audiologist: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        patient: { select: { mrn: true, user: { select: { name: true } } } },
        model: { include: { brand: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Audiologist"
        title="Hearing aid catalogue"
        description="Browse products, compare options, and prepare professional recommendations. The catalogue informs — it never decides."
      />

      <div className="space-y-8">
        <CatalogueBrowser
          brands={brands}
          initialFilters={{
            brandId: val("brandId"),
            deviceType: val("deviceType"),
            technologyLevel: val("technologyLevel"),
            q: val("q"),
          }}
        />

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">My recommendations</h2>
          <Card bare>
            <RecommendationList
              items={myRecs.map((r) => ({
                id: r.id,
                patientName: patientDisplayName(r.patient),
                patientMrn: r.patient.mrn,
                modelLabel: `${r.model.brand.name} ${r.model.modelName}`,
                status: r.status,
                patientDecision: r.patientDecision,
                createdAt: r.createdAt.toISOString(),
              }))}
            />
          </Card>
        </section>
      </div>
    </>
  );
}
