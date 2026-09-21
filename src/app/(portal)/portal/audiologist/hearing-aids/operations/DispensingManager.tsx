"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createDispensingAction, transitionDispensingAction } from "../../../actions-hearingaid";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  PREPARED: "accent",
  DISPENSED: "brand",
  CANCELLED: "neutral",
  RETURNED: "neutral",
};

type DispRow = {
  id: string;
  patientName: string;
  device: string;
  status: string;
  dispensedAt: string | null;
  acknowledged: boolean;
};

export function DispensingManager({
  records,
  patients,
  devices,
}: {
  records: DispRow[];
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
        createDispensingAction({
          patientId: String(formData.get("patientId") ?? ""),
          inventoryItemId: String(formData.get("inventoryItemId") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        }),
      "Dispensing prepared — device reserved.",
    );
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">Prepare dispensing</h3>
        <p className="mt-1 text-xs text-ink-400">
          Preparing does not dispense. Dispensing is an explicit, audited hand-over.
        </p>
        <form action={onCreate} className="mt-2 space-y-2" aria-label="Prepare dispensing">
          <div>
            <label htmlFor="dsp-patient" className={labelCls}>Patient</label>
            <select id="dsp-patient" name="patientId" required className={inputCls}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dsp-device" className={labelCls}>Device</label>
            <select id="dsp-device" name="inventoryItemId" required className={inputCls}>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="dsp-notes" className={labelCls}>Notes</label>
            <input id="dsp-notes" name="notes" maxLength={400} className={inputCls} />
          </div>
          {message ? (
            <p role={message.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>
              {message.text}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || devices.length === 0} size="sm">
            {pending ? "Working…" : "Prepare"}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-900">Dispensing records</h3>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {records.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-400">No dispensing records.</li>
          ) : (
            records.slice(0, 10).map((d) => (
              <li key={d.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{d.patientName}</span>
                  <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
                  {d.acknowledged ? <Badge tone="brand">Acknowledged</Badge> : null}
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{d.device}</p>
                {d.status === "PREPARED" ? (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <MiniBtn disabled={pending} onClick={() => run(() => transitionDispensingAction({ dispensingId: d.id, status: "DISPENSED", acknowledge: true }), "Device dispensed to patient.")}>Dispense + acknowledge</MiniBtn>
                    <MiniBtn disabled={pending} onClick={() => run(() => transitionDispensingAction({ dispensingId: d.id, status: "CANCELLED" }), "Dispensing cancelled.")}>Cancel</MiniBtn>
                  </div>
                ) : null}
                {d.status === "DISPENSED" ? (
                  <div className="mt-1.5">
                    <MiniBtn disabled={pending} onClick={() => run(() => transitionDispensingAction({ dispensingId: d.id, status: "RETURNED" }), "Return recorded.")}>Record return</MiniBtn>
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
