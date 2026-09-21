"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inventoryItemUpsertAction } from "../../actions-catalogue";
import type { ActionResult } from "../../actions-scheduling";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

export function InventoryManager({
  models,
  branches,
}: {
  models: { id: string; label: string }[];
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const cost = String(formData.get("unitCostInr") ?? "");
      const res = await inventoryItemUpsertAction({
        modelId: String(formData.get("modelId") ?? ""),
        branchId: String(formData.get("branchId") ?? ""),
        serialNo: String(formData.get("serialNo") ?? ""),
        condition: String(formData.get("condition") ?? "NEW"),
        acquiredNote: String(formData.get("acquiredNote") ?? ""),
        unitCostInr: cost ? Number(cost) : undefined,
        notes: "",
      });
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-ink-900">Register device</h3>
      <p className="mt-1 text-xs text-ink-400">
        A physical, serial-numbered unit of a catalogue model. Unit cost is
        internal — never shown to patients.
      </p>
      <form action={onSubmit} className="mt-3 space-y-3" aria-label="Register device">
        <div>
          <label htmlFor="inv-model" className={labelCls}>Model</label>
          <select id="inv-model" name="modelId" required className={inputCls}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-branch" className={labelCls}>Branch</label>
          <select id="inv-branch" name="branchId" required className={inputCls}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inv-serial" className={labelCls}>Serial number</label>
          <input id="inv-serial" name="serialNo" required maxLength={60} className={inputCls} />
        </div>
        <div>
          <label htmlFor="inv-condition" className={labelCls}>Condition</label>
          <select id="inv-condition" name="condition" className={inputCls} defaultValue="NEW">
            <option value="NEW">New</option>
            <option value="REFURBISHED">Refurbished</option>
            <option value="USED">Used</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>
        <div>
          <label htmlFor="inv-cost" className={labelCls}>Unit cost ₹ (internal)</label>
          <input id="inv-cost" name="unitCostInr" inputMode="numeric" className={inputCls} />
        </div>
        <div>
          <label htmlFor="inv-acq" className={labelCls}>Acquisition note</label>
          <input id="inv-acq" name="acquiredNote" maxLength={200} className={inputCls} />
        </div>
        {result && !result.ok ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{result.error}</p>
        ) : null}
        {result?.ok ? (
          <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{result.message}</p>
        ) : null}
        <Button type="submit" disabled={pending || models.length === 0} className="w-full">
          {pending ? "Saving…" : "Register device"}
        </Button>
      </form>
    </Card>
  );
}
