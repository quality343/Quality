import { PHOTOS, type SitePhoto } from "@/lib/images";

/**
 * Video registry — the single source of truth for every video on the public
 * website, mirroring `src/lib/images.ts` so no component hardcodes a URL.
 *
 * ─── The state of play ──────────────────────────────────────────────────────
 * The clinic has now supplied **one clip of its own** — `deviceShowcase`, the
 * product render of a behind-the-ear device on the homepage. It is owned by
 * QUALITY Hearing Care and is the only clip described as ours on the page.
 *
 * Every other slot still carries **stock clips under the Pexels License** (free
 * for commercial use, no attribution required, modification permitted) — the
 * same licence the site's photographs already use. Every clip is recorded, with
 * its source and permission, in `public/video/README.md`.
 *
 * These are placeholders in the honest sense: they are *labelled* as illustrative
 * in the page (`footageNote`), they show no product or clinic claim, and each one
 * should be replaced with real clinic footage when the client supplies it. What
 * we did not do is pretend they are ours.
 *
 * What the site does with an **empty** slot (still the behaviour for any slot
 * without a clip):
 * - the section still renders — heading, text, poster photograph and CTA — as an
 *   editorial panel with **no play button**, because a play button that does
 *   nothing is a broken player;
 * - in development a small dashed marker names the slot, so it is obvious while
 *   building pages;
 * - in production the marker disappears entirely.
 *
 * ─── Adding a clip (config only — no component changes) ─────────────────────
 *   1. Put the file in `public/video/` (e.g. `quality-hearing-care.mp4`), or use
 *      a hosting/CDN URL, or a YouTube/Vimeo id — all three are supported.
 *   2. Fill in `clip` **and** `licence`. The type below will not let you set one
 *      without the other: a video may not ship without a recorded source and
 *      permission. If the clip has speech, add a WebVTT file to `public/video/`
 *      and list it in `captions` — captions are an accessibility requirement,
 *      not a nice-to-have.
 *   3. Record it in `public/video/README.md` (source, licence, attribution).
 *
 * ─── Where footage may come from ────────────────────────────────────────────
 * Client-supplied footage first, then properly licensed stock, then an
 * official YouTube/Vimeo upload the clinic owns. **Never** a clip copied from
 * another clinic's or manufacturer's website because it is publicly viewable,
 * and never a clip carrying another company's branding.
 *
 * ─── Performance ────────────────────────────────────────────────────────────
 * Nothing here is fetched on page load. Interactive slots render a poster image
 * and load the video only when a visitor presses play; the hero background clip
 * is the sole autoplaying slot, and it is muted, looping and short. Keep files
 * under ~15 MB, exported H.264 MP4 at 1080p (~8–20 Mbps).
 */

/* ── Types ─────────────────────────────────────────────────────── */

/** WebVTT caption/subtitle track. */
export type VttTrack = {
  /** Path under /public, or an https URL. */
  src: string;
  /** BCP-47 language tag, e.g. "en" or "te". */
  srcLang: string;
  label: string;
  /** One track should be marked default. */
  default?: boolean;
};

/**
 * A playable clip. Three delivery shapes are supported so the clinic is never
 * forced into one host: a self-hosted/`public` file, or an official external
 * upload. External embeds are lazily created on click, so they cost nothing
 * until a visitor asks for them.
 */
export type VideoSource =
  | { kind: "file"; src: string; mimeType?: string }
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string };

/**
 * Provenance for a clip. Required by the type whenever a clip exists, so a
 * video cannot be published without somebody having answered "where did this
 * come from, and may we show it?".
 */
export type VideoLicence = {
  /** Where the clip came from — e.g. "Client-supplied", "Pexels Videos". */
  source: string;
  /** The permission under which it may be shown, in plain words. */
  licence: string;
  /** True when the licence obliges us to credit the creator on the page. */
  attributionRequired: boolean;
  /** Reference URL for the licence or the original clip. */
  url?: string;
};

export type VideoAspect = "video" | "wide" | "portrait";

/**
 * Aspect-ratio classes per slot shape. Shared here so the player and the section
 * frame identical boxes — a mismatch is what causes a visible jump when a
 * visitor presses play.
 */
export const VIDEO_ASPECT: Record<VideoAspect, string> = {
  video: "aspect-video",
  /** Wider on large screens so it reads as a cinematic band, not a screen. */
  wide: "aspect-[16/10] sm:aspect-[21/9]",
  portrait: "aspect-[4/5]",
};

type SlotBase = {
  /** Stable id — used as the JSON-LD @id and the dev marker label. */
  id: string;
  /** Small label above the heading. */
  eyebrow: string;
  title: string;
  description: string;
  /** Poster still, from `src/lib/images.ts`. Shown before play and as fallback. */
  poster: SitePhoto;
  aspect?: VideoAspect;
  /**
   * Human duration label, e.g. "1 min 40 sec".
   *
   * Only set this once the clip exists — its real length is a fact about the
   * file. Publishing a guessed running time for footage nobody has made yet is
   * a made-up detail, and this section is careful not to show any.
   */
  duration?: string;
  captions?: VttTrack[];
  cta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  /**
   * Shown under the player when the footage is illustrative rather than real
   * clinic footage. Stock video must never be presented as our own clinic.
   */
  footageNote?: string;
};

/**
 * A configured slot carries a clip **and** its licence; an unconfigured one
 * carries neither. Modelled as a union so the compiler enforces the pairing.
 */
export type VideoSlot =
  | (SlotBase & { clip: VideoSource; licence: VideoLicence })
  | (SlotBase & { clip: null; licence?: undefined });

/** Slots used on the public website. */
export const VIDEO = {
  /**
   * Homepage hero background — the one autoplaying slot. Decorative only: it
   * sits behind the hero copy under a scrim, muted and looping, and is marked
   * `aria-hidden` because nothing in it is information.
   */
  heroBackground: {
    id: "hero-background",
    eyebrow: "Hero background",
    title: "QUALITY Hearing Care",
    description:
      "A short, calm lifestyle clip behind the hero copy: everyday moments of listening and conversation. Muted, looping, and never the only carrier of meaning.",
    poster: PHOTOS.heroCouple,
    aspect: "video",
    /* 540p on purpose: this is the only clip a visitor downloads without asking,
       and it sits behind a heavy scrim, where the resolution is not visible. */
    clip: { kind: "file", src: "/video/hero-couple-talking.mp4" },
    licence: {
      source: "Pexels — “An Elderly Couple Talking to Each Other” (id 8971243)",
      licence: "Pexels License",
      attributionRequired: false,
      url: "https://www.pexels.com/video/an-elderly-couple-talking-to-each-other-8971243/",
    },
    captions: [],
  } satisfies VideoSlot,

  /**
   * Homepage — "Because hearing connects us." Large emotional panel after the
   * introductory content. Footage should be people communicating.
   */
  hearingCareMatters: {
    id: "hearing-care-matters",
    eyebrow: "Hearing care matters",
    title: "Because hearing connects us.",
    description:
      "Shared meals, phone calls, the joke you only half catch. Hearing is how most of that reaches us — and it is the part of it we can actually do something about.",
    poster: PHOTOS.familySofa,
    aspect: "wide",
    cta: { href: "/services", label: "Learn About Our Services" },
    footageNote:
      "Stock footage of a couple at home, used illustratively. They are not QUALITY Hearing Care patients.",
    clip: { kind: "file", src: "/video/couple-holding-hands.mp4" },
    licence: {
      source: "Pexels — “Elderly Couple Holding Hands on the Table” (id 8164677)",
      licence: "Pexels License",
      attributionRequired: false,
      url: "https://www.pexels.com/video/elderly-couple-holding-hands-on-the-table-8164677/",
    },
    captions: [],
  } satisfies VideoSlot,

  /**
   * Hearing tests — on the homepage and again on /hearing-tests. Explains what
   * an assessment involves; it is not a diagnosis and promises no outcome.
   */
  hearingTest: {
    id: "hearing-test",
    eyebrow: "Your assessment",
    title: "What happens during a hearing test?",
    description:
      "A conversation first, then a series of comfortable listening tasks across the pitch range. You will be shown the equipment, told what each part is for, and given your results in plain language before you leave.",
    /* Deliberately not `hearingTestEar`: that photo is the /hearing-tests hero
       and the homepage assessment panel, and repeating it inside the same
       viewport reads as a mistake. */
    poster: PHOTOS.consultationDoctor,
    aspect: "video",
    /* No `duration`: the clip does not exist yet, so its length is not known. */
    cta: { href: "/book-appointment", label: "Book a Hearing Test" },
    secondaryCta: { href: "/hearing-tests", label: "Which test do I need?" },
    footageNote:
      "Stock footage of a consultation, used illustratively. It was not filmed at our clinic, and these are not our patients.",
    clip: { kind: "file", src: "/video/consultation.mp4" },
    licence: {
      source: "Pexels — “A Senior Doctor Having an Online Consultation” (id 8375654)",
      licence: "Pexels License",
      attributionRequired: false,
      url: "https://www.pexels.com/video/a-senior-doctor-having-an-online-consultation-8375654/",
    },
    captions: [],
  } satisfies VideoSlot,

  /**
   * Homepage hearing-aid showcase — the clinic's own product render.
   *
   * This is the one clip on the site that is genuinely ours, so it carries no
   * `footageNote` and no attribution: it is a slow turntable of a
   * behind-the-ear device, used as the *visual* for the section that explains
   * how devices are fitted. It shows one style, so the copy still makes no
   * claim about a specific model, brand or specification — and unlike the
   * interactive slots it plays as ambient decoration (`DeviceClip`), silent,
   * looping, and paused for anyone who prefers reduced motion.
   */
  deviceShowcase: {
    id: "device-showcase",
    eyebrow: "Hearing aids",
    title: "Modern devices, professionally fitted",
    description:
      "A slow look at one of the styles we fit. What makes any device work is how precisely it is programmed to your hearing and the situations you actually find difficult — never the device on its own.",
    poster: PHOTOS.hearingAidGold,
    aspect: "video",
    clip: { kind: "file", src: "/video/hearing-aid-3d.mp4" },
    licence: {
      source: "Client-supplied — QUALITY Hearing Care",
      licence: "Owned by QUALITY Hearing Care",
      attributionRequired: false,
    },
    captions: [],
  } satisfies VideoSlot,

  /**
   * Hearing aids — premium product/lifestyle clip. Educational only: it must
   * never recommend a specific device or imply hearing aids suit everyone.
   */
  hearingAids: {
    id: "hearing-aids",
    eyebrow: "Hearing aids",
    title: "Technology designed around your life.",
    description:
      "Modern devices are smaller and more automatic than most people expect — but the device is only half of it. What makes them work is how precisely they are programmed to your hearing and the places you actually struggle.",
    poster: PHOTOS.hearingAidDetail,
    aspect: "video",
    cta: { href: "/hearing-aids", label: "Explore Hearing Aids" },
    secondaryCta: { href: "/book-appointment", label: "Book a Hearing-Aid Consultation" },
    footageNote:
      "Stock footage of a close-up of an ear. It shows no specific product, and devices are never recommended online — suitability is decided after your hearing assessment.",
    clip: { kind: "file", src: "/video/ear-close-up.mp4" },
    licence: {
      source: "Pexels — “Close-Up Video of a Person's Ear” (id 6620878)",
      licence: "Pexels License",
      attributionRequired: false,
      url: "https://www.pexels.com/video/close-up-video-of-a-person-ear-6620878/",
    },
    captions: [],
  } satisfies VideoSlot,

  /**
   * Home consultation — on the homepage and /home-consultation. Communicates
   * that home visits are available, and nothing more: no radius, no same-day
   * promise, no 24/7 claim.
   */
  homeConsultation: {
    id: "home-consultation",
    eyebrow: "Home consultation",
    /* Titled differently from the page's own "Care that comes to you" hero, so
       the page never repeats its own heading twice in a row. */
    title: "A proper hearing assessment, at home.",
    description:
      "When travelling to the clinic is difficult, we can come to you. Home consultation is available in Hyderabad — our team confirms the visit and a suitable time with you beforehand.",
    poster: PHOTOS.homeCare,
    aspect: "video",
    cta: {
      href: "/book-appointment?type=HOME_CONSULTATION",
      label: "Book Home Consultation",
    },
    secondaryCta: { href: "/home-consultation", label: "How it works" },
    footageNote:
      "Stock footage of a home health visit, used illustratively — not one of our home consultations.",
    clip: { kind: "file", src: "/video/home-checkup.mp4" },
    licence: {
      source: "Pexels — “Elderly Woman Having a Check Up” (id 8944262)",
      licence: "Pexels License",
      attributionRequired: false,
      url: "https://www.pexels.com/video/elderly-woman-having-a-check-up-8944262/",
    },
    captions: [],
  } satisfies VideoSlot,

  /**
   * Closing emotional section. Supportive, not manipulative — no urgency
   * pressure and no claim about outcomes.
   */
  finalCta: {
    id: "what-are-you-waiting-for",
    eyebrow: "Take the first step",
    title: "What are you waiting for?",
    description:
      "Take the first step toward better hearing. A single appointment tells you where you stand — and you do not need an account to book one.",
    /* Matches the full-bleed band the homepage already uses for this section,
       so the slot and the page cannot drift apart. */
    poster: PHOTOS.lifestyleListening,
    aspect: "wide",
    cta: { href: "/book-appointment", label: "Book an Appointment" },
    secondaryCta: {
      href: "/book-appointment?type=HOME_CONSULTATION",
      label: "Home Consultation",
    },
    footageNote: "Stock footage, used illustratively. They are not our patients.",
    clip: { kind: "file", src: "/video/couple-in-park.mp4" },
    licence: {
      source: "Pexels — “An Elderly Couple Having Conversation at the Park” (id 8970846)",
      licence: "Pexels License",
      attributionRequired: false,
      url: "https://www.pexels.com/video/an-elderly-couple-having-conversation-at-the-park-8970846/",
    },
    captions: [],
  } satisfies VideoSlot,
} as const;

/**
 * The hero background slot, deliberately **widened** to `VideoSlot`.
 *
 * `VIDEO` is inferred narrowly, so `VIDEO.heroBackground.clip` has the literal
 * type `null` — correct today, but it would turn every branch in `HeroVideo`
 * into unreachable code and the component would not even compile. Reading it
 * through this alias keeps the component honest about both states: no clip
 * (render nothing) and a clip (render the background video).
 */
export const HERO_BACKGROUND: VideoSlot = VIDEO.heroBackground;

/* ── Patient testimonials ──────────────────────────────────────── */

/**
 * Testimonial videos. **Empty on purpose.**
 *
 * A testimonial may only appear here when the clinic supplies the recording
 * *and* the patient has approved its use. Inventing names, quotes or patient
 * stories would be a fabrication shown to vulnerable people looking for
 * help — so the component renders nothing at all while this list is empty.
 *
 * To add one: set `consent.patientApproved` to true only after the clinic
 * confirms the patient signed off, then record it in `public/video/README.md`.
 */
export type TestimonialVideo = {
  id: string;
  /** First name and initial only — never a full identity. */
  patientName: string;
  quote: string;
  poster: SitePhoto;
  clip: VideoSource;
  licence: VideoLicence;
  consent: {
    /** Must be true. The component filters on this, not on the list contents. */
    patientApproved: boolean;
    /** ISO date the clinic recorded consent. */
    recordedOn: string;
  };
};

export const TESTIMONIAL_VIDEOS: TestimonialVideo[] = [];

/** True only when at least one testimonial has recorded patient consent. */
export function approvedTestimonials(): TestimonialVideo[] {
  return TESTIMONIAL_VIDEOS.filter((t) => t.consent.patientApproved);
}

/* ── Service-page strips ───────────────────────────────────────── */

/**
 * Optional short clips for individual service pages, keyed by service code
 * (lower-case, as it appears in the URL — `/services/pure-tone-audiometry`).
 *
 * Empty for now: a service without a clip simply shows no strip, and the
 * catalogue is unaffected. Kept short by convention — these sit inside a page
 * that already has content, and none of them autoplay.
 */
export const SERVICE_VIDEOS: Record<string, VideoSlot> = {};

/* ── Helpers ───────────────────────────────────────────────────── */

/** True when a slot actually has footage — the guard every component uses. */
export function hasClip(slot: VideoSlot): boolean {
  return slot.clip !== null;
}

/**
 * Poster path for a slot, for `next/image` sizes hints or structured data.
 * Kept as a helper so callers never reach into `slot.poster.src` directly.
 */
export function posterSrc(slot: VideoSlot): string {
  return slot.poster.src;
}
