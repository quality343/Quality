"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateSlotsAction } from "../../actions-scheduling";
import type { ActionResult } from "../../actions-scheduling";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelClass = "text-xs font-semibold text-ink-700";

export function SlotGenerator({
  branches,
  services,
}: {
  branches: { id: string; name: string }[];
  services: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ created: number }> | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(formData: FormData) {
    const raw = {
      branchId: String(formData.get("branchId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? "") || undefined,
      date: String(formData.get("date") ?? ""),
      startTime: String(formData.get("startTime") ?? ""),
      endTime: String(formData.get("endTime") ?? ""),
      slotMinutes: String(formData.get("slotMinutes") ?? "30"),
    };
    startTransition(async () => {
      const res = await generateSlotsAction(raw);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Generate slots</h2>
      <p className="mt-1 text-sm text-ink-500">
        Creates equal-length slots for a day. Existing slots are never overwritten.
      </p>
      <form action={onSubmit} className="mt-4 space-y-3" aria-label="Generate slots">
        <div>
          <label htmlFor="slot-branch" className={labelClass}>
            Branch
          </label>
          <select id="slot-branch" name="branchId" required className={inputClass}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="slot-service" className={labelClass}>
            Service (optional)
          </label>
          <select id="slot-service" name="serviceId" className={inputClass}>
            <option value="">Any service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="slot-date" className={labelClass}>
            Date
          </label>
          <input id="slot-date" name="date" type="date" required defaultValue={today} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="slot-start" className={labelClass}>
              From
            </label>
            <input id="slot-start" name="startTime" type="time" required defaultValue="09:00" className={inputClass} />
          </div>
          <div>
            <label htmlFor="slot-end" className={labelClass}>
              To
            </label>
            <input id="slot-end" name="endTime" type="time" required defaultValue="17:00" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="slot-minutes" className={labelClass}>
            Slot length (minutes)
          </label>
          <input
            id="slot-minutes"
            name="slotMinutes"
            type="number"
            min={10}
            max={240}
            defaultValue={30}
            className={inputClass}
          />
        </div>

        {result && !result.ok ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {result.error}
          </p>
        ) : null}
        {result?.ok ? (
          <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {result.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Generating…" : "Generate slots"}
        </Button>
      </form>
    </Card>
  );
}
