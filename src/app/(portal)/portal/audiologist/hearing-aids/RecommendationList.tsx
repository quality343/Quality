"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { changeRecommendationStatusAction, recordPatientDecisionAction } from "../../actions-hearingaid";

const STATUS_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  DRAFT: "accent",
  UNDER_REVIEW: "brand",
  APPROVED: "brand",
  DECLINED: "neutral",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
};

const DECISION_TONE: Record<string, "brand" | "neutral" | "accent"> = {
  PENDING: "accent",
  ACCEPTED: "brand",
  DECLINED: "neutral",
  NEEDS_REVIEW: "accent",
};

export type RecItem = {
  id: string;
  patientName: string;
  patientMrn: string;
  modelLabel: string;
  status: string;
  patientDecision: string;
  createdAt: string;
};

export function RecommendationList({ items }: { items: RecItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-ink-400">
        No recommendations yet. Open a model from the catalogue above to prepare one.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink-900">{r.patientName}</span>
              <span className="font-mono text-xs text-ink-400">{r.patientMrn}</span>
              <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status.replace("_", " ")}</Badge>
              {r.status === "APPROVED" ? (
                <Badge tone={DECISION_TONE[r.patientDecision] ?? "neutral"}>
                  Patient: {r.patientDecision.replace("_", " ")}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-ink-500">
              {r.modelLabel} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.status === "DRAFT" ? (
              <>
                <SmallBtn disabled={pending} onClick={() => run(() => changeRecommendationStatusAction({ recommendationId: r.id, status: "UNDER_REVIEW" }))}>
                  Submit for review
                </SmallBtn>
                <SmallBtn disabled={pending} onClick={() => run(() => changeRecommendationStatusAction({ recommendationId: r.id, status: "APPROVED" }))}>
                  Approve
                </SmallBtn>
              </>
            ) : null}
            {r.status === "UNDER_REVIEW" ? (
              <SmallBtn disabled={pending} onClick={() => run(() => changeRecommendationStatusAction({ recommendationId: r.id, status: "APPROVED" }))}>
                Approve
              </SmallBtn>
            ) : null}
            {r.status === "APPROVED" && r.patientDecision === "PENDING" ? (
              <>
                <SmallBtn disabled={pending} onClick={() => run(() => recordPatientDecisionAction({ recommendationId: r.id, decision: "ACCEPTED" }))}>
                  Patient accepted
                </SmallBtn>
                <SmallBtn disabled={pending} onClick={() => run(() => recordPatientDecisionAction({ recommendationId: r.id, decision: "NEEDS_REVIEW" }))}>
                  Needs review
                </SmallBtn>
                <SmallBtn disabled={pending} onClick={() => run(() => recordPatientDecisionAction({ recommendationId: r.id, decision: "DECLINED" }))}>
                  Patient declined
                </SmallBtn>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SmallBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
