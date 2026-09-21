"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { updateServiceRecordAction } from "../../../actions-hearingaid";

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  REPORTED: "accent",
  UNDER_REVIEW: "brand",
  SENT_FOR_REPAIR: "brand",
  REPAIRED: "brand",
  READY_FOR_COLLECTION: "brand",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
};

const NEXT: Record<string, { status: string; label: string }[]> = {
  REPORTED: [
    { status: "UNDER_REVIEW", label: "Review" },
    { status: "SENT_FOR_REPAIR", label: "Send for repair" },
  ],
  UNDER_REVIEW: [
    { status: "SENT_FOR_REPAIR", label: "Send for repair" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  SENT_FOR_REPAIR: [{ status: "REPAIRED", label: "Mark repaired" }],
  REPAIRED: [{ status: "READY_FOR_COLLECTION", label: "Ready for collection" }],
  READY_FOR_COLLECTION: [{ status: "COMPLETED", label: "Complete" }],
};

type SvcRow = {
  id: string;
  patientName: string;
  device: string;
  serviceType: string;
  status: string;
  issue: string;
  reportedAt: string;
};

export function ServiceManager({ records }: { records: SvcRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, okText: string) {
    setMessage(null);
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? { ok: true, text: okText } : { ok: false, text: res.error ?? "Failed" });
      if (res.ok) router.refresh();
    });
  }

  if (records.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-ink-400">No service records. Patients submit requests from their portal.</p>;
  }

  return (
    <div className="p-4">
      {message ? (
        <p role={message.ok ? "status" : "alert"} className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-brand-50 text-brand-700" : "bg-accent-50 text-accent-700"}`}>
          {message.text}
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {records.slice(0, 12).map((r) => (
          <li key={r.id} className="flex flex-col gap-2 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink-900">{r.patientName}</span>
                <Badge tone="neutral">{r.serviceType.replace("_", " ")}</Badge>
                <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status.replace(/_/g, " ")}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-ink-500">{r.device}</p>
              <p className="mt-0.5 max-w-xl truncate text-xs text-ink-400">{r.issue}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(NEXT[r.status] ?? []).map((a) => (
                <button
                  key={a.status}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        updateServiceRecordAction({
                          serviceRecordId: r.id,
                          status: a.status,
                          resolutionNotes: a.status === "COMPLETED" ? "Service completed." : undefined,
                        }),
                      "Service record updated.",
                    )
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
