"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { serviceUpsertAction } from "../../actions-org";
import type { ActionResult } from "../../actions-scheduling";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";

export function ServiceForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);

  function onSubmit(formData: FormData) {
    const raw = {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? ""),
      durationMinutes: String(formData.get("durationMinutes") ?? "30"),
      sortOrder: "0",
      isActive: true,
    };
    startTransition(async () => {
      const res = await serviceUpsertAction(raw);
      setResult(res);
      if (res.ok) router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="mt-4 space-y-3" aria-label="Create service">
      <div>
        <label htmlFor="svc-code" className="text-xs font-semibold text-ink-700">
          Code
        </label>
        <input id="svc-code" name="code" required maxLength={30} className={inputClass} placeholder="PTA-30" />
      </div>
      <div>
        <label htmlFor="svc-name" className="text-xs font-semibold text-ink-700">
          Name
        </label>
        <input id="svc-name" name="name" required maxLength={120} className={inputClass} placeholder="Pure Tone Audiometry" />
      </div>
      <div>
        <label htmlFor="svc-category" className="text-xs font-semibold text-ink-700">
          Category
        </label>
        <select id="svc-category" name="category" className={inputClass} defaultValue="HEARING_TEST">
          <option value="DIAGNOSTIC">Diagnostic</option>
          <option value="HEARING_TEST">Hearing test</option>
          <option value="HEARING_AID">Hearing aid</option>
          <option value="THERAPY">Therapy</option>
          <option value="COCHLEAR">Cochlear implant</option>
        </select>
      </div>
      <div>
        <label htmlFor="svc-duration" className="text-xs font-semibold text-ink-700">
          Duration (minutes)
        </label>
        <input
          id="svc-duration"
          name="durationMinutes"
          type="number"
          min={10}
          max={480}
          defaultValue={30}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="svc-description" className="text-xs font-semibold text-ink-700">
          Description
        </label>
        <textarea id="svc-description" name="description" rows={3} maxLength={1000} className={inputClass} />
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
        {pending ? "Saving…" : "Create service"}
      </Button>
    </form>
  );
}
