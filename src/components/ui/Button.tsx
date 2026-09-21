import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  secondary:
    "border border-border bg-surface text-ink-800 hover:border-brand-300 hover:text-brand-700",
  ghost: "text-brand-700 hover:bg-brand-50",
  accent: "bg-accent-600 text-white hover:bg-accent-700",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

type ButtonAsButton = ComponentProps<"button"> & {
  href?: undefined;
  variant?: Variant;
  size?: Size;
};

type ButtonAsLink = ComponentProps<typeof Link> & {
  href: string;
  variant?: Variant;
  size?: Size;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`;

  if ("href" in props && props.href !== undefined) {
    return <Link className={classes} {...(rest as ComponentProps<typeof Link>)} />;
  }

  return <button className={classes} {...(rest as ComponentProps<"button">)} />;
}
