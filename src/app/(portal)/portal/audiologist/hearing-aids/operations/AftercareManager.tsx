"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createAftercareAction, updateAftercareAction } from "../../../actions-hearingaid";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

const REASONS = [
  ["INITIAL_FITTING_REVIEW", "Initial fitting review"],
  ["COMFORT_REVIEW", "Device comfort review"],
  ["LISTENING_REVIEW", "Listening experience review"],
  ["CLEANING_GUIDANCE", "Cleaning guidance"],
  ["BATTERY_CHARGING_GUIDANCE", "Battery / charging guidance"],
  ["DEVICE_MAINTENANCE", "Device maintenance"],
  ["OTHER", "Other"],
] as const;

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  PENDING: "accent",
  SCHEDULED: "brand",
  DONE: "neutral",
  CANCELLED: "neutral",
};

type AfterRow = {
  id: string;
  patientName: string;
  reason: string;
  status: string;
  dueDate: string;
  outcome: string | null;
};

export function AftercareManager({
  items,
  patients,
}: {
  items: AfterRow[];
  patients: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, okText: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? { ok: true, text: okText } : { ok: false, text: res.error ?? "Failed" });
      if (res.ok) router.refresh();
    });
  }

  function onCreate(formData: FormData) {
    run(
      () =>
        createAftercareAction({
          patientId: String(formData.get("patientId") ?? ""),
          reason: String(formData.get("reason") ?? "OTHER"),
          dueDate: String(formData.get("dueDate") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        }),
      "Aftercare follow-up scheduled.",
    );
  }

  const defaultDue = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">Schedule aftercare</h3>
        <form action={onCreate} className="mt-2 space-y-2" aria-label="Schedule aftercare">
          <div>
            <label htmlFor="ac-patient" className={labelCls}>Patient</label>
            <select id="ac-patient" name="patientId" required className={inputCls}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ac-reason" className={labelCls}>Reason</label>
            <select id="ac-reason" name="reason" required className={inputCls} defaultValue="COMFORT_REVIEW">
              {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ac-due" className={labelCls}>Due date</label>
            <input id="ac-due" name="dueDate" type="date" required defaultValue={defaultDue} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ac-notes" className={labelCls}>Notes</label>
            <input id="ac-notes" name="notes" maxLength={400} className={inputCls} />
          </div>
          {message ? (
            <p role={message.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>
              {message.text}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} size="sm">
            {pending ? "Working…" : "Schedule"}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-900">Follow-up queue</h3>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-400">No aftercare scheduled.</li>
          ) : (
            items.slice(0, 12).map((f) => (
              <li key={f.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{f.patientName}</span>
                  <Badge tone={STATUS_TONE[f.status] ?? "neutral"}>{f.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  {REASONS.find(([v]) => v === f.reason)?.[1] ?? f.reason} · due{" "}
                  {new Date(f.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
                {f.status !== "DONE" && f.status !== "CANCELLED" ? (
                  <div className="mt-1.5 flex gap-2">
                    <MiniBtn disabled={pending} onClick={() => run(() => updateAftercareAction({ followUpId: f.id, status: "DONE", outcome: "Reviewed by professional; outcome documented." }), "Marked done.")}>
                      Mark done
                    </MiniBtn>
                    <MiniBtn disabled={pending} onClick={() => run(() => updateAftercareAction({ followUpId: f.id, status: "CANCELLED" }), "Cancelled.")}>
                      Cancel
                    </MiniBtn>
                  </div>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function MiniBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
