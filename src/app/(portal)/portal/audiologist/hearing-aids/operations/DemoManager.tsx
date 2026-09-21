"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { scheduleDemoAction, transitionDemoAction } from "../../../actions-hearingaid";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  SCHEDULED: "brand",
  ACTIVE: "brand",
  RETURNED: "neutral",
  CANCELLED: "neutral",
  OVERDUE: "accent",
};

type DemoRow = {
  id: string;
  patientName: string;
  device: string;
  status: string;
  expectedReturnAt: string;
  startedAt: string | null;
  actualReturnAt: string | null;
};

export function DemoManager({
  demos,
  patients,
  devices,
}: {
  demos: DemoRow[];
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

  function onSchedule(formData: FormData) {
    run(
      () =>
        scheduleDemoAction({
          patientId: String(formData.get("patientId") ?? ""),
          inventoryItemId: String(formData.get("inventoryItemId") ?? ""),
          expectedReturnAt: String(formData.get("expectedReturnAt") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        }),
      "Demo scheduled — device held for this patient only.",
    );
  }

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">Schedule a demo</h3>
        <form
          action={onSchedule}
          className="mt-2 space-y-2"
          aria-label="Schedule demo"
          onSubmit={() => undefined}
        >
          <div>
            <label htmlFor="demo-patient" className={labelCls}>Patient</label>
            <select id="demo-patient" name="patientId" required className={inputCls}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="demo-device" className={labelCls}>Device (available units)</label>
            <select id="demo-device" name="inventoryItemId" required className={inputCls}>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="demo-return" className={labelCls}>Expected return</label>
            <input id="demo-return" name="expectedReturnAt" type="datetime-local" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="demo-notes" className={labelCls}>Notes</label>
            <input id="demo-notes" name="notes" maxLength={400} className={inputCls} />
          </div>
          {message ? (
            <p role={message.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>
              {message.text}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || devices.length === 0} size="sm">
            {pending ? "Working…" : "Schedule demo"}
          </Button>
        </form>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink-900">Demo history</h3>
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
          {demos.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-400">No demos yet.</li>
          ) : (
            demos.slice(0, 12).map((d) => (
              <li key={d.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{d.patientName}</span>
                  <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{d.device}</p>
                <p className="text-xs text-ink-400">
                  Expected return {new Date(d.expectedReturnAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
                {d.status === "SCHEDULED" ? (
                  <div className="mt-1.5 flex gap-2">
                    <MiniBtn disabled={pending} onClick={() => run(() => transitionDemoAction({ demoId: d.id, status: "ACTIVE" }), "Demo started.")}>Start</MiniBtn>
                    <MiniBtn disabled={pending} onClick={() => run(() => transitionDemoAction({ demoId: d.id, status: "CANCELLED" }), "Demo cancelled.")}>Cancel</MiniBtn>
                  </div>
                ) : null}
                {d.status === "ACTIVE" || d.status === "OVERDUE" ? (
                  <div className="mt-1.5">
                    <MiniBtn disabled={pending} onClick={() => run(() => transitionDemoAction({ demoId: d.id, status: "RETURNED" }), "Return recorded — device available again.")}>Record return</MiniBtn>
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
