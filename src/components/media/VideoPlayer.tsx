"use client";

import { useState } from "react";
import { Photo } from "@/components/media/Photo";
import type { SitePhoto } from "@/lib/images";
import { VIDEO_ASPECT, type VideoAspect, type VideoSource, type VttTrack } from "@/lib/media";

/**
 * The click-to-play video player for the public website.
 *
 * A *facade*: the visitor sees the poster still and a large play button, and not
 * one byte of video is requested until they press it. That is what keeps several
 * video sections from wrecking the load time of a site whose real job is booking
 * appointments — a page of four autoplaying players would be a slow, noisy mess.
 *
 * Autoplaying *background* video is a different job with different rules (no
 * controls, no tab stop, hidden from screen readers, scrimmed for contrast), so
 * it lives in `HeroVideo` rather than behind a flag here. Splitting them means
 * neither can accidentally inherit the other's accessibility behaviour.
 *
 * Every failure path ends at the poster plus text — never a broken player, and
 * never a play button that does nothing.
 */

/** Privacy-respecting embed URLs: no tracking cookies, no sound on autoplay. */
function embedUrl(clip: Extract<VideoSource, { kind: "youtube" | "vimeo" }>): string {
  if (clip.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${clip.id}?autoplay=1&rel=0&modestbranding=1`;
  }
  return `https://player.vimeo.com/video/${clip.id}?autoplay=1&dnt=1`;
}

export function VideoPlayer({
  title,
  poster,
  clip,
  aspect = "video",
  captions,
  sizes = "(min-width: 1024px) 960px, 100vw",
  priority = false,
  className = "",
}: {
  title: string;
  poster: SitePhoto;
  clip: VideoSource;
  aspect?: VideoAspect;
  captions?: VttTrack[];
  /** `next/image` sizes hint for the poster. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const frame = `relative isolate overflow-hidden rounded-3xl border border-border bg-brand-950 shadow-float ${VIDEO_ASPECT[aspect]} ${className}`;

  /* ── Failure: poster + explanation, never a dead player ───────── */
  if (failed) {
    return (
      <div className={frame}>
        <Photo source={poster} sizes={sizes} priority={priority} overlay scrim="medium" />
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="max-w-sm rounded-2xl bg-brand-950/85 p-6 text-center backdrop-blur-sm">
            <p className="font-display font-semibold text-white">This video could not be played</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-100/85">
              The rest of the page is unaffected. Call the clinic and we&apos;ll answer any
              questions directly.
            </p>
            <a
              href="#contact"
              className="mt-4 inline-flex text-sm font-semibold text-white underline underline-offset-4"
            >
              Contact details
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Interactive: poster + play button until asked ─────────────── */
  if (!playing) {
    return (
      <div className={frame}>
        <Photo source={poster} sizes={sizes} priority={priority} overlay scrim="soft" />

        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 grid place-items-center focus-visible:outline-none"
          aria-label={`Play video: ${title}`}
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-brand-800 shadow-float ring-1 ring-white/50 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 group-focus-visible:scale-105 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-white sm:h-20 sm:w-20">
            {/* Solid rather than the shared stroke icons: an outlined triangle
                reads as a thin squiggle at this size. */}
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="h-7 w-7 translate-x-0.5 sm:h-8 sm:w-8"
            >
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.14-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </button>
      </div>
    );
  }

  const isFile = clip.kind === "file";

  return (
    <div className={frame}>
      {isFile ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={clip.src}
          poster={poster.src}
          controls
          autoPlay
          playsInline
          preload="metadata"
          aria-label={title}
          onError={() => setFailed(true)}
        >
          {captions?.map((track) => (
            <track
              key={track.src}
              kind="captions"
              src={track.src}
              srcLang={track.srcLang}
              label={track.label}
              default={track.default}
            />
          ))}
          {/* Reached only by browsers that cannot play the file at all. */}
          <p className="p-6 text-sm text-white">
            Your browser cannot play this video. You can still{" "}
            <a href="#contact" className="font-semibold underline">
              contact the clinic
            </a>{" "}
            and we&apos;ll answer any questions directly.
          </p>
        </video>
      ) : (
        <>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={embedUrl(clip)}
            title={title}
            loading="lazy"
            /* `allow` already grants fullscreen; adding `allowFullScreen` as well
               makes React warn that it will be overridden. */
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {/* An embed cannot report its own failure, so give a real way out. */}
          <p className="sr-only">
            If the video does not play,{" "}
            <a
              href={
                clip.kind === "youtube"
                  ? `https://www.youtube-nocookie.com/watch?v=${clip.id}`
                  : `https://vimeo.com/${clip.id}`
              }
            >
              open it on the original site
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
