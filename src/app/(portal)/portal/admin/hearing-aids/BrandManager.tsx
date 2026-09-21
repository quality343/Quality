"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { brandUpsertAction } from "../../actions-catalogue";
import type { ActionResult } from "../../actions-scheduling";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

export function BrandManager() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await brandUpsertAction({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        website: String(formData.get("website") ?? ""),
        logoUrl: "",
        isActive: true,
      });
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-ink-900">Add brand</h3>
      <form action={onSubmit} className="mt-3 space-y-3" aria-label="Add brand">
        <div>
          <label htmlFor="brand-name" className={labelCls}>Name</label>
          <input id="brand-name" name="name" required maxLength={80} className={inputCls} />
        </div>
        <div>
          <label htmlFor="brand-website" className={labelCls}>Website (optional)</label>
          <input id="brand-website" name="website" type="url" className={inputCls} placeholder="https://…" />
        </div>
        <div>
          <label htmlFor="brand-desc" className={labelCls}>Description</label>
          <textarea id="brand-desc" name="description" rows={2} maxLength={600} className={inputCls} />
        </div>
        {result && !result.ok ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{result.error}</p>
        ) : null}
        {result?.ok ? (
          <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{result.message}</p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Create brand"}
        </Button>
      </form>
    </Card>
  );
}
