import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Photo } from "@/components/media/Photo";
import type { SitePhoto } from "@/lib/images";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional right-hand column (visual, card, figure…). */
  aside?: ReactNode;
  align?: "center" | "left";
  /**
   * Optional photographic backdrop. When set, the band becomes a real
   * photograph with a directional scrim — dense behind the copy, clearing
   * across the frame — instead of a flat gradient. This is what makes every
   * subpage feel like part of the same photographed brand as the homepage.
   */
  photo?: SitePhoto;
};

/**
 * Shared hero band for every public page below the homepage.
 *
 * One component keeps the premium rhythm consistent: same depth of
 * background, same headline scale, same CTA placement — so the whole site
 * reads as one designed brand rather than a set of separate templates.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  align = "left",
  photo,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      {photo ? (
        <>
          <Photo source={photo} sizes="100vw" className="h-full w-full" overlay />
          {/* Directional scrim. Tuned to two constraints at once: white copy
              must stay comfortably readable, and the photograph must still be
              visible. A near-opaque overlay satisfied the first and erased the
              second — the band just looked like a flat gradient again. */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-brand-950/88 via-brand-950/74 to-brand-950/90 lg:bg-gradient-to-r lg:from-brand-950 lg:via-brand-950/86 lg:to-brand-950/25"
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          <div className="bg-hero absolute inset-0" aria-hidden="true" />
          <div
            className="absolute inset-x-0 top-0 h-64 opacity-80 blur-3xl"
            style={{
              backgroundImage:
                "radial-gradient(34% 70% at 22% 0%, rgba(32,105,180,0.55), transparent 70%), radial-gradient(28% 60% at 82% 0%, rgba(220,38,56,0.2), transparent 72%)",
            }}
            aria-hidden="true"
          />
        </>
      )}

      <div className="dot-grid absolute inset-0 opacity-40" aria-hidden="true" />

      <Container
        className={`relative grid gap-10 py-14 sm:py-20 ${
          aside ? "lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24" : ""
        }`}
      >
        <div
          className={`animate-fade-up min-w-0 ${
            align === "center" && !aside ? "mx-auto max-w-3xl text-center" : "max-w-3xl"
          }`}
        >
          {eyebrow ? (
            <p className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-brand-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="headline mt-5 text-[2.1rem] sm:text-5xl lg:text-[3.4rem]">{title}</h1>
          {description ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              {description}
            </p>
          ) : null}
          {actions ? (
            <div
              className={`mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap ${
                align === "center" && !aside ? "sm:justify-center" : ""
              }`}
            >
              {actions}
            </div>
          ) : null}
        </div>
        {aside ? (
          <div className="animate-fade-up min-w-0" style={{ animationDelay: "120ms" }}>
            {aside}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
