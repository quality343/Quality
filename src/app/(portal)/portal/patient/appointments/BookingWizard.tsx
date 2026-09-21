"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  bookAppointmentAction,
  type ActionResult,
} from "@/app/(portal)/portal/actions-scheduling";

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200";
const labelCls = "text-xs font-semibold text-ink-700";

type Slot = {
  id: string;
  startsAt: string;
  staffName: string | null;
};

async function fetchSlots(branchId: string, serviceId: string): Promise<Slot[]> {
  const res = await fetch(
    `/api/slots?branchId=${encodeURIComponent(branchId)}&serviceId=${encodeURIComponent(serviceId)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { slots: Slot[] };
  return json.slots;
}

export function BookingWizard({
  branches,
  services,
}: {
  branches: { id: string; name: string; city: string | null }[];
  services: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ appointmentId: string }> | null>(null);

  async function onBranchServiceChange(nextBranch: string, nextService: string) {
    setBranchId(nextBranch);
    setServiceId(nextService);
    setSlotId("");
    setSlots([]);
    if (nextBranch) {
      setLoadingSlots(true);
      const s = await fetchSlots(nextBranch, nextService);
      setSlots(s);
      setLoadingSlots(false);
    }
  }

  function onSubmit(formData: FormData) {
    setResult(null);
    // Controlled selects don't carry name attributes reliably through form
    // actions — submit from React state, which is the single source of truth.
    startTransition(async () => {
      const res = await bookAppointmentAction({
        slotId,
        serviceId,
        reason: String(formData.get("reason") ?? "") || undefined,
      });
      setResult(res);
      if (res.ok) {
        setSlotId("");
        setServiceId("");
        setBranchId("");
        setSlots([]);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Book an appointment</h2>
      <form action={onSubmit} className="mt-4 space-y-3" aria-label="Book appointment">
        <div>
          <label htmlFor="bk-branch" className={labelCls}>
            Branch
          </label>
          <select
            id="bk-branch"
            value={branchId}
            onChange={(e) => void onBranchServiceChange(e.target.value, serviceId)}
            className={inputCls}
            required
          >
            <option value="">Select a branch…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.city ? ` — ${b.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bk-service" className={labelCls}>
            Service
          </label>
          <select
            id="bk-service"
            value={serviceId}
            onChange={(e) => void onBranchServiceChange(branchId, e.target.value)}
            className={inputCls}
            required
          >
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {branchId ? (
          <div>
            <span className={labelCls}>Open slots</span>
            {loadingSlots ? (
              <p className="mt-2 text-sm text-ink-400">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-ink-400">
                No open slots right now — please check back soon.
              </p>
            ) : (
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
                {slots.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      slotId === s.id
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-border hover:border-brand-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="slotId"
                      value={s.id}
                      checked={slotId === s.id}
                      onChange={() => setSlotId(s.id)}
                      className="h-4 w-4"
                    />
                    <span>
                      {new Date(s.startsAt).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                      {s.staffName ? ` · ${s.staffName}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div>
          <label htmlFor="bk-reason" className={labelCls}>
            Reason (optional)
          </label>
          <input id="bk-reason" name="reason" maxLength={300} className={inputCls} />
        </div>

        {result && !result.ok ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {result.error}
          </p>
        ) : null}
        {result?.ok ? (
          <p role="status" className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            Appointment booked — see it in your list.
          </p>
        ) : null}

        <Button type="submit" disabled={pending || !slotId || !serviceId} className="w-full">
          {pending ? "Booking…" : "Confirm booking"}
        </Button>
      </form>
    </Card>
  );
}
