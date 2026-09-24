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

/**
 * Anything that leaves the Next router — WhatsApp, tel:, mailto:, Maps.
 *
 * These render a plain `<a>`: `next/link` would try to prefetch and push a
 * client-side transition for a destination it does not own, which is what made
 * the WhatsApp CTAs open an empty router state instead of the chat.
 */
const EXTERNAL_HREF = /^(https?:|mailto:|tel:)/i;

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`;

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorProps } = rest as ComponentProps<typeof Link> & {
      href: string;
    };

    if (EXTERNAL_HREF.test(href)) {
      // Web destinations open in a new tab by default (WhatsApp Web, Maps,
      // socials) so the visitor never loses the page they were reading.
      // `tel:` and `mailto:` stay in place — the OS handles those. An explicit
      // `target` at the call site still wins, since it spreads last.
      const newTab = /^https?:/i.test(href)
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {};

      return (
        <a
          href={href}
          className={classes}
          {...newTab}
          {...(anchorProps as ComponentProps<"a">)}
        />
      );
    }

    return <Link href={href} className={classes} {...anchorProps} />;
  }

  return <button className={classes} {...(rest as ComponentProps<"button">)} />;
}
