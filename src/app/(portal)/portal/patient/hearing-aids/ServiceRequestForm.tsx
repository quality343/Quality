"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createServiceRequestAction } from "../../actions-hearingaid";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

export function ServiceRequestForm({ devices }: { devices: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await createServiceRequestAction({
        inventoryItemId: String(formData.get("inventoryItemId") ?? ""),
        issueDescription: String(formData.get("issueDescription") ?? ""),
        serviceType: String(formData.get("serviceType") ?? "REPAIR"),
      });
      setMessage(
        res.ok
          ? { ok: true, text: "Request submitted — our team will contact you." }
          : { ok: false, text: res.error },
      );
      if (res.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-ink-900">Request service</h3>
      {devices.length === 0 ? (
        <p className="mt-2 text-sm text-ink-400">
          Service requests open once a device is fitted to you.
        </p>
      ) : (
        <form action={onSubmit} className="mt-3 space-y-3" aria-label="Request service">
          <div>
            <label htmlFor="svc-device" className={labelCls}>Device</label>
            <select id="svc-device" name="inventoryItemId" required className={inputCls}>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="svc-type" className={labelCls}>Type</label>
            <select id="svc-type" name="serviceType" className={inputCls} defaultValue="REPAIR">
              <option value="REPAIR">Repair</option>
              <option value="CLEANING">Cleaning</option>
              <option value="PART_REPLACE">Part replacement</option>
              <option value="CHECKUP">Check-up</option>
            </select>
          </div>
          <div>
            <label htmlFor="svc-issue" className={labelCls}>Describe the issue *</label>
            <textarea id="svc-issue" name="issueDescription" rows={3} required minLength={10} maxLength={600} className={inputCls} />
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
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      )}
    </Card>
  );
}
