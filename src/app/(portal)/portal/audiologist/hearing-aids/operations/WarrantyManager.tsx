"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { upsertWarrantyAction } from "../../../actions-hearingaid";

type Row = {
  id: string;
  patientName: string;
  device: string;
  provider: string;
  reference: string | null;
  startDate: string;
  endDate: string;
  status: string;
};

type Opt = { id: string; label: string };

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";

export function WarrantyManager({
  warranties,
  patients,
  devices,
}: {
  warranties: Row[];
  patients: Opt[];
  devices: Opt[];
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

  return (
    <div className="p-4">
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      {warranties.length > 0 ? (
        <ul className="divide-y divide-border">
          {warranties.map((w) => (
            <li key={w.id} className="flex flex-col gap-2 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{w.patientName}</span>
                  <Badge tone={w.status === "ACTIVE" ? "brand" : "neutral"}>{w.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{w.device}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {w.provider} · {new Date(w.startDate).toLocaleDateString()} →{" "}
                  {new Date(w.endDate).toLocaleDateString()}
                  {w.reference ? ` · ref ${w.reference}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-ink-400">
          No warranties recorded yet. Record one below after dispensing a device.
        </p>
      )}

      <h3 className="mb-2 mt-6 text-sm font-semibold text-ink-900">Record warranty</h3>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(
            () =>
              upsertWarrantyAction({
                patientId: String(fd.get("patientId") ?? ""),
                inventoryItemId: String(fd.get("inventoryItemId") ?? ""),
                provider: String(fd.get("provider") ?? ""),
                reference: String(fd.get("reference") ?? "") || undefined,
                startDate: String(fd.get("startDate") ?? ""),
                endDate: String(fd.get("endDate") ?? ""),
                coverageNotes: String(fd.get("coverageNotes") ?? "") || undefined,
                status: "ACTIVE",
              }),
            "Warranty saved.",
          );
        }}
      >
        <label className="block text-xs font-medium text-ink-700">
          Patient
          <select name="patientId" required className={inputCls}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-ink-700">
          Dispensed device
          <select name="inventoryItemId" required className={inputCls}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-ink-700">
          Warranty provider
          <input name="provider" required minLength={2} maxLength={120} className={inputCls} placeholder="e.g. Manufacturer standard cover" />
        </label>
        <label className="block text-xs font-medium text-ink-700">
          Reference (optional)
          <input name="reference" maxLength={60} className={inputCls} />
        </label>
        <label className="block text-xs font-medium text-ink-700">
          Start date
          <input type="date" name="startDate" required className={inputCls} />
        </label>
        <label className="block text-xs font-medium text-ink-700">
          End date
          <input type="date" name="endDate" required className={inputCls} />
        </label>
        <label className="block text-xs font-medium text-ink-700 sm:col-span-2">
          Coverage notes (optional)
          <input name="coverageNotes" maxLength={400} className={inputCls} placeholder="Only record verified coverage terms" />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save warranty"}
          </button>
        </div>
      </form>
    </div>
  );
}
