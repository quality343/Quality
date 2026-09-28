"use client";

import { useState } from "react";
import { submitContactEnquiry } from "./actions";
import { WHATSAPP, contactFormMessage } from "@/lib/client-info";
import {
  CONTACT_APPOINTMENT_LABELS,
  CONTACT_APPOINTMENT_TYPES,
  checkContactEnquiry,
  type ContactAppointmentType,
} from "@/lib/validation/contact";

const INTERESTS = [
  "Hearing Test",
  "Hearing Aids",
  "Home Consultation",
  "Repair / Service",
  "General Enquiry",
];

const inputCls =
  "mt-1.5 min-h-12 w-full rounded-lg border border-border bg-white px-3 text-base text-ink-900 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-600";

type Draft = {
  name: string;
  mobile: string;
  email: string;
  interest: string;
  appointmentType: ContactAppointmentType;
  message: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  mobile: "",
  email: "",
  interest: "",
  appointmentType: "GENERAL",
  message: "",
};

/**
 * The contact form. It never sends a WhatsApp message — a plain `wa.me` link
 * cannot. On submit it validates the fields, then opens the clinic's WhatsApp
 * chat with the visitor's details already written into the text box. The
 * visitor still has to press Send inside WhatsApp, so the page asks them to
 * continue there instead of claiming the message was delivered.
 */
export function ContactForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<{
    href: string;
    popupBlocked: boolean;
  } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const typed: Draft = {
      name: String(fd.get("name") ?? ""),
      mobile: String(fd.get("mobile") ?? ""),
      email: String(fd.get("email") ?? ""),
      interest: String(fd.get("interest") ?? ""),
      appointmentType: (fd.get("appointmentType") ??
        "GENERAL") as ContactAppointmentType,
      message: String(fd.get("message") ?? ""),
    };

    // Validation happens before anything opens, so a bad name or mobile number
    // never sends the visitor to a half-empty WhatsApp chat. The form stays
    // mounted on failure, so nothing they typed is lost.
    const checked = checkContactEnquiry(typed);
    if (!checked.ok) {
      setError(checked.error);
      setFieldErrors(checked.fieldErrors);
      setHandoff(null);
      return;
    }

    setError(null);
    setFieldErrors({});
    setDraft(typed);

    const message = contactFormMessage({
      name: checked.data.name,
      mobile: checked.data.mobile,
      interest: checked.data.interest,
      about: checked.data.appointmentType
        ? CONTACT_APPOINTMENT_LABELS[checked.data.appointmentType]
        : undefined,
      message: checked.data.message,
    });
    const href = WHATSAPP.withMessage(message);

    // Opened in the click handler, not after an await: a navigation the browser
    // does not trace back to the tap (or click) gets treated as a popup.
    const win = window.open(href, "_blank");
    if (win) win.opener = null;
    setHandoff({ href, popupBlocked: !win });

    // Keep a record for the clinic as well, in case the visitor cannot complete
    // the handoff. Best-effort only — it never blocks or replaces WhatsApp, and
    // nothing in the UI claims this enquiry was delivered.
    submitContactEnquiry(typed).catch(() => {});
  }

  if (handoff) {
    return (
      <div
        role="status"
        className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4"
      >
        <p className="text-sm font-semibold text-brand-800">
          Continue in WhatsApp to send your message.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-brand-700">
          {handoff.popupBlocked
            ? "Your browser blocked the new tab. "
            : "WhatsApp opened in a new tab with your details already written. "}
          Press <span className="font-semibold">Send</span> inside WhatsApp to
          contact QUALITY Hearing Care — the message only reaches us once you
          send it.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href={handoff.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Open WhatsApp again
          </a>
          <button
            type="button"
            onClick={() => setHandoff(null)}
            className="text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Edit details
          </button>
        </div>
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
          <input id="cf-name" name="name" type="text" required autoComplete="name" defaultValue={draft.name} className={inputCls}
            aria-invalid={fieldErrors.name ? true : undefined} aria-describedby={fieldErrors.name ? "cf-name-err" : undefined} />
          {fieldErrors.name && <p id="cf-name-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="cf-mobile" className="block text-sm font-semibold text-ink-800">
            Mobile <span aria-hidden="true" className="text-accent-600">*</span>
          </label>
          <input id="cf-mobile" name="mobile" type="tel" inputMode="tel" required autoComplete="tel" defaultValue={draft.mobile} className={inputCls}
            aria-invalid={fieldErrors.mobile ? true : undefined} aria-describedby={fieldErrors.mobile ? "cf-mobile-err" : undefined} />
          {fieldErrors.mobile && <p id="cf-mobile-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.mobile}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className="block text-sm font-semibold text-ink-800">
            Email <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input id="cf-email" name="email" type="email" autoComplete="email" defaultValue={draft.email} className={inputCls}
            aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={fieldErrors.email ? "cf-email-err" : undefined} />
          {fieldErrors.email && <p id="cf-email-err" role="alert" className="mt-1 text-sm text-accent-700">{fieldErrors.email}</p>}
        </div>
        <div>
          <label htmlFor="cf-interest" className="block text-sm font-semibold text-ink-800">
            Interested in <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <select id="cf-interest" name="interest" className={inputCls} defaultValue={draft.interest}>
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
          {CONTACT_APPOINTMENT_TYPES.map((value) => (
            <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink-700 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-800">
              <input type="radio" name="appointmentType" value={value} defaultChecked={draft.appointmentType === value} className="accent-[var(--color-brand-600)]" />
              {CONTACT_APPOINTMENT_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="cf-message" className="block text-sm font-semibold text-ink-800">
          Message <span aria-hidden="true" className="text-accent-600">*</span>
        </label>
        <textarea id="cf-message" name="message" rows={4} required maxLength={2000} defaultValue={draft.message}
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
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 sm:w-auto"
      >
        Send message
      </button>
      <p className="text-xs text-ink-400">
        Send message opens WhatsApp with your details filled in — press Send
        there to reach us. Your details are used only to respond to your
        enquiry.
      </p>
    </form>
  );
}
