"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

type ModelCard = {
  id: string;
  brandName: string;
  modelName: string;
  modelCode: string;
  deviceType: string;
  technologyLevel: string;
  description: string | null;
  priceInr: number | null;
  warrantyMonths: number | null;
  features: { key: string; label: string; detail: string | null }[];
  availableBranchIds: string[];
};

const DEVICE_LABELS: Record<string, string> = {
  BTE: "Behind-the-ear",
  RIC: "Receiver-in-canal",
  ITE: "In-the-ear",
  ITC: "In-the-canal",
  CIC: "Completely-in-canal",
  IIC: "Invisible-in-canal",
};

export function CatalogueBrowser({
  brands,
  initialFilters,
}: {
  brands: { id: string; name: string }[];
  initialFilters: { brandId?: string; deviceType?: string; technologyLevel?: string; q?: string };
}) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(initialFilters.brandId ?? "");
  const [deviceType, setDeviceType] = useState(initialFilters.deviceType ?? "");
  const [technologyLevel, setTechnologyLevel] = useState(initialFilters.technologyLevel ?? "");
  const [q, setQ] = useState(initialFilters.q ?? "");
  const [models, setModels] = useState<ModelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (brandId) p.set("brandId", brandId);
    if (deviceType) p.set("deviceType", deviceType);
    if (technologyLevel) p.set("technologyLevel", technologyLevel);
    if (q) p.set("q", q);
    return p.toString();
  }, [brandId, deviceType, technologyLevel, q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/aid-catalogue?${query}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((j: { models: ModelCard[] }) => {
        if (!cancelled) setModels(j.models);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id],
    );
  }

  const compareModels = models.filter((m) => compareIds.includes(m.id));

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="cat-q" className={labelCls}>Search</label>
            <input
              id="cat-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Model, code, brand…"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="cat-brand" className={labelCls}>Brand</label>
            <select id="cat-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cat-type" className={labelCls}>Device type</label>
            <select id="cat-type" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className={inputCls}>
              <option value="">All types</option>
              {Object.entries(DEVICE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cat-level" className={labelCls}>Technology</label>
            <select id="cat-level" value={technologyLevel} onChange={(e) => setTechnologyLevel(e.target.value)} className={inputCls}>
              <option value="">All levels</option>
              <option value="PREMIUM">Premium</option>
              <option value="ADVANCED">Advanced</option>
              <option value="MID">Mid</option>
              <option value="ESSENTIAL">Essential</option>
            </select>
          </div>
        </div>
      </Card>

      {compareIds.length >= 2 ? (
        <Button variant="secondary" size="sm" onClick={() => setShowCompare((v) => !v)}>
          {showCompare ? "Hide" : "Show"} comparison ({compareIds.length})
        </Button>
      ) : (
        <p className="text-xs text-ink-400">Tick “Compare” on 2–3 models to compare them side by side.</p>
      )}

      {showCompare && compareModels.length >= 2 ? (
        <Card bare>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3">Attribute</th>
                  {compareModels.map((m) => (
                    <th key={m.id} className="px-4 py-3">{m.brandName} {m.modelName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Device type", (m: ModelCard) => DEVICE_LABELS[m.deviceType] ?? m.deviceType],
                    ["Technology", (m: ModelCard) => m.technologyLevel],
                    ["Price", (m: ModelCard) => (m.priceInr != null ? `₹${m.priceInr.toLocaleString("en-IN")}` : "—")],
                    ["Warranty", (m: ModelCard) => (m.warrantyMonths != null ? `${m.warrantyMonths} months` : "—")],
                    ["Features", (m: ModelCard) => m.features.map((f) => f.label).join(", ") || "—"],
                  ] as const
                ).map(([label, get]) => (
                  <tr key={label} className="border-b border-border/60 last:border-0 align-top">
                    <td className="px-4 py-3 font-semibold text-ink-700">{label}</td>
                    {compareModels.map((m) => (
                      <td key={m.id} className="px-4 py-3 text-ink-600">{get(m)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-3 text-xs text-ink-400">
            Factual differences only — no product is ranked “best”. Suitability is a
            professional judgement recorded in a recommendation.
          </p>
        </Card>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-ink-400">Loading catalogue…</p>
      ) : models.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            No models match these filters. Catalogue entries are managed in the admin portal.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{m.brandName}</p>
                  <h3 className="text-base font-semibold text-ink-900">{m.modelName}</h3>
                  <p className="font-mono text-xs text-ink-400">{m.modelCode}</p>
                </div>
                <Badge tone="brand">{DEVICE_LABELS[m.deviceType] ?? m.deviceType}</Badge>
              </div>
              {m.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-ink-500">{m.description}</p>
              ) : null}
              <p className="mt-2 text-sm text-ink-700">
                {m.priceInr != null ? `₹${m.priceInr.toLocaleString("en-IN")}` : "Price on request"}
                {m.warrantyMonths != null ? ` · ${m.warrantyMonths} mo warranty` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.features.slice(0, 4).map((f) => (
                  <Badge key={f.key} tone="neutral">{f.label}</Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-ink-600">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(m.id)}
                    onChange={() => toggleCompare(m.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Compare
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/portal/audiologist/hearing-aids/${m.id}`)}
                >
                  Details →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
