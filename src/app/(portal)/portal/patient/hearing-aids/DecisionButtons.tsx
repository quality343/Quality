"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { recordPatientDecisionAction } from "../../actions-hearingaid";

export function DecisionButtons({ recommendationId }: { recommendationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(decision: "ACCEPTED" | "NEEDS_REVIEW" | "DECLINED") {
    startTransition(async () => {
      await recordPatientDecisionAction({ recommendationId, decision });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide("ACCEPTED")}>
        {pending ? "Saving…" : "I'm interested"}
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => decide("NEEDS_REVIEW")}>
        I have questions
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => decide("DECLINED")}>
        Not now
      </Button>
    </div>
  );
}
