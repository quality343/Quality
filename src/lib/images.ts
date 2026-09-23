import type { StaticImageData } from "next/image";

/**
 * Photography registry — the single source of truth for every photo used on the
 * public website. Components import from here instead of hardcoding filenames,
 * so swapping in the clinic's own photography is a one-line change per image.
 *
 * Licence and full credits: public/images/README.md
 *
 * Alt text is deliberately descriptive rather than keyword-stuffed: it is read
 * aloud by screen readers, and these images carry meaning (a shared moment, a
 * fitting, a home visit), not decoration.
 */

export type SitePhoto = {
  /** Path under /public. */
  src: string;
  /** Intrinsic aspect ratio, used to reserve layout space (prevents CLS). */
  width: number;
  height: number;
  alt: string;
  /** Where the subject sits, so crops keep faces in frame. */
  focal?: "center" | "top" | "bottom" | "left" | "right";
  /**
   * Exact `object-position`, for photos whose subject sits somewhere between
   * the focal presets. Wins over `focal` when set — a wide crop of a portrait
   * frame otherwise lands on whatever happens to be in the middle.
   */
  position?: string;
};

const LANDSCAPE = { width: 1400, height: 933 } as const;

export const PHOTOS = {
  /**
   * Two older adults laughing together — the emotional "why" of hearing care.
   * Portrait source used two ways (wide chip on mobile, tall card on desktop),
   * so the position is pinned just above the faces for both crops.
   */
  heroCouple: {
    src: "/images/hero-couple.jpg",
    width: 1920,
    height: 2876,
    alt: "Two older adults laughing together in warm daylight",
    position: "50% 26%",
  },

  /** Grandfather and granddaughter sharing a joke. */
  familyGrandfather: {
    ...LANDSCAPE,
    src: "/images/family-grandfather.jpg",
    alt: "A grandfather and his granddaughter laughing together",
  },

  /** Adult daughter greeting her mother outdoors — family connection. */
  homeVisitFamily: {
    ...LANDSCAPE,
    src: "/images/home-visit-family.jpg",
    alt: "An adult daughter greeting her mother in a sunlit garden",
  },

  /** Older man smiling outdoors — everyday confidence. */
  lifestyleListening: {
    ...LANDSCAPE,
    src: "/images/lifestyle-listening.jpg",
    alt: "An older man smiling outdoors on a city street",
  },

  /** Clinician at a desk — consultation and explanation. */
  consultationDoctor: {
    src: "/images/consultation-doctor.jpg",
    width: 1400,
    height: 788,
    alt: "A clinician smiling at a consultation desk",
  },

  /** Ear examination — stands in for the assessment room. */
  hearingTestEar: {
    ...LANDSCAPE,
    src: "/images/hearing-test-ear.jpg",
    alt: "A hearing professional examining a patient's ear",
  },

  /** Hands held in support — care and reassurance. */
  careSupport: {
    ...LANDSCAPE,
    src: "/images/care-support.jpg",
    alt: "A hearing professional holding a patient's hands reassuringly",
  },

  /** Close detail of a hearing aid worn behind the ear. */
  hearingAidDetail: {
    src: "/images/hearing-aid-detail.jpg",
    width: 1400,
    height: 931,
    alt: "Close-up of a hearing aid worn behind the ear",
  },

  /** Home visit — care delivered where the patient lives. */
  homeCare: {
    ...LANDSCAPE,
    src: "/images/home-care.jpg",
    alt: "A hearing professional assisting an older patient at home",
  },

  /** Listening through headphones — the hearing/audio world. */
  listeningAudio: {
    src: "/images/listening-audio.jpg",
    width: 1400,
    height: 934,
    alt: "An older man listening carefully through headphones",
  },

  /** Someone helping a visitor use a phone — booking and support. */
  bookingHelp: {
    ...LANDSCAPE,
    src: "/images/booking-help.jpg",
    alt: "A younger person helping an older man use a phone",
  },

  /** Quiet domestic moment — the everyday life hearing care protects. */
  familySofa: {
    ...LANDSCAPE,
    src: "/images/family-sofa.jpg",
    alt: "An older man and a child talking together on a sofa at home",
  },

  /**
   * Client-supplied product render — one behind-the-ear device, shown as an
   * example of the style we fit. It depicts no specific manufacturer's model,
   * and no specification is claimed for it.
   */
  hearingAidGold: {
    src: "/images/hearing-aid-gold.jpg",
    width: 1254,
    height: 1254,
    alt: "A gold behind-the-ear hearing aid with a clear receiver wire and ear dome",
  },

  /**
   * Client-supplied product render — two devices side by side, used where the
   * point is the *choice* of device rather than one particular one.
   */
  hearingAidPair: {
    src: "/images/hearing-aid-pair.jpg",
    width: 1337,
    height: 1177,
    alt: "Two behind-the-ear hearing aids side by side, one silver and one gold",
  },

  /**
   * Client-supplied product photo — two compact aids docked in an open charger.
   * Used for the rechargeable-format callout, where the point is that the
   * devices charge in a case rather than taking batteries. It carries no
   * legible manufacturer branding.
   */
  hearingAidChargingCase: {
    src: "/images/hearing-aid-charging-case.jpg",
    width: 720,
    height: 557,
    alt: "Two compact hearing aids docked in an open white charging case",
  },
} as const satisfies Record<string, SitePhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Convenience lookup for the rare dynamic case (e.g. a CMS-driven slot). */
export function photo(key: PhotoKey): SitePhoto {
  return PHOTOS[key];
}

export type { StaticImageData };
