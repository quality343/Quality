"use client";

import { useState, useTransition } from "react";
import { submitContactEnquiry } from "../book-appointment/actions";

const INTERESTS = [
  "Hearing Test",
  "Hearing Aids",
  "Home Consultation",
  "Repair / Service",
  "General Enquiry",
];

const inputCls =
  "mt-1.5 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-600";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await submitContactEnquiry({
        name: fd.get("name"),
        mobile: fd.get("mobile"),
        email: fd.get("email") ?? "",
        interest: fd.get("interest") || undefined,
        appointmentType: fd.get("appointmentType") || undefined,
        message: fd.get("message"),
      });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  }

  if (done) {
    return (
      <div role="status" className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-brand-800">Message received.</p>
        <p className="mt-1 text-sm text-brand-700">
          Thank you — our team will review your message and get back to you. If it
          is urgent, please call us directly.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-3 text-sm font-semibold text-brand-700 underline hover:text-brand-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-semibold text-ink-800">
            Name <span aria-hidden="true" className="text-accent-600">*</span>
          </label>
          <input id="cf-name" name="name" type="text" required autoComplete="name" className={inputCls}
            aria-invalid={fieldErrors.name ? true : undefined} aria-describedby={fieldErrors.name ? "cf-name-err" : undefined} />
          {fieldErrors.name && <p id="cf-name-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="cf-mobile" className="block text-sm font-semibold text-ink-800">
            Mobile <span aria-hidden="true" className="text-accent-600">*</span>
          </label>
          <input id="cf-mobile" name="mobile" type="tel" inputMode="tel" required autoComplete="tel" className={inputCls}
            aria-invalid={fieldErrors.mobile ? true : undefined} aria-describedby={fieldErrors.mobile ? "cf-mobile-err" : undefined} />
          {fieldErrors.mobile && <p id="cf-mobile-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.mobile}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className="block text-sm font-semibold text-ink-800">
            Email <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input id="cf-email" name="email" type="email" autoComplete="email" className={inputCls}
            aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={fieldErrors.email ? "cf-email-err" : undefined} />
          {fieldErrors.email && <p id="cf-email-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="cf-interest" className="block text-sm font-semibold text-ink-800">
            Interested in <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <select id="cf-interest" name="interest" className={inputCls} defaultValue="">
            <option value="">—</option>
            {INTERESTS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">This is about</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { value: "CLINIC_VISIT", label: "Clinic Visit" },
            { value: "HOME_CONSULTATION", label: "Home Consultation" },
            { value: "GENERAL", label: "General Enquiry" },
          ].map((opt, i) => (
            <label key={opt.value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink-700 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-800">
              <input type="radio" name="appointmentType" value={opt.value} defaultChecked={i === 2} className="accent-[var(--color-brand-600)]" />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="cf-message" className="block text-sm font-semibold text-ink-800">
          Message <span aria-hidden="true" className="text-accent-600">*</span>
        </label>
        <textarea id="cf-message" name="message" rows={4} required maxLength={2000}
          className={`${inputCls} py-2`}
          aria-invalid={fieldErrors.message ? true : undefined} aria-describedby={fieldErrors.message ? "cf-message-err" : undefined} />
        {fieldErrors.message && <p id="cf-message-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.message}</p>}
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-ink-400">
        Your details are used only to respond to your enquiry.
      </p>
    </form>
  );
}
