import { PHOTOS } from "@/lib/images";

/**
 * Video registry — the single source of truth for video used on the public
 * website, mirroring `src/lib/images.ts` so no component hardcodes a filename.
 *
 * ─── Adding the clinic video (one change, no component edits) ───────────────
 * QUALITY Hearing Care has not supplied footage yet, so `src` is null and the
 * website deliberately renders no player. Nothing here is fabricated: there is
 * no stock "clinic promo" standing in for the real thing.
 *
 * To publish the video:
 *   1. Put the file in `public/video/` (e.g. `public/video/quality-hearing-care.mp4`).
 *      Export it as H.264 MP4 at 1080p, ~8–20 Mbps, and keep it under ~15 MB —
 *      it is a website clip, not a broadcast master.
 *   2. Set `src` below. An absolute `https://` URL (for example a hosting/CDN
 *      link) also works; never put a signed or credential-bearing URL in here.
 *   3. Reuse a poster from `PHOTOS`, or drop a still in `public/video/`.
 *   4. If the clip has speech, add a captions file in `public/video/` and list
 *      it in `captions`. Captions are required for accessibility.
 *
 * Notes:
 * - The player is `preload="none"` and never autoplays, so adding the video
 *   does not slow the homepage down or make noise at visitors.
 * - Keep the file local (`/video/…`) or on a host that allows hotlinking; the
 *   player is plain HTML5, so no third-party player script is loaded.
 */

export type VideoCaptionTrack = {
  /** Path under /public, or an https URL. WebVTT (.vtt). */
  src: string;
  /** BCP-47 language tag, e.g. "en" or "te". */
  srcLang: string;
  label: string;
  /** One track should be marked default for screen readers. */
  default?: boolean;
};

export type ClinicVideo = {
  /** Null until the clinic supplies footage — the site then renders no player. */
  src: string | null;
  /** Still shown before playback (avoids a blank/black frame and layout shift). */
  poster: string;
  /** Short, plain-language title used as the section heading. */
  title: string;
  /** One or two sentences describing what the viewer will see. */
  description: string;
  /** Duration label, e.g. "1 min 40 sec". Optional — omit if unknown. */
  duration?: string;
  /** Captions/subtitles. Supply at least one when the clip has speech. */
  captions?: VideoCaptionTrack[];
};

export const CLINIC_VIDEO: ClinicVideo = {
  src: null,
  poster: PHOTOS.lifestyleListening.src,
  title: "Experience the joy of hearing",
  description:
    "A short look inside QUALITY Hearing Care — how a hearing assessment works, what we check, and what happens after your results.",
  captions: [],
};
