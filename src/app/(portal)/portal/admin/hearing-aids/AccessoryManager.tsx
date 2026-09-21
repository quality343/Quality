"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { accessoryUpsertAction } from "../../actions-catalogue";
import type { ActionResult } from "../../actions-scheduling";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

const CATEGORIES = ["DOME", "RECEIVER", "EARMOULD", "CHARGER", "BATTERY", "CLEANING", "CONNECTIVITY", "OTHER"];

export function AccessoryManager({ models }: { models: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);
  const [compatible, setCompatible] = useState<string[]>([]);

  function toggle(id: string) {
    setCompatible((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const price = String(formData.get("priceInr") ?? "");
      const res = await accessoryUpsertAction({
        name: String(formData.get("name") ?? ""),
        category: String(formData.get("category") ?? "OTHER"),
        description: String(formData.get("description") ?? ""),
        priceInr: price ? Number(price) : undefined,
        isActive: true,
        compatibleModelIds: compatible,
      });
      setResult(res);
      if (res.ok) {
        setCompatible([]);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-ink-900">Add accessory</h3>
      <p className="mt-1 text-xs text-ink-400">
        Only tick models you have verified compatibility for.
      </p>
      <form action={onSubmit} className="mt-3 space-y-3" aria-label="Add accessory">
        <div>
          <label htmlFor="acc-name" className={labelCls}>Name</label>
          <input id="acc-name" name="name" required maxLength={80} className={inputCls} />
        </div>
        <div>
          <label htmlFor="acc-cat" className={labelCls}>Category</label>
          <select id="acc-cat" name="category" className={inputCls} defaultValue="DOME">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="acc-price" className={labelCls}>Price ₹ (optional)</label>
          <input id="acc-price" name="priceInr" inputMode="numeric" className={inputCls} />
        </div>
        <fieldset className="max-h-40 overflow-y-auto rounded-lg border border-border p-2">
          <legend className={labelCls}>Compatible models (verified only)</legend>
          {models.length === 0 ? (
            <p className="p-2 text-sm text-ink-400">No models yet.</p>
          ) : (
            models.map((m) => (
              <label key={m.id} className="flex items-center gap-2 px-1 py-0.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={compatible.includes(m.id)}
                  onChange={() => toggle(m.id)}
                  className="h-4 w-4 rounded border-border"
                />
                {m.label}
              </label>
            ))
          )}
        </fieldset>
        {result && !result.ok ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{result.error}</p>
        ) : null}
        {result?.ok ? (
          <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{result.message}</p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Create accessory"}
        </Button>
      </form>
    </Card>
  );
}
