"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeAppointmentStatusAction } from "../../actions-scheduling";
import { RescheduleDialog } from "./RescheduleDialog";

type Appt = {
  id: string;
  status: string;
  when: string;
  whenISO: string;
  patient: string;
  mrn: string;
  isGuest: boolean;
  mobile: string | null;
  email?: string | null;
  service: string;
  branch: string;
  provider: string;
  source: string;
  ref: string | null;
  appointmentType: string;
  homeLocality?: string | null;
  homeAddress?: string | null;
  homeInstructions?: string | null;
  homeConfirmationStatus?: string | null;
  reason?: string | null;
  createdAt?: string;
};

const NEXT_ACTIONS: Record<string, { status: string; label: string }[]> = {
  BOOKED: [
    { status: "CHECKED_IN", label: "Check in" },
    { status: "CANCELLED", label: "Cancel" },
    { status: "NO_SHOW", label: "No-show" },
  ],
  CHECKED_IN: [
    { status: "IN_PROGRESS", label: "Start" },
    { status: "COMPLETED", label: "Complete" },
  ],
  IN_PROGRESS: [{ status: "COMPLETED", label: "Complete" }],
};

const STATUS_TONE: Record<string, string> = {
  BOOKED: "bg-brand-50 text-brand-700",
  CHECKED_IN: "bg-brand-50 text-brand-700",
  IN_PROGRESS: "bg-brand-100 text-brand-800",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-accent-50 text-accent-700",
  NO_SHOW: "bg-accent-50 text-accent-700",
};

export function AppointmentsTable({ appointments }: { appointments: Appt[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Branch</th>
            <th className="px-4 py-3">Ref</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <AppointmentRow key={a.id} a={a} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppointmentRow({ a }: { a: Appt }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const actions = NEXT_ACTIONS[a.status] ?? [];

  function run(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await changeAppointmentStatusAction({
        appointmentId: a.id,
        status: next,
        cancelReason: next === "CANCELLED" ? "Cancelled by clinic staff" : undefined,
      });
      if (result.ok) router.refresh();
      else setError(result.error ?? "Action failed.");
    });
  }

  return (
    <>
      <tr className="border-b border-border/60 last:border-0">
        <td className="whitespace-nowrap px-4 py-3 text-ink-700">{a.when}</td>
        <td className="px-4 py-3">
          <span className="font-medium text-ink-900">{a.patient}</span>
          {a.isGuest && (
            <span className="ml-2 rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
              Guest
            </span>
          )}
          <span className="block font-mono text-xs text-ink-400">
            {a.mobile ?? a.mrn}
          </span>
        </td>
        <td className="px-4 py-3">
          {a.appointmentType === "HOME_CONSULTATION" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              🏠 Home
            </span>
          ) : (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-500">
              Clinic
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-ink-600">{a.service}</td>
        <td className="px-4 py-3 text-ink-600">{a.branch}</td>
        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-500">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title="Show details"
            aria-expanded={expanded}
            className="rounded font-mono underline decoration-dotted underline-offset-2 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            {a.ref ?? "—"}
          </button>
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[a.status] ?? "bg-ink-100 text-ink-600"}`}>
            {a.status.replace("_", " ")}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap justify-end gap-1.5">
            {actions.map((act) => (
              <button
                key={act.status}
                type="button"
                disabled={pending}
                onClick={() => run(act.status)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              >
                {act.label}
              </button>
            ))}
            {(a.status === "BOOKED" || a.status === "CHECKED_IN") && (
              <button
                type="button"
                onClick={() => setRescheduling(true)}
                className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-700"
              >
                Reschedule
              </button>
            )}
          </div>
          {error && <p role="alert" className="mt-1 text-right text-xs text-accent-700">{error}</p>}
        </td>
      </tr>
      {rescheduling && (
        <tr>
          <td colSpan={8} className="border-b border-border/60 bg-brand-50/30 p-4">
            <RescheduleDialog
              appointmentId={a.id}
              branchName={a.branch}
              currentWhen={a.when}
              onClose={() => setRescheduling(false)}
            />
          </td>
        </tr>
      )}
      {expanded && (
        <tr>
          <td colSpan={8} className="border-b border-border/60 bg-surface-muted/50 p-4">
            <dl className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 sm:justify-start">
                <dt className="text-ink-400">Email</dt>
                <dd className="text-ink-700">{a.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:justify-start">
                <dt className="text-ink-400">Created</dt>
                <dd className="text-ink-700">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }) : "—"}
                </dd>
              </div>
              {a.appointmentType === "HOME_CONSULTATION" ? (
                <>
                  <div className="flex justify-between gap-4 sm:justify-start">
                    <dt className="text-ink-400">Locality</dt>
                    <dd className="text-ink-700">{a.homeLocality ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:justify-start">
                    <dt className="text-ink-400">Confirmation</dt>
                    <dd>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.homeConfirmationStatus === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {(a.homeConfirmationStatus ?? "PENDING_CONFIRMATION").replace(/_/g, " ")}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-ink-400">Home address (staff-only)</dt>
                    <dd className="mt-0.5 whitespace-pre-line text-ink-700">{a.homeAddress ?? "—"}</dd>
                  </div>
                  {a.homeInstructions && (
                    <div className="sm:col-span-2">
                      <dt className="text-ink-400">Instructions</dt>
                      <dd className="mt-0.5 text-ink-700">{a.homeInstructions}</dd>
                    </div>
                  )}
                </>
              ) : (
                a.reason && (
                  <div className="sm:col-span-2">
                    <dt className="text-ink-400">Note</dt>
                    <dd className="mt-0.5 text-ink-700">{a.reason}</dd>
                  </div>
                )
              )}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
