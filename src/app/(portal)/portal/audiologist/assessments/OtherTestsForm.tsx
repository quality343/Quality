"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { recordTestResultAction } from "@/app/(portal)/portal/actions-clinical";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

type TestKind = "SPEECH" | "TYMPANOMETRY" | "ABR" | "OAE" | "VESTIBULAR" | "TINNITUS" | "SPECIALIZED";

const LABELS: Record<TestKind, string> = {
  SPEECH: "Speech Audiometry (SRT / WRS / SAT)",
  TYMPANOMETRY: "Tympanometry",
  ABR: "ABR / BERA",
  OAE: "OAE",
  VESTIBULAR: "Vestibular assessment",
  TINNITUS: "Tinnitus evaluation",
  SPECIALIZED: "Specialized assessment",
};

const num = (v: FormDataEntryValue | null): number | undefined => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : Number(s);
};

export function OtherTestsForm({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<TestKind>("SPEECH");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    let payload: Record<string, unknown>;
    switch (kind) {
      case "SPEECH":
        payload = {
          srtRight: num(formData.get("srtRight")),
          srtLeft: num(formData.get("srtLeft")),
          wrsRight: num(formData.get("wrsRight")),
          wrsLeft: num(formData.get("wrsLeft")),
          notes: String(formData.get("notes") ?? "") || undefined,
        };
        break;
      case "TYMPANOMETRY":
        payload = {
          rightType: String(formData.get("rightType") ?? "") || undefined,
          leftType: String(formData.get("leftType") ?? "") || undefined,
          rightCompliance: num(formData.get("rightCompliance")),
          leftCompliance: num(formData.get("leftCompliance")),
          notes: String(formData.get("notes") ?? "") || undefined,
        };
        break;
      case "ABR":
        payload = {
          rightThreshold: num(formData.get("abrRight")),
          leftThreshold: num(formData.get("abrLeft")),
          notes: String(formData.get("notes") ?? "") || undefined,
        };
        break;
      case "OAE":
        payload = {
          rightPresent: formData.get("oaeRight") === "present",
          leftPresent: formData.get("oaeLeft") === "present",
          notes: String(formData.get("notes") ?? "") || undefined,
        };
        break;
      case "VESTIBULAR":
      case "SPECIALIZED":
        payload = { findings: String(formData.get("findings") ?? "") };
        break;
      case "TINNITUS":
        payload = {
          earSide: String(formData.get("tEar") ?? "") || undefined,
          pitchHz: num(formData.get("tPitch")),
          loudness: num(formData.get("tLoud")),
          notes: String(formData.get("notes") ?? "") || undefined,
        };
        break;
    }

    startTransition(async () => {
      const res = await recordTestResultAction({ testType: kind, assessmentId, payload });
      setMessage(
        res.ok
          ? { ok: true, text: `${LABELS[kind]} saved.` }
          : { ok: false, text: res.error },
      );
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Other tests</h2>
      <form action={onSubmit} className="mt-4 space-y-3" aria-label="Record other test">
        <div>
          <label htmlFor="ot-kind" className={labelCls}>
            Test
          </label>
          <select
            id="ot-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as TestKind)}
            className={inputCls}
          >
            {(Object.keys(LABELS) as TestKind[]).map((k) => (
              <option key={k} value={k}>
                {LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        {kind === "SPEECH" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="srt-r" className={labelCls}>SRT right (dB)</label>
              <input id="srt-r" name="srtRight" inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="srt-l" className={labelCls}>SRT left (dB)</label>
              <input id="srt-l" name="srtLeft" inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="wrs-r" className={labelCls}>WRS right (%)</label>
              <input id="wrs-r" name="wrsRight" inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="wrs-l" className={labelCls}>WRS left (%)</label>
              <input id="wrs-l" name="wrsLeft" inputMode="numeric" className={inputCls} />
            </div>
          </div>
        ) : null}

        {kind === "TYMPANOMETRY" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ty-r" className={labelCls}>Right type</label>
              <select id="ty-r" name="rightType" className={inputCls}>
                <option value="">—</option>
                <option>A</option><option>AS</option><option>AD</option><option>B</option><option>C</option>
              </select>
            </div>
            <div>
              <label htmlFor="ty-l" className={labelCls}>Left type</label>
              <select id="ty-l" name="leftType" className={inputCls}>
                <option value="">—</option>
                <option>A</option><option>AS</option><option>AD</option><option>B</option><option>C</option>
              </select>
            </div>
            <div>
              <label htmlFor="ty-cr" className={labelCls}>Right compliance</label>
              <input id="ty-cr" name="rightCompliance" inputMode="decimal" className={inputCls} />
            </div>
            <div>
              <label htmlFor="ty-cl" className={labelCls}>Left compliance</label>
              <input id="ty-cl" name="leftCompliance" inputMode="decimal" className={inputCls} />
            </div>
          </div>
        ) : null}

        {kind === "ABR" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="abr-r" className={labelCls}>Right threshold (dB)</label>
              <input id="abr-r" name="abrRight" inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="abr-l" className={labelCls}>Left threshold (dB)</label>
              <input id="abr-l" name="abrLeft" inputMode="numeric" className={inputCls} />
            </div>
          </div>
        ) : null}

        {kind === "OAE" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="oae-r" className={labelCls}>Right</label>
              <select id="oae-r" name="oaeRight" className={inputCls}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div>
              <label htmlFor="oae-l" className={labelCls}>Left</label>
              <select id="oae-l" name="oaeLeft" className={inputCls}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
        ) : null}

        {kind === "TINNITUS" ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="t-ear" className={labelCls}>Ear</label>
              <select id="t-ear" name="tEar" className={inputCls}>
                <option value="">—</option>
                <option value="RIGHT">Right</option>
                <option value="LEFT">Left</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label htmlFor="t-pitch" className={labelCls}>Pitch (Hz)</label>
              <input id="t-pitch" name="tPitch" inputMode="numeric" className={inputCls} />
            </div>
            <div>
              <label htmlFor="t-loud" className={labelCls}>Loudness</label>
              <input id="t-loud" name="tLoud" inputMode="numeric" className={inputCls} />
            </div>
          </div>
        ) : null}

        {kind === "VESTIBULAR" || kind === "SPECIALIZED" ? (
          <div>
            <label htmlFor="ot-findings" className={labelCls}>
              Findings (typed by the professional)
            </label>
            <textarea id="ot-findings" name="findings" rows={3} maxLength={2000} required className={inputCls} />
          </div>
        ) : null}

        {kind !== "VESTIBULAR" && kind !== "SPECIALIZED" ? (
          <div>
            <label htmlFor="ot-notes" className={labelCls}>Notes</label>
            <input id="ot-notes" name="notes" maxLength={500} className={inputCls} />
          </div>
        ) : null}

        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}
          >
            {message.text}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save test result"}
        </Button>
      </form>
    </Card>
  );
}
