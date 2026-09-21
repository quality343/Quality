"use client";

import { Button } from "@/components/ui";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent-600">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        Please try again
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
        We logged the issue. If it keeps happening, contact your branch and we&apos;ll
        help you directly.
      </p>
      <div className="mt-8">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
