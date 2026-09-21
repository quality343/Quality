"use client";

import { useTransition } from "react";
import { updateEnquiryStatusAction } from "../../actions-enquiries";

/**
 * One enquiry row. Contact details are visible only inside the authenticated
 * admin portal — never rendered on any public page.
 */
export function EnquiryRow(props: {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  interest: string | null;
  appointmentType: string | null;
  message: string;
  status: string;
  createdAt: string;
  statusTone: string;
}) {
  const [pending, startTransition] = useTransition();

  const setStatus = (status: string) => {
    startTransition(async () => {
      await updateEnquiryStatusAction({ id: props.id, status });
    });
  };

  return (
    <tr className="border-b border-border/60 align-top">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
        {new Date(props.createdAt).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </td>
      <td className="px-4 py-3 font-medium text-ink-800">{props.name}</td>
      <td className="px-4 py-3 text-ink-600">
        <a href={`tel:+91${props.mobile.replace(/\D/g, "").slice(-10)}`} className="hover:text-brand-700">
          {props.mobile}
        </a>
        {props.email && (
          <>
            <br />
            <a href={`mailto:${props.email}`} className="break-all text-xs text-ink-500 hover:text-brand-700">
              {props.email}
            </a>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-ink-600">
        {props.interest ?? "—"}
        {props.appointmentType && props.appointmentType !== "GENERAL" && (
          <span className="mt-1 block text-ink-400">
            {props.appointmentType === "HOME_CONSULTATION" ? "🏠 Home" : "🏥 Clinic"}
          </span>
        )}
      </td>
      <td className="max-w-[340px] whitespace-pre-line px-4 py-3 text-ink-600">{props.message}</td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${props.statusTone}`}>
          {props.status.replace("_", " ")}
        </span>
        <div className="mt-2 flex gap-1">
          {props.status !== "IN_PROGRESS" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatus("IN_PROGRESS")}
              className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              In progress
            </button>
          )}
          {props.status !== "RESOLVED" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatus("RESOLVED")}
              className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              Resolve
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
