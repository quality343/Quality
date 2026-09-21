"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { reviewAssessmentAction } from "../../actions-clinical";

export function ReviewForm({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await reviewAssessmentAction({
        assessmentId,
        reviewText: String(formData.get("reviewText") ?? ""),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink-900">Audiologist review</h2>
      <p className="mt-1 text-xs text-ink-400">
        Your typed conclusion becomes part of the record. It is required before a
        report can be generated — the system never draws conclusions on its own.
      </p>
      <form action={onSubmit} className="mt-4 space-y-3" aria-label="Review assessment">
        <div>
          <label htmlFor="review-text" className="text-xs font-semibold text-ink-700">
            Review / conclusion
          </label>
          <textarea
            id="review-text"
            name="reviewText"
            rows={5}
            required
            minLength={5}
            maxLength={4000}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-200"
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save review"}
        </Button>
      </form>
    </Card>
  );
}
