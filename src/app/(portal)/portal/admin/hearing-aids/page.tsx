import { CLINIC_OPS_ROLES, requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/server/db/prisma";
import { BrandManager } from "./BrandManager";
import { ModelManager } from "./ModelManager";
import { InventoryManager } from "./InventoryManager";
import { AccessoryManager } from "./AccessoryManager";

export const metadata = { title: "Hearing aid catalogue" };

const DEVICE_LABEL: Record<string, string> = {
  BTE: "Behind-the-ear",
  RIC: "Receiver-in-canal",
  ITE: "In-the-ear",
  ITC: "In-the-canal",
  CIC: "Completely-in-canal",
  IIC: "Invisible-in-canal",
};

export default async function AdminHearingAidsPage() {
  await requireRole(...CLINIC_OPS_ROLES);

  const [brands, models, items, accessories, branches] = await Promise.all([
    prisma.hearingAidBrand.findMany({ orderBy: { name: "asc" } }),
    prisma.hearingAidModel.findMany({
      orderBy: { modelName: "asc" },
      include: { brand: { select: { name: true } }, _count: { select: { inventory: true } } },
    }),
    prisma.hearingAidInventoryItem.findMany({
      orderBy: { serialNo: "asc" },
      include: {
        model: { include: { brand: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
    }),
    prisma.hearingAidAccessory.findMany({ orderBy: { name: "asc" } }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Hearing aid catalogue"
        description="Brands, models, physical devices, and accessories. Catalogue entries here never imply manufacturer partnership."
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Brands ({brands.length})</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card bare>
                <ul className="divide-y divide-border">
                  {brands.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium text-ink-900">{b.name}</p>
                        <p className="text-xs text-ink-400">{b.website ?? "—"}</p>
                      </div>
                      {b.isActive ? <Badge tone="brand">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                    </li>
                  ))}
                  {brands.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-ink-400">No brands yet.</li>
                  ) : null}
                </ul>
              </Card>
            </div>
            <BrandManager />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Models ({models.length})</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card bare>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-400">
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Brand</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Devices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {models.map((m) => (
                        <tr key={m.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3">
                            <span className="font-medium text-ink-900">{m.modelName}</span>
                            <span className="block font-mono text-xs text-ink-400">{m.modelCode}</span>
                          </td>
                          <td className="px-4 py-3 text-ink-600">{m.brand.name}</td>
                          <td className="px-4 py-3 text-ink-600">{DEVICE_LABEL[m.deviceType] ?? m.deviceType}</td>
                          <td className="px-4 py-3">
                            <Badge tone={m.status === "ACTIVE" ? "brand" : "neutral"}>{m.technologyLevel}</Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-600">{m.priceInr != null ? `₹${m.priceInr.toLocaleString("en-IN")}` : "—"}</td>
                          <td className="px-4 py-3 text-ink-600">{m._count.inventory}</td>
                        </tr>
                      ))}
                      {models.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-400">No models yet.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            <ModelManager brands={brands.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name }))} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Physical devices ({items.length})</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card bare>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-400">
                        <th className="px-4 py-3">Serial</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-ink-700">{i.serialNo}</td>
                          <td className="px-4 py-3 text-ink-600">{i.model.brand.name} {i.model.modelName}</td>
                          <td className="px-4 py-3 text-ink-600">{i.branch.name}</td>
                          <td className="px-4 py-3"><Badge tone="neutral">{i.status}</Badge></td>
                        </tr>
                      ))}
                      {items.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-400">No devices in inventory.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            <InventoryManager
              models={models.filter((m) => m.status === "ACTIVE").map((m) => ({ id: m.id, label: `${m.brand.name} ${m.modelName}` }))}
              branches={branches}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Accessories ({accessories.length})</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card bare>
                <ul className="divide-y divide-border">
                  {accessories.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium text-ink-900">{a.name}</p>
                        <p className="text-xs text-ink-400">{a.category}</p>
                      </div>
                      <span className="text-sm text-ink-600">{a.priceInr != null ? `₹${a.priceInr.toLocaleString("en-IN")}` : "—"}</span>
                    </li>
                  ))}
                  {accessories.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-ink-400">No accessories yet.</li>
                  ) : null}
                </ul>
              </Card>
            </div>
            <AccessoryManager models={models.map((m) => ({ id: m.id, label: `${m.brand.name} ${m.modelName}` }))} />
          </div>
        </section>
      </div>
    </>
  );
}
