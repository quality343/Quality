"use client";

/**
 * Guest booking wizard — appointment-type aware (clinic visit / home
 * consultation). Clinic path: branch → service → date → slot → details →
 * review → done. Home path: service → date + time-window → details with home
 * address → review → done. Availability always comes from the server; the
 * client never decides what is bookable. Mobile-first, accessible, no
 * invented promises (no 24/7 claims, no radius claims).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { submitGuestBooking } from "./actions";
import type { BranchOption, ServiceOption } from "./data";

type ApptType = "CLINIC_VISIT" | "HOME_CONSULTATION";
type Slot = { id: string; startsAt: string; endsAt: string; staffName: string | null };

const CLINIC_STEPS = ["Type", "Branch", "Service", "Date", "Time", "Your details", "Review"] as const;
const HOME_STEPS = ["Type", "Service", "Date", "Your details", "Review"] as const;

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function istDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i += 1) {
    out.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }
  return out;
}

const TIME_WINDOWS = [
  { value: "MORNING", label: "Morning (9 am – 12 pm)" },
  { value: "AFTERNOON", label: "Afternoon (12 – 4 pm)" },
  { value: "EVENING", label: "Evening (4 – 7 pm)" },
] as const;

export function BookingWizard({
  branches,
  initialType,
  initialBranchId,
  initialServiceId,
  homeEnabled,
}: {
  branches: BranchOption[];
  initialType: ApptType | null;
  initialBranchId: string | null;
  initialServiceId: string | null;
  homeEnabled: boolean;
}) {
  const [type, setType] = useState<ApptType | null>(initialType);
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [branchId, setBranchId] = useState<string | null>(initialBranchId);
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<Slot | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [days, setDays] = useState<{ key: string; label: string; count: number }[]>([]);
  const [homeDate, setHomeDate] = useState("");
  const [homeWindow, setHomeWindow] = useState<string>("MORNING");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [homeLocality, setHomeLocality] = useState("");
  const [homeInstructions, setHomeInstructions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ ref: string; token: string } | null>(null);

  const headingId = useId();
  const liveRef = useRef<HTMLParagraphElement>(null);

  const isHome = type === "HOME_CONSULTATION";
  const steps = isHome ? HOME_STEPS : CLINIC_STEPS;

  const branch = branches.find((b) => b.id === branchId) ?? null;
  const service = services.find((s) => s.id === serviceId) ?? null;
  const slot = pickedSlot;

  // Load services whenever the branch changes (clinic path only).
  useEffect(() => {
    if (isHome || !branchId) return;
    let cancelled = false;
    setServicesLoading(true);
    setServiceId(null);
    fetch(`/api/branch-services?branchId=${encodeURIComponent(branchId)}`)
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((j: { services?: ServiceOption[] }) => {
        if (!cancelled) setServices(j.services ?? []);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, isHome]);

  // Home path: load services from the (single) home-enabled branch.
  useEffect(() => {
    if (!isHome) return;
    const homeBranch = branches.find((b) => b.homeConsultationsEnabled);
    if (!homeBranch) return;
    let cancelled = false;
    setServicesLoading(true);
    fetch(`/api/branch-services?branchId=${encodeURIComponent(homeBranch.id)}`)
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((j: { services?: ServiceOption[] }) => {
        if (!cancelled) setServices(j.services ?? []);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isHome, branches]);

  const refreshDays = useCallback(async () => {
    if (!branchId || isHome) return;
    setSlotsLoading(true);
    try {
      const res = await fetch(
        `/api/slots?branchId=${encodeURIComponent(branchId)}${
          serviceId ? `&serviceId=${encodeURIComponent(serviceId)}` : ""
        }`,
      );
      const j = (await res.json()) as { slots?: Slot[] };
      const all = j.slots ?? [];
      const byDay = new Map<string, number>();
      for (const s of all) {
        const k = istDayKey(s.startsAt);
        byDay.set(k, (byDay.get(k) ?? 0) + 1);
      }
      const horizon = nextDays(14).map((d) => {
        const key = dayKey(d);
        return {
          key,
          label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
          count: byDay.get(key) ?? 0,
        };
      });
      setDays(horizon.filter((d) => d.count > 0));
      setSlots(all);
    } catch {
      setDays([]);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [branchId, serviceId, isHome]);

  useEffect(() => {
    if (type === "CLINIC_VISIT" && step >= 3 && branchId) void refreshDays();
  }, [step, branchId, refreshDays, type]);

  const slotsForDay = useMemo(() => {
    if (!slots || !day) return [];
    return slots.filter((s) => istDayKey(s.startsAt) === day);
  }, [slots, day]);

  const daySlotsLabel = useMemo(() => {
    if (!day) return "";
    const d = new Date(`${day}T00:00:00`);
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  }, [day]);

  async function confirm() {
    if (submitting) return;
    if (type === "CLINIC_VISIT" && (!branchId || !serviceId || !slotId)) return;
    if (type === "HOME_CONSULTATION" && !serviceId) return;
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload =
        type === "HOME_CONSULTATION"
          ? {
              appointmentType: "HOME_CONSULTATION" as const,
              serviceId,
              date: homeDate,
              timePreference: homeWindow,
              name,
              mobile,
              email,
              homeAddress,
              homeLocality,
              homeInstructions,
              note,
              idempotencyKey: crypto.randomUUID(),
            }
          : {
              appointmentType: "CLINIC_VISIT" as const,
              slotId,
              serviceId,
              name,
              mobile,
              email,
              note,
              idempotencyKey: crypto.randomUUID(),
            };
      const result = await submitGuestBooking(payload);
      if (result.ok) {
        setDone({ ref: result.ref, token: result.manageToken ?? "" });
        setStep(steps.length); // done screen
        liveRef.current?.focus();
      } else {
        setFormError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setStep(0);
    setType(null);
    setBranchId(null);
    setServiceId(null);
    setServices([]);
    setSlots(null);
    setSlotId(null);
    setPickedSlot(null);
    setDay(null);
    setDays([]);
    setHomeDate("");
    setHomeWindow("MORNING");
    setName("");
    setMobile("");
    setEmail("");
    setNote("");
    setHomeAddress("");
    setHomeLocality("");
    setHomeInstructions("");
    setDone(null);
    setFormError(null);
    setFieldErrors({});
  }

  function goTo(next: number) {
    setStep(Math.max(0, Math.min(steps.length - 1, next)));
  }

  const inputCls =
    "mt-1.5 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-600";

  function fieldError(key: string, id: string) {
    return fieldErrors[key] ? (
      <p id={id} role="alert" className="mt-1 text-sm text-accent-700">
        {fieldErrors[key]}
      </p>
    ) : null;
  }

  // ── Done: confirmation ──────────────────────────────────────────────────────
  if (done) {
    const manageHref = `/booking/${done.ref}?token=${encodeURIComponent(done.token)}`;
    return (
      <section aria-labelledby={headingId} className="mx-auto max-w-xl text-center">
        <div className="animate-fade-up mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-float ring-8 ring-brand-50">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 id={headingId} className="headline mt-5 text-2xl text-ink-900">
          Appointment confirmed
        </h2>
        <p className="mt-2 text-ink-600">
          Thank you for choosing QUALITY Hearing Care.
        </p>
        <dl className="mt-7 divide-y divide-border rounded-2xl border border-border bg-surface p-5 text-left text-sm shadow-card sm:p-6">
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Appointment number</dt>
            <dd className="font-mono font-semibold text-ink-900">{done.ref}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Appointment type</dt>
            <dd className="font-medium text-ink-900">
              {isHome ? "Home Consultation" : "Clinic Visit"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Service</dt>
            <dd className="text-ink-900">{service?.name}</dd>
          </div>
          {isHome ? (
            <>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Preferred date</dt>
                <dd className="text-ink-900">
                  {homeDate
                    ? new Date(`${homeDate}T00:00:00`).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Preferred time</dt>
                <dd className="text-ink-900">
                  {TIME_WINDOWS.find((w) => w.value === homeWindow)?.label.split(" (")[0]}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Visiting address</dt>
                <dd className="text-right text-ink-900">
                  {homeLocality}
                  <span className="block text-xs text-ink-400">
                    shown only to our team
                  </span>
                </dd>
              </div>
              <div className="rounded-lg bg-brand-50/70 p-3 text-xs leading-relaxed text-ink-600">
                Status: <strong>Requires clinic confirmation</strong> — our team will
                contact you on {mobile} to confirm the exact visit time. We&apos;ll reach
                out if any additional confirmation is required.
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Branch</dt>
                <dd className="text-right text-ink-900">{branch?.name}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Date</dt>
                <dd className="text-ink-900">{slot ? dateLabel(slot.startsAt) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-ink-500">Time</dt>
                <dd className="text-ink-900">{slot ? `${timeLabel(slot.startsAt)} (IST)` : "—"}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Name</dt>
            <dd className="text-ink-900">{name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Mobile</dt>
            <dd className="text-ink-900">{mobile}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-ink-500">Status</dt>
            <dd>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {isHome ? "Pending confirmation" : "Booked"}
              </span>
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-500">
          Save your appointment number. You can view or cancel this booking with the
          private link below — it is shown only once, so bookmark it if you need it later.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={manageHref}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800"
          >
            View / manage this booking
          </a>
          <button
            type="button"
            onClick={restart}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 font-semibold text-ink-800 hover:border-brand-300 hover:text-brand-700"
          >
            Book another appointment
          </button>
        </div>
        <p className="mt-5 text-sm">
          <Link href="/" className="text-brand-700 underline hover:text-brand-800">
            Return home
          </Link>
        </p>
      </section>
    );
  }

  const current = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress — pill rail; labels stay visible so colour is not the only cue. */}
      <nav aria-label="Booking progress" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={i === step ? "step" : undefined}
                className={
                  i < step
                    ? "inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700"
                    : i === step
                      ? "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-700 to-brand-800 px-2.5 py-1 font-semibold text-white shadow-card"
                      : "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-ink-400"
                }
              >
                {i < step ? "✓" : i + 1} {label}
              </span>
              {i < steps.length - 1 && <span aria-hidden="true" className="text-ink-300">→</span>}
            </li>
          ))}
        </ol>
      </nav>

      <p ref={liveRef} role="status" aria-live="polite" className="sr-only">
        Step {step + 1} of {steps.length}: {current}
      </p>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        {/* Step 1 — Appointment type */}
        {step === 0 && (
          <section aria-labelledby={`${headingId}-t`}>
            <h2 id={`${headingId}-t`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              How would you like to be seen?
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setType("CLINIC_VISIT");
                    goTo(1);
                  }}
                  className="card-lift w-full rounded-2xl border border-border bg-white p-5 text-left shadow-card hover:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <span className="block font-semibold text-ink-900">Clinic visit</span>
                  <span className="mt-0.5 block text-sm text-ink-500">
                    Meet our team at the clinic. Choose a branch, service and time.
                  </span>
                </button>
              </li>
              {homeEnabled && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setType("HOME_CONSULTATION");
                      goTo(1);
                    }}
                    className="card-lift w-full rounded-2xl border border-border bg-white p-5 text-left shadow-card hover:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    <span className="block font-semibold text-ink-900">Home consultation</span>
                    <span className="mt-0.5 block text-sm text-ink-500">
                      Prefer care at home? Request a visit and our team will coordinate a
                      suitable time with you.
                    </span>
                  </button>
                </li>
              )}
            </ul>
            <p className="mt-4 text-xs text-ink-400">
              Home consultation requests are confirmed by our team — we&apos;ll call you to
              arrange the exact time.
            </p>
          </section>
        )}

        {/* Clinic — Branch */}
        {step === 1 && type === "CLINIC_VISIT" && (
          <section aria-labelledby={`${headingId}-b`}>
            <h2 id={`${headingId}-b`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              Choose your branch
            </h2>
            <ul className="mt-4 space-y-3">
              {branches.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setBranchId(b.id);
                      goTo(2);
                    }}
                    className="card-lift w-full rounded-2xl border border-border bg-white p-5 text-left shadow-card hover:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    <span className="block font-semibold text-ink-900">{b.name}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">
                      {[b.city, b.address].filter(Boolean).join(" · ") || "—"}
                    </span>
                    {b.phone && (
                      <span className="mt-0.5 block text-sm text-ink-500">Phone: {b.phone}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => goTo(0)}
              className="mt-4 text-sm font-semibold text-brand-700 underline hover:text-brand-800"
            >
              ← Back
            </button>
          </section>
        )}

        {/* Service (clinic step 2 / home step 1) */}
        {((step === 2 && type === "CLINIC_VISIT") || (step === 1 && isHome)) && (
          <section aria-labelledby={`${headingId}-s`}>
            <h2 id={`${headingId}-s`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              Choose a service
            </h2>
            {!isHome && <p className="mt-1 text-sm text-ink-500">at {branch?.name}</p>}
            {servicesLoading ? (
              <p className="mt-4 text-sm text-ink-500" role="status">Loading services…</p>
            ) : services.length === 0 ? (
              <p className="mt-4 text-sm text-ink-600">
                No services are currently bookable. Please call the clinic.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {services.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        goTo(step + 1);
                      }}
                      className="card-lift w-full rounded-2xl border border-border bg-white p-5 text-left shadow-card hover:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink-900">{s.name}</span>
                        {!isHome && (
                          <span className="whitespace-nowrap text-xs text-ink-500">
                            {s.durationMinutes} min
                          </span>
                        )}
                      </span>
                      {s.description && (
                        <span className="mt-1 block line-clamp-2 text-sm text-ink-500">
                          {s.description}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => goTo(isHome ? 0 : 1)}
              className="mt-4 text-sm font-semibold text-brand-700 underline hover:text-brand-800"
            >
              ← Back
            </button>
          </section>
        )}

        {/* Clinic — Date */}
        {step === 3 && type === "CLINIC_VISIT" && (
          <section aria-labelledby={`${headingId}-d`}>
            <h2 id={`${headingId}-d`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              Pick a date
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Showing the next two weeks with open slots at {branch?.name}.
            </p>
            {slotsLoading ? (
              <p className="mt-4 text-sm text-ink-500" role="status">Checking availability…</p>
            ) : days.length === 0 ? (
              <p className="mt-4 text-sm text-ink-600">
                No open slots in the next two weeks. Please call the clinic to book.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {days.map((d) => (
                  <li key={d.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setDay(d.key);
                        setSlotId(null);
                        setPickedSlot(null);
                        goTo(4);
                      }}
                      aria-label={`${d.label}, ${d.count} slots available`}
                      className="card-lift w-full rounded-xl border border-border bg-white p-3 text-center shadow-card hover:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                    >
                      <span className="block text-sm font-semibold text-ink-900">{d.label}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {d.count} slot{d.count === 1 ? "" : "s"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => goTo(2)}
              className="mt-4 text-sm font-semibold text-brand-700 underline hover:text-brand-800"
            >
              ← Change service
            </button>
          </section>
        )}

        {/* Clinic — Slot */}
        {step === 4 && type === "CLINIC_VISIT" && (
          <section aria-labelledby={`${headingId}-sl`}>
            <h2 id={`${headingId}-sl`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              Pick a time
            </h2>
            <p className="mt-1 text-sm text-ink-500">{daySlotsLabel} · times shown in IST</p>
            {slotsForDay.length === 0 ? (
              <p className="mt-4 text-sm text-ink-600">
                No slots left that day. Please pick another date.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slotsForDay.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={slotId === s.id}
                      onClick={() => {
                        setSlotId(s.id);
                        setPickedSlot(s);
                        goTo(5);
                      }}
                      className={`w-full rounded-xl border p-3 text-center font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
                        slotId === s.id
                          ? "border-brand-700 bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-card"
                          : "border-border bg-white text-ink-900 hover:border-brand-400 hover:shadow-card"
                      }`}
                    >
                      {timeLabel(s.startsAt)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-400">
              Selecting a time does not hold it — the slot is confirmed only after you
              complete the booking.
            </p>
            <button
              type="button"
              onClick={() => goTo(3)}
              className="mt-4 text-sm font-semibold text-brand-700 underline hover:text-brand-800"
            >
              ← Change date
            </button>
          </section>
        )}

        {/* Home — Date + window */}
        {step === 2 && isHome && (
          <section aria-labelledby={`${headingId}-hd`}>
            <h2 id={`${headingId}-hd`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              When suits you?
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Choose a preferred date and part of the day — we&apos;ll confirm the exact
              time with you.
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (homeDate) goTo(3);
              }}
            >
              <div>
                <label htmlFor={`${headingId}-hdate`} className="block text-sm font-semibold text-ink-800">
                  Preferred date <span aria-hidden="true" className="text-accent-600">*</span>
                </label>
                <input
                  id={`${headingId}-hdate`}
                  type="date"
                  required
                  min={dayKey(new Date())}
                  value={homeDate}
                  onChange={(e) => setHomeDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-ink-800">
                  Preferred time of day
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {TIME_WINDOWS.map((w) => (
                    <label
                      key={w.value}
                      className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                        homeWindow === w.value
                          ? "border-brand-600 bg-brand-50 text-brand-800"
                          : "border-border bg-white text-ink-700 hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="homeWindow"
                        value={w.value}
                        checked={homeWindow === w.value}
                        onChange={() => setHomeWindow(w.value)}
                        className="sr-only"
                      />
                      {w.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={!homeDate}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 font-semibold text-ink-800 hover:border-brand-300 hover:text-brand-700"
                >
                  ← Back
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Details (clinic step 5 / home step 3) */}
        {((step === 5 && type === "CLINIC_VISIT") || (step === 3 && isHome)) && (
          <section aria-labelledby={`${headingId}-v`}>
            <h2 id={`${headingId}-v`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              Your details
            </h2>
            {isHome && (
              <p className="mt-1 text-sm text-ink-500">
                Your address is used only to plan the visit — it is never shown publicly.
              </p>
            )}
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                goTo(step + 1);
              }}
            >
              <div>
                <label htmlFor={`${headingId}-name`} className="block text-sm font-semibold text-ink-800">
                  Full name <span aria-hidden="true" className="text-accent-600">*</span>
                </label>
                <input
                  id={`${headingId}-name`}
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  aria-describedby={fieldErrors.name ? `${headingId}-name-err` : undefined}
                  aria-invalid={fieldErrors.name ? true : undefined}
                />
                {fieldError("name", `${headingId}-name-err`)}
              </div>
              <div>
                <label htmlFor={`${headingId}-mobile`} className="block text-sm font-semibold text-ink-800">
                  Mobile number <span aria-hidden="true" className="text-accent-600">*</span>
                </label>
                <input
                  id={`${headingId}-mobile`}
                  name="mobile"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className={inputCls}
                  aria-describedby={fieldErrors.mobile ? `${headingId}-mobile-err` : undefined}
                  aria-invalid={fieldErrors.mobile ? true : undefined}
                />
                {fieldError("mobile", `${headingId}-mobile-err`)}
              </div>
              <div>
                <label htmlFor={`${headingId}-email`} className="block text-sm font-semibold text-ink-800">
                  Email <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id={`${headingId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  aria-describedby={fieldErrors.email ? `${headingId}-email-err` : undefined}
                  aria-invalid={fieldErrors.email ? true : undefined}
                />
                {fieldError("email", `${headingId}-email-err`)}
              </div>
              {isHome && (
                <>
                  <div>
                    <label htmlFor={`${headingId}-addr`} className="block text-sm font-semibold text-ink-800">
                      Home address <span aria-hidden="true" className="text-accent-600">*</span>
                    </label>
                    <textarea
                      id={`${headingId}-addr`}
                      name="homeAddress"
                      rows={3}
                      required
                      autoComplete="street-address"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      className={`${inputCls} py-2`}
                      aria-describedby={fieldErrors.homeAddress ? `${headingId}-addr-err` : undefined}
                      aria-invalid={fieldErrors.homeAddress ? true : undefined}
                    />
                    {fieldError("homeAddress", `${headingId}-addr-err`)}
                  </div>
                  <div>
                    <label htmlFor={`${headingId}-locality`} className="block text-sm font-semibold text-ink-800">
                      Area / locality <span aria-hidden="true" className="text-accent-600">*</span>
                    </label>
                    <input
                      id={`${headingId}-locality`}
                      name="homeLocality"
                      type="text"
                      required
                      placeholder="e.g. KPHB Phase 1, Kukatpally"
                      value={homeLocality}
                      onChange={(e) => setHomeLocality(e.target.value)}
                      className={inputCls}
                      aria-describedby={fieldErrors.homeLocality ? `${headingId}-locality-err` : undefined}
                      aria-invalid={fieldErrors.homeLocality ? true : undefined}
                    />
                    {fieldError("homeLocality", `${headingId}-locality-err`)}
                  </div>
                  <div>
                    <label htmlFor={`${headingId}-instr`} className="block text-sm font-semibold text-ink-800">
                      Directions / instructions <span className="font-normal text-ink-400">(optional)</span>
                    </label>
                    <textarea
                      id={`${headingId}-instr`}
                      name="homeInstructions"
                      rows={2}
                      maxLength={300}
                      placeholder="Landmarks, floor, gate code…"
                      value={homeInstructions}
                      onChange={(e) => setHomeInstructions(e.target.value)}
                      className={`${inputCls} py-2`}
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor={`${headingId}-note`} className="block text-sm font-semibold text-ink-800">
                  Anything we should know? <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <textarea
                  id={`${headingId}-note`}
                  name="note"
                  rows={3}
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`${inputCls} py-2`}
                />
                <p className="mt-1 text-xs text-ink-400">Up to 300 characters.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800"
                >
                  Review booking
                </button>
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 font-semibold text-ink-800 hover:border-brand-300 hover:text-brand-700"
                >
                  ← Back
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Review (last step) */}
        {step === steps.length - 1 && (
          <section aria-labelledby={`${headingId}-r`}>
            <h2 id={`${headingId}-r`} className="font-display text-lg font-bold tracking-tight text-ink-900">
              Review your booking
            </h2>
            <dl className="mt-4 space-y-2 rounded-lg bg-brand-50/50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Type</dt>
                <dd className="text-right font-medium text-ink-900">
                  {isHome ? "Home Consultation" : "Clinic Visit"}
                </dd>
              </div>
              {!isHome && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Branch</dt>
                  <dd className="text-right font-medium text-ink-900">{branch?.name}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Service</dt>
                <dd className="text-right font-medium text-ink-900">{service?.name}</dd>
              </div>
              {isHome ? (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Preferred date</dt>
                    <dd className="text-right font-medium text-ink-900">{homeDate}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Preferred time</dt>
                    <dd className="text-right font-medium text-ink-900">
                      {TIME_WINDOWS.find((w) => w.value === homeWindow)?.label}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Address</dt>
                    <dd className="text-right font-medium text-ink-900">
                      {homeLocality}
                      <span className="block text-xs font-normal text-ink-400">
                        Full address shared privately with our team
                      </span>
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Date</dt>
                    <dd className="text-right font-medium text-ink-900">
                      {slot ? dateLabel(slot.startsAt) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500">Time</dt>
                    <dd className="text-right font-medium text-ink-900">
                      {slot ? `${timeLabel(slot.startsAt)} (IST)` : "—"}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Name</dt>
                <dd className="text-right font-medium text-ink-900">{name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Mobile</dt>
                <dd className="text-right font-medium text-ink-900">{mobile}</dd>
              </div>
              {email && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Email</dt>
                  <dd className="text-right font-medium text-ink-900">{email}</dd>
                </div>
              )}
              {note && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Note</dt>
                  <dd className="text-right font-medium text-ink-900">{note}</dd>
                </div>
              )}
            </dl>
            {isHome && (
              <p className="mt-3 rounded-lg border border-border bg-surface-muted p-3 text-xs leading-relaxed text-ink-600">
                Home consultation requests are confirmed by our team — we&apos;ll call you
                on {mobile} to arrange the exact visit time.
              </p>
            )}
            {formError && (
              <p role="alert" className="mt-4 rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
                {formError}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
              >
                {submitting ? "Confirming…" : isHome ? "Request home visit" : "Confirm appointment"}
              </button>
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 font-semibold text-ink-800 hover:border-brand-300 hover:text-brand-700"
              >
                ← Back
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
