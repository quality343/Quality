import type { ComponentProps } from "react";

type Tone = "brand" | "neutral" | "accent";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  neutral: "bg-surface-muted text-ink-600 ring-1 ring-inset ring-border",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200",
};

export function Badge({
  tone = "brand",
  className,
  ...rest
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className ?? ""}`}
      {...rest}
    />
  );
}
