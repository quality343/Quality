"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createFittingAction, updateFittingAction } from "../../../actions-hearingaid";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  PLANNED: "accent",
  IN_PROGRESS: "brand",
  COMPLETED: "brand",
  FOLLOW_UP_REQUIRED: "accent",
  CANCELLED: "neutral",
};

type FittingRow = {
  id: string;
  patientName: string;
  device: string;
  earSide: string;
  status: string;
  audiologist: string;
  followUpDate: string | null;
};

export function FittingManager({
  fittings,
  patients,
  devices,
}: {
  fittings: FittingRow[];
  patients: { id: string; label: string }[];
  devices: { id: string; label: string }[];
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
        createFittingAction({
          patientId: String(formData.get("patientId") ?? ""),
          inventoryItemId: String(formData.get("inventoryItemId") ?? ""),
          earSide: String(formData.get("earSide") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        }),
      "Fitting record created (PLANNED).",
    );
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">Create fitting record</h3>
        <p className="mt-1 text-xs text-ink-400">
          Ear side is recorded explicitly — RIGHT, LEFT, or BILATERAL. Never assumed.
        </p>
        <form action={onCreate} className="mt-2 space-y-2" aria-label="Create fitting">
          <div>
            <label htmlFor="fit-patient" className={labelCls}>Patient</label>
            <select id="fit-patient" name="patientId" required className={inputCls}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fit-device" className={labelCls}>Device</label>
            <select id="fit-device" name="inventoryItemId" required className={inputCls}>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fit-ear" className={labelCls}>Ear side</label>
            <select id="fit-ear" name="earSide" required className={inputCls} defaultValue="RIGHT">
              <option value="RIGHT">Right</option>
              <option value="LEFT">Left</option>
              <option value="BILATERAL">Bilateral</option>
            </select>
          </div>
          <div>
            <label htmlFor="fit-notes" className={labelCls}>Notes</label>
            <input id="fit-notes" name="notes" maxLength={400} className={inputCls} />
          </div>
          {message ? (
            <p role={message.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>
              {message.text}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || devices.length === 0} size="sm">
            {pending ? "Working…" : "Create fitting"}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-900">Fitting records</h3>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {fittings.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-400">No fittings yet.</li>
          ) : (
            fittings.slice(0, 10).map((f) => (
              <li key={f.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{f.patientName}</span>
                  <Badge tone="neutral">{f.earSide}</Badge>
                  <Badge tone={STATUS_TONE[f.status] ?? "neutral"}>{f.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{f.device} · by {f.audiologist}</p>
                {f.status === "PLANNED" ? (
                  <div className="mt-1.5 flex gap-2">
                    <MiniBtn disabled={pending} onClick={() => run(() => updateFittingAction({ fittingId: f.id, status: "IN_PROGRESS" }), "Fitting in progress.")}>Start</MiniBtn>
                    <MiniBtn disabled={pending} onClick={() => run(() => updateFittingAction({ fittingId: f.id, status: "CANCELLED" }), "Fitting cancelled.")}>Cancel</MiniBtn>
                  </div>
                ) : null}
                {f.status === "IN_PROGRESS" ? (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <MiniBtn disabled={pending} onClick={() => run(() => updateFittingAction({ fittingId: f.id, status: "COMPLETED" }), "Fitting completed — initial aftercare auto-scheduled.")}>Complete</MiniBtn>
                    <MiniBtn disabled={pending} onClick={() => run(() => updateFittingAction({ fittingId: f.id, status: "FOLLOW_UP_REQUIRED" }), "Marked for follow-up.")}>Needs follow-up</MiniBtn>
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
