import type { ComponentProps } from "react";

type CardProps = ComponentProps<"div"> & {
  /** Disable default inner padding for custom compositions. */
  bare?: boolean;
};

export function Card({ bare = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-card ${
        bare ? "" : "p-6"
      } ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}
