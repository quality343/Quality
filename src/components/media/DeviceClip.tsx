"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { VIDEO, type VideoSlot } from "@/lib/media";

/**
 * Ambient product clip — a video used as a *visual*, not as content.
 *
 * Why this is not `VideoSection`/`VideoPlayer`: those exist to show a clip a
 * visitor chooses to watch, so they own a play button, controls, a caption
 * track and a place in the tab order. Here there is nothing to watch *for* —
 * the clip is a slow turntable of a device that illustrates the section around
 * it. So it has no controls, no tab stop and nothing to announce: it is muted,
 * loops silently, and is `aria-hidden`, exactly like the poster it replaces.
 *
 * Three things keep it cheap and safe:
 * - it only attaches the `<video>` once the tile is within 200px of the
 *   viewport, so a visitor who never scrolls this far never downloads it (the
 *   poster still rides `next/image`, and stands in until then);
 * - under `prefers-reduced-motion` it never attaches at all, and the poster
 *   still is shown instead — motion nobody can pause is what that setting is
 *   for;
 * - the poster is the same aspect as the frame, so nothing shifts when the
 *   video arrives.
 */
export function DeviceClip({
  slot = VIDEO.deviceShowcase,
  aspectClassName = "aspect-video",
  className = "",
}: {
  slot?: VideoSlot;
  /** Frame shape. Must match the clip, or `object-cover` would crop it. */
  aspectClassName?: string;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const src = slot.clip && slot.clip.kind === "file" ? slot.clip.src : null;
  const play = src !== null && nearViewport && !reducedMotion;

  return (
    <div
      ref={frame}
      className={`relative isolate overflow-hidden rounded-[1.75rem] border border-white/12 bg-brand-900/50 shadow-float ${aspectClassName} ${className}`}
    >
      {play ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={slot.poster.src}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          tabIndex={-1}
          disablePictureInPicture
          aria-hidden="true"
        />
      ) : (
        <Image
          src={slot.poster.src}
          alt={slot.poster.alt}
          width={slot.poster.width}
          height={slot.poster.height}
          sizes="(min-width: 1024px) 34rem, 100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
