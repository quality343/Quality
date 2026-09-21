"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { modelUpsertAction } from "../../actions-catalogue";
import type { ActionResult } from "../../actions-scheduling";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

const FEATURES = [
  { key: "rechargeable", label: "Rechargeable" },
  { key: "bluetooth", label: "Bluetooth streaming" },
  { key: "smartphone-app", label: "Smartphone app" },
  { key: "noise-reduction", label: "Noise reduction" },
  { key: "directional-mic", label: "Directional microphones" },
  { key: "telecoil", label: "Telecoil" },
  { key: "water-resistance", label: "Water/dust resistance" },
];

export function ModelManager({ brands }: { brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const price = String(formData.get("priceInr") ?? "");
      const warranty = String(formData.get("warrantyMonths") ?? "");
      const res = await modelUpsertAction({
        brandId: String(formData.get("brandId") ?? ""),
        modelName: String(formData.get("modelName") ?? ""),
        modelCode: String(formData.get("modelCode") ?? ""),
        deviceType: String(formData.get("deviceType") ?? ""),
        technologyLevel: String(formData.get("technologyLevel") ?? ""),
        description: String(formData.get("description") ?? ""),
        priceInr: price ? Number(price) : undefined,
        warrantyMonths: warranty ? Number(warranty) : undefined,
        status: "ACTIVE",
        featureKeys: selected,
      });
      setResult(res);
      if (res.ok) {
        setSelected([]);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-ink-900">Add model</h3>
      {brands.length === 0 ? (
        <p className="mt-2 text-sm text-ink-400">Create a brand first.</p>
      ) : (
        <form action={onSubmit} className="mt-3 space-y-3" aria-label="Add model">
          <div>
            <label htmlFor="model-brand" className={labelCls}>Brand</label>
            <select id="model-brand" name="brandId" required className={inputCls}>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="model-name" className={labelCls}>Model name</label>
            <input id="model-name" name="modelName" required maxLength={80} className={inputCls} />
          </div>
          <div>
            <label htmlFor="model-code" className={labelCls}>Model code</label>
            <input id="model-code" name="modelCode" required maxLength={40} className={inputCls} placeholder="ABC-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="model-type" className={labelCls}>Device type</label>
              <select id="model-type" name="deviceType" className={inputCls} defaultValue="BTE">
                <option value="BTE">BTE</option>
                <option value="RIC">RIC</option>
                <option value="ITE">ITE</option>
                <option value="ITC">ITC</option>
                <option value="CIC">CIC</option>
                <option value="IIC">IIC</option>
              </select>
            </div>
            <div>
              <label htmlFor="model-level" className={labelCls}>Technology</label>
              <select id="model-level" name="technologyLevel" className={inputCls} defaultValue="MID">
                <option value="PREMIUM">Premium</option>
                <option value="ADVANCED">Advanced</option>
                <option value="MID">Mid</option>
                <option value="ESSENTIAL">Essential</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="model-price" className={labelCls}>Price ₹ (optional)</label>
              <input id="model-price" name="priceInr" inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="model-warranty" className={labelCls}>Warranty (months)</label>
              <input id="model-warranty" name="warrantyMonths" inputMode="numeric" className={inputCls} />
            </div>
          </div>
          <fieldset>
            <legend className={labelCls}>Features</legend>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {FEATURES.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(f.key)}
                    onChange={() => toggle(f.key)}
                    className="h-4 w-4 rounded border-border"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="model-desc" className={labelCls}>Description</label>
            <textarea id="model-desc" name="description" rows={2} maxLength={800} className={inputCls} />
          </div>
          {result && !result.ok ? (
            <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{result.error}</p>
          ) : null}
          {result?.ok ? (
            <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{result.message}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Create model"}
          </Button>
        </form>
      )}
    </Card>
  );
}
