"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { searchPatientsAction } from "@/app/(portal)/portal/actions-scheduling";
import { createAssessmentAction } from "@/app/(portal)/portal/actions-clinical";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelClass = "text-xs font-semibold text-ink-700";

type PatientHit = { id: string; name: string; mrn: string };

export function StartAssessmentForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [selected, setSelected] = useState<PatientHit | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function search() {
    if (query.trim().length < 2) return;
    startTransition(async () => {
      const res = await searchPatientsAction(query.trim());
      if (res.ok && res.data) setHits(res.data.patients);
    });
  }

  function onSubmit(formData: FormData) {
    if (!selected) {
      setError("Select a patient first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createAssessmentAction({
        patientId: selected.id,
        complaints: String(formData.get("complaints") ?? ""),
        history: String(formData.get("history") ?? ""),
        referredBy: String(formData.get("referredBy") ?? ""),
      });
      if (res.ok && res.data) {
        router.push(`/portal/audiologist/assessments/${res.data.assessmentId}`);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Start an assessment</h2>
      <p className="mt-1 text-sm text-ink-500">
        Find the patient, then record case history on the assessment page.
      </p>

      {!selected ? (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="Search by patient name…"
              aria-label="Search patients"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200"
            />
            <Button type="button" variant="secondary" size="sm" onClick={search} disabled={pending}>
              Search
            </Button>
          </div>
          <ul className="space-y-1">
            {hits.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="font-medium text-ink-900">{p.name}</span>
                  <span className="ml-2 font-mono text-xs text-ink-400">{p.mrn}</span>
                </button>
              </li>
            ))}
            {hits.length === 0 && query.length >= 2 && !pending ? (
              <li className="px-3 py-2 text-sm text-ink-400">No matching patients.</li>
            ) : null}
          </ul>
        </div>
      ) : (
        <form action={onSubmit} className="mt-4 space-y-3" aria-label="Create assessment">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            Patient: <strong>{selected.name}</strong> ({selected.mrn})
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ml-2 text-xs underline"
            >
              change
            </button>
          </p>
          <div>
            <label htmlFor="asmt-complaints" className={labelClass}>
              Chief complaints
            </label>
            <textarea id="asmt-complaints" name="complaints" rows={2} maxLength={1000} className={inputClass} />
          </div>
          <div>
            <label htmlFor="asmt-history" className={labelClass}>
              Relevant history
            </label>
            <textarea id="asmt-history" name="history" rows={2} maxLength={2000} className={inputClass} />
          </div>
          <div>
            <label htmlFor="asmt-ref" className={labelClass}>
              Referred by
            </label>
            <input id="asmt-ref" name="referredBy" maxLength={120} className={inputClass} />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create assessment"}
          </Button>
        </form>
      )}
    </Card>
  );
}
