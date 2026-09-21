"use client";

import { useState, useTransition } from "react";
import type { CancelResult } from "../../book-appointment/actions";

/**
 * Client cancel control with a confirm step. The server action re-validates
 * the token; a bad/expired token yields a friendly message, never a DB error.
 */
export function ManageBooking({
  ref_,
  token,
  cancelAction,
}: {
  ref_: string;
  token: string;
  cancelAction: (input: { ref: string; token: string }) => Promise<CancelResult>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  if (cancelled) {
    return (
      <p
        role="status"
        className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm font-medium text-brand-800"
      >
        Your appointment has been cancelled. The time slot has been released. If
        this was a mistake, please book again or call the clinic.
      </p>
    );
  }

  function doCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelAction({ ref: ref_, token });
      if (result.ok) {
        setCancelled(true);
      } else {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="mt-5">
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
          {error}
        </p>
      )}
      {confirming ? (
        <div className="rounded-lg border border-accent-200 bg-accent-50 p-4">
          <p className="text-sm font-medium text-accent-900">
            Cancel this appointment? This cannot be undone online.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={doCancel}
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent-600 px-4 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
            >
              {pending ? "Cancelling…" : "Yes, cancel it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-ink-800 hover:border-brand-300"
            >
              Keep appointment
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-accent-300 bg-white px-6 text-sm font-semibold text-accent-700 hover:bg-accent-50"
        >
          Cancel this appointment
        </button>
      )}
    </div>
  );
}
