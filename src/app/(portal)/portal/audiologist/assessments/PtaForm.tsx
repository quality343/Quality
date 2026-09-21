"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { recordTestResultAction } from "@/app/(portal)/portal/actions-clinical";

const FREQS = [250, 500, 1000, 2000, 4000, 8000] as const;

const inputCls =
  "w-full rounded-md border border-border px-2 py-1.5 text-center text-sm focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

type EarState = Record<string, string>;

export function PtaForm({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [airRight, setAirRight] = useState<EarState>({});
  const [airLeft, setAirLeft] = useState<EarState>({});
  const [boneRight, setBoneRight] = useState<EarState>({});
  const [boneLeft, setBoneLeft] = useState<EarState>({});

  function toPayload(ear: EarState): Record<string, number> {
    const out: Record<string, number> = {};
    for (const f of FREQS) {
      const v = ear[String(f)];
      if (v !== undefined && v !== "") out[`f${f}`] = Number(v);
    }
    return out;
  }

  function onSubmit(formData: FormData) {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const res = await recordTestResultAction({
        testType: "PTA",
        assessmentId,
        payload: {
          air: { right: toPayload(airRight), left: toPayload(airLeft) },
          bone: {
            right: toPayload(boneRight),
            left: toPayload(boneLeft),
          },
          maskingApplied: formData.get("masking") === "on",
          notes: String(formData.get("notes") ?? "") || undefined,
        },
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function earGrid(
    title: string,
    state: EarState,
    setter: (s: EarState) => void,
  ) {
    return (
      <div>
        <p className={labelCls}>{title}</p>
        <div className="mt-1 grid grid-cols-6 gap-1.5">
          {FREQS.map((f) => (
            <input
              key={f}
              inputMode="numeric"
              placeholder={String(f)}
              aria-label={`${title} ${f} Hz threshold`}
              value={state[String(f)] ?? ""}
              onChange={(e) =>
                setter({ ...state, [String(f)]: e.target.value.replace(/[^0-9-]/g, "") })
              }
              className={inputCls}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Pure Tone Audiometry</h2>
      <p className="mt-1 text-xs text-ink-400">
        Thresholds in dB HL (−10…120). Leave blank if not measured.
      </p>
      <form action={onSubmit} className="mt-4 space-y-4" aria-label="Record PTA">
        {earGrid("Air — Right ear (red)", airRight, setAirRight)}
        {earGrid("Air — Left ear (blue)", airLeft, setAirLeft)}
        {earGrid("Bone — Right ear", boneRight, setBoneRight)}
        {earGrid("Bone — Left ear", boneLeft, setBoneLeft)}

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="masking" className="h-4 w-4 rounded border-border" />
          Masking applied
        </label>
        <div>
          <label htmlFor="pta-notes" className={labelCls}>
            Test notes
          </label>
          <input id="pta-notes" name="notes" maxLength={500} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
        ) : null}
        {saved ? (
          <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            PTA saved — audiogram updated.
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save PTA + audiogram"}
        </Button>
      </form>
    </Card>
  );
}
