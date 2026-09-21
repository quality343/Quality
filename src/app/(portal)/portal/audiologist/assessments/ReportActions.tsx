"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateReportAction } from "../../actions-clinical";

export function ReportActions({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function generate(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await generateReportAction({
        assessmentId,
        title: String(formData.get("title") ?? "Hearing Assessment Report"),
        finalize: formData.get("finalize") === "on",
      });
      setMessage(
        res.ok
          ? { ok: true, text: res.message ?? "Report created." }
          : { ok: false, text: res.error },
      );
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Clinical report</h2>
      <p className="mt-1 text-xs text-ink-400">
        Snapshots the case history, recorded tests, and your review. Finalizing
        releases it to the patient&apos;s portal and locks the assessment.
      </p>
      <form action={generate} className="mt-4 space-y-3" aria-label="Generate report">
        <div>
          <label htmlFor="rep-title" className="text-xs font-semibold text-ink-700">
            Report title
          </label>
          <input
            id="rep-title"
            name="title"
            defaultValue="Hearing Assessment Report"
            maxLength={150}
            required
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="finalize" className="h-4 w-4 rounded border-border" />
          Finalize immediately (release to patient)
        </label>
        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}
          >
            {message.text}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Working…" : "Generate report"}
        </Button>
      </form>
    </Card>
  );
}
