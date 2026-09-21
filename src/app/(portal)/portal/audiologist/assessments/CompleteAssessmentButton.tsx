"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { markAssessmentCompleteAction } from "../../actions-clinical";

export function CompleteAssessmentButton({
  assessmentId,
  hasTests,
}: {
  assessmentId: string;
  hasTests: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasTests) {
    return (
      <p className="text-sm text-ink-400">
        Record at least one test result to complete the assessment.
      </p>
    );
  }

  function onComplete() {
    setError(null);
    startTransition(async () => {
      const res = await markAssessmentCompleteAction({ assessmentId });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div>
      <Button onClick={onComplete} disabled={pending}>
        {pending ? "Saving…" : "Mark assessment complete"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
