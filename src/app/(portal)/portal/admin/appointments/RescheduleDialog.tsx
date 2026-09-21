"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleAppointmentAction } from "../../actions-scheduling";

/**
 * Inline reschedule: pick a new date, load that day's open slots for the same
 * branch from the server, move the appointment. The server re-checks the slot
 * and releases/claims slots atomically — the client list is only a picker.
 */
export function RescheduleDialog({
  appointmentId,
  branchName,
  currentWhen,
  onClose,
}: {
  appointmentId: string;
  branchName: string;
  currentWhen: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ id: string; startsAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true);
    setSlots([]);
    setSlotId(null);
    fetch(`/api/staff-slots?date=${encodeURIComponent(date)}`, {
      headers: { "x-branch-hint": branchName },
    })
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((j: { slots?: { id: string; startsAt: string }[] }) => {
        if (!cancelled) setSlots(j.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, branchName]);

  function confirm() {
    if (!slotId) return;
    setError(null);
    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        appointmentId,
        newSlotId: slotId,
      });
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error ?? "Could not reschedule.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink-900">Reschedule appointment</h3>
        <p className="text-xs text-ink-500">Currently: {currentWhen} · {branchName}</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
        <div>
          <label htmlFor={`rs-date-${appointmentId}`} className="block text-xs font-semibold text-ink-600">
            New date
          </label>
          <input
            id={`rs-date-${appointmentId}`}
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 min-h-10 rounded-lg border border-border bg-white px-2 text-sm"
          />
        </div>
        <div>
          <span className="block text-xs font-semibold text-ink-600">New time</span>
          {loading ? (
            <p className="mt-2 text-sm text-ink-500" role="status">Loading slots…</p>
          ) : !date ? (
            <p className="mt-2 text-sm text-ink-400">Choose a date to see open slots.</p>
          ) : slots.length === 0 ? (
            <p className="mt-2 text-sm text-ink-600">No open slots at this branch that day.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Available times">
              {slots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={slotId === s.id}
                  onClick={() => setSlotId(s.id)}
                  className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    slotId === s.id
                      ? "border-brand-600 bg-brand-700 text-white"
                      : "border-border bg-white text-ink-800 hover:border-brand-400"
                  }`}
                >
                  {new Date(s.startsAt).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Kolkata",
                  })}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={!slotId || pending}
          className="inline-flex min-h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
        >
          {pending ? "Moving…" : "Confirm reschedule"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-ink-700 hover:border-brand-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
