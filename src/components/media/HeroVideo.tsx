"use client";

import { useEffect, useState } from "react";
import { HERO_BACKGROUND } from "@/lib/media";

/**
 * Optional cinematic background for the homepage hero.
 *
 * Renders **nothing at all** until the clinic supplies a clip — the hero already
 * has its own gradient, dot grid and portrait, so the absent video is invisible
 * rather than a gap. When a clip exists it sits *behind* the hero content under
 * a scrim, muted and looping.
 *
 * Why this is a separate component from `VideoPlayer`: the hero background has
 * none of the interaction — no controls, no play button, no tab stop. It is
 * decoration, so it is `aria-hidden`, and the whole point of taking it out of
 * the normal flow is that the hero copy must stay legible over it. Keeping the
 * autoplay logic separate from the click-to-play logic means neither can
 * accidentally inherit the other's accessibility rules.
 *
 * The video is attached after mount so it never competes with the first paint,
 * and it is skipped entirely under `prefers-reduced-motion` — motion a visitor
 * cannot stop is exactly what that preference exists to prevent.
 */
export function HeroVideo() {
  const slot = HERO_BACKGROUND;
  const clip = slot.clip;

  const [mount, setMount] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMount(true);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Nothing to show: no clip, an embed (which cannot autoplay muted and loop),
  // reduced motion, or pre-mount. The hero looks exactly as it does today.
  if (!clip || clip.kind !== "file" || !mount || reducedMotion) return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <video
        className="h-full w-full object-cover"
        src={clip.src}
        poster={slot.poster.src}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        tabIndex={-1}
        disablePictureInPicture
      />
      {/* Scrim: the hero copy is white, so contrast must not depend on whatever
          frame of the clip happens to be showing. */}
      <div className="absolute inset-0 bg-brand-950/80" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 70% at 15% 30%, rgba(6,29,58,0.55), transparent 72%)",
        }}
      />
    </div>
  );
}
