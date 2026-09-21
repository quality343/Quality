import Image from "next/image";
import type { ReactNode } from "react";
import type { SitePhoto } from "@/lib/images";

/**
 * Photography primitive.
 *
 * A server component on purpose: it adds no client JavaScript. `next/image`
 * handles responsive sizing, modern formats and lazy-loading, and the intrinsic
 * width/height in `src/lib/images.ts` reserve space so photos never shift the
 * layout as they load.
 *
 * `scrim` exists because text over a photo is only readable with a controlled
 * overlay — the strength is a design decision, not something callers should
 * hand-roll with inline gradients.
 */

type Scrim = "none" | "bottom" | "soft" | "medium" | "strong";

const SCRIM: Record<Scrim, string> = {
  none: "",
  bottom:
    "bg-gradient-to-t from-brand-950/85 via-brand-950/25 to-transparent",
  soft: "bg-brand-950/25",
  medium: "bg-gradient-to-br from-brand-950/72 via-brand-950/45 to-brand-900/30",
  strong:
    "bg-gradient-to-br from-brand-950/90 via-brand-950/72 to-brand-900/60",
};

const FOCAL: Record<NonNullable<SitePhoto["focal"]>, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

export function Photo({
  source,
  className = "",
  imageClassName = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  scrim = "none",
  overlay = false,
  children,
}: {
  source: SitePhoto;
  /** Outer wrapper — put sizing/aspect/rounding here. */
  className?: string;
  imageClassName?: string;
  sizes?: string;
  /** Set on the one above-the-fold image only. */
  priority?: boolean;
  scrim?: Scrim;
  /**
   * Make the wrapper cover its parent (`absolute inset-0`) instead of being a
   * normal flow box. This is a prop rather than a class the caller passes
   * because a caller-supplied `absolute` silently loses to the wrapper's own
   * `relative` — Tailwind emits position utilities in a fixed order, not in
   * the order they appear in the class list, so the element stayed `relative`
   * and collapsed to zero height.
   */
  overlay?: boolean;
  /** Content layered above the photo, inside the same clipping context. */
  children?: ReactNode;
}) {
  return (
    <div
      className={`${overlay ? "absolute inset-0" : "relative"} overflow-hidden ${className}`}
    >
      <Image
        src={source.src}
        alt={source.alt}
        width={source.width}
        height={source.height}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        // `object-position` is only set inline when the photo needs a precise
        // crop; otherwise the Tailwind focal class keeps it in the stylesheet.
        style={source.position ? { objectPosition: source.position } : undefined}
        className={`absolute inset-0 h-full w-full object-cover ${
          source.position ? "" : FOCAL[source.focal ?? "center"]
        } ${imageClassName}`}
      />
      {scrim !== "none" ? (
        <div className={`absolute inset-0 ${SCRIM[scrim]}`} aria-hidden="true" />
      ) : null}
      {children ? <div className="relative h-full w-full">{children}</div> : null}
    </div>
  );
}
