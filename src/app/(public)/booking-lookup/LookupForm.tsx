"use client";

import { useState, useTransition } from "react";
import { lookupBooking, type LookupResult } from "../book-appointment/actions";

const STATUS_STYLES: Record<string, string> = {
  BOOKED: "bg-brand-50 text-brand-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-ink-100 text-ink-600",
  NO_SHOW: "bg-ink-100 text-ink-600",
  CHECKED_IN: "bg-brand-50 text-brand-700",
  IN_PROGRESS: "bg-brand-50 text-brand-700",
};

export function LookupForm() {
  const [ref, setRef] = useState("");
  const [mobile, setMobile] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<LookupResult, { ok: true }> | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const r = await lookupBooking({ ref, mobile });
      if (r.ok) setResult(r);
      else setError(r.error);
    });
  }

  const b = result?.booking;
  const when = b
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(b.startsAt))
    : "";
  const time = b
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }).format(new Date(b.startsAt))
    : "";

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <label htmlFor="lk-ref" className="block text-sm font-semibold text-ink-800">
            Appointment number
          </label>
          <input
            id="lk-ref"
            type="text"
            required
            placeholder="QHC-XXXXXXXX"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-white px-3 font-mono uppercase text-base text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-600"
          />
        </div>
        <div>
          <label htmlFor="lk-mobile" className="block text-sm font-semibold text-ink-800">
            Mobile number used for booking
          </label>
          <input
            id="lk-mobile"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-600"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "Looking up…" : "Find my booking"}
        </button>
      </form>

      {b && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5 text-sm" role="status">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold text-ink-900">{b.ref}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[b.status] ?? "bg-ink-100 text-ink-600"}`}
            >
              {b.status.replace("_", " ")}
            </span>
          </div>
          <dl className="mt-3 space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Patient</dt>
              <dd className="font-medium text-ink-900">{b.guestName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Service</dt>
              <dd className="text-right font-medium text-ink-900">{b.serviceName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Branch</dt>
              <dd className="text-right font-medium text-ink-900">{b.branchName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">When</dt>
              <dd className="text-right font-medium text-ink-900">
                {when} · {time} (IST)
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-500">
            To cancel, use the private manage link from your confirmation — it keeps
            your booking secure.
          </p>
        </div>
      )}
    </div>
  );
}
