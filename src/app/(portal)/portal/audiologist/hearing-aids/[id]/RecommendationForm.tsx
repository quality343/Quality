"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createRecommendationAction } from "@/app/(portal)/portal/actions-hearingaid";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

export function RecommendationForm({
  modelId,
  modelLabel,
  patients,
}: {
  modelId: string;
  modelLabel: string;
  patients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const assessmentId = String(formData.get("assessmentId") ?? "");
      const res = await createRecommendationAction({
        patientId: String(formData.get("patientId") ?? ""),
        assessmentId: assessmentId || undefined,
        modelId,
        reason: String(formData.get("reason") ?? ""),
        listeningNeeds: String(formData.get("listeningNeeds") ?? ""),
        communicationPrefs: String(formData.get("communicationPrefs") ?? ""),
        handlingNotes: String(formData.get("handlingNotes") ?? ""),
        professionalConsiderations: String(formData.get("professionalConsiderations") ?? ""),
        followUpPlan: String(formData.get("followUpPlan") ?? ""),
      });
      setMessage(
        res.ok
          ? { ok: true, text: "Recommendation created as DRAFT — approve it from the hearing-aids page." }
          : { ok: false, text: res.error },
      );
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Prepare recommendation</h2>
      <p className="mt-1 text-xs text-ink-400">
        Your professional notes accompany <strong>{modelLabel}</strong>. Nothing is
        auto-generated; approval is an explicit clinician action.
      </p>
      <form action={onSubmit} className="mt-3 space-y-3" aria-label="Create recommendation">
        <div>
          <label htmlFor="rec-patient" className={labelCls}>Patient</label>
          <select id="rec-patient" name="patientId" required className={inputCls}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rec-assessment" className={labelCls}>Assessment ID (optional link)</label>
          <input id="rec-assessment" name="assessmentId" className={inputCls} placeholder="cuid…" />
        </div>
        <div>
          <label htmlFor="rec-reason" className={labelCls}>Reason for recommendation *</label>
          <textarea id="rec-reason" name="reason" rows={3} required minLength={10} maxLength={1000} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rec-listening" className={labelCls}>Patient listening needs</label>
          <textarea id="rec-listening" name="listeningNeeds" rows={2} maxLength={600} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rec-comm" className={labelCls}>Communication preferences</label>
          <input id="rec-comm" name="communicationPrefs" maxLength={600} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rec-handling" className={labelCls}>Device handling considerations</label>
          <input id="rec-handling" name="handlingNotes" maxLength={600} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rec-prof" className={labelCls}>Professional considerations</label>
          <input id="rec-prof" name="professionalConsiderations" maxLength={600} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rec-follow" className={labelCls}>Follow-up plan</label>
          <input id="rec-follow" name="followUpPlan" maxLength={400} className={inputCls} />
        </div>
        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}
          >
            {message.text}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Create recommendation (draft)"}
        </Button>
      </form>
    </Card>
  );
}
