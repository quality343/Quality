/**
 * Client-provided business information (single source of truth).
 * These details came from the clinic manager — do not invent alternatives.
 * If a value here is null/empty, UI must show a neutral placeholder or hide
 * the field rather than fabricate content.
 */
export const CLIENT = {
  name: "QUALITY Hearing Care",
  tagline: "JOY OF HEARING",
  phone: "9966111188",
  phoneHref: "tel:+919966111188",
  email: "qualityhearing.pro@gmail.com",
  addressLines: [
    "MIG 215, above RK Collections,",
    "Kukatpally Housing Board Colony,",
    "KPHB Phase 1, Kukatpally,",
    "Hyderabad, Telangana 500072, India",
  ],
  addressOneLine:
    "MIG 215, above RK Collections, Kukatpally Housing Board Colony, KPHB Phase 1, Kukatpally, Hyderabad, Telangana 500072, India",
  /** Google Maps search URL built from the real address (no invented coords). */
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "MIG 215, above RK Collections, Kukatpally Housing Board Colony, KPHB Phase 1, Kukatpally, Hyderabad, Telangana 500072",
    ),
  homeConsultationAvailable: true,
} as const;

/**
 * WhatsApp is the clinic's primary inbound channel.
 *
 * The number is the clinic's own mobile in E.164 without the `+` — the format
 * `wa.me` requires. Nothing is displayed as a raw URL; the visible label stays
 * the plain phone number.
 */
export const WHATSAPP = {
  number: "919966111188",
  /** Opens the chat with no pre-filled text. */
  href: "https://wa.me/919966111188",
  /**
   * Opens the chat with a first message already typed, so the visitor only has
   * to press send. `encodeURIComponent` handles the spaces, commas and "?" in
   * the copy — a hand-encoded query string is the classic way to ship a broken
   * WhatsApp link.
   */
  withMessage: (message: string) =>
    `https://wa.me/919966111188?text=${encodeURIComponent(message)}`,
} as const;

/**
 * The clinic's official social accounts, exactly as supplied by the manager.
 * URLs are never trimmed: some carry tracking suffixes (`?stkn=…`, `?si=…`)
 * that the manager pasted deliberately.
 *
 * `icon` selects the brand glyph; `label` is always announced to assistive
 * tech, so no destination is communicated by a bare icon.
 */
export type SocialId =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "youtube"
  | "threads";

export type SocialLink = {
  id: SocialId;
  label: string;
  href: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: WHATSAPP.href,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/qualityhearing.pro?stkn=a3pyYm0yeGNyZXJ1",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61594548320379",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/@qualityhearingpro?si=GhaRv6Na_G0CpXue",
  },
  {
    id: "threads",
    label: "Threads",
    href: "https://www.threads.com/@qualityhearing.pro",
  },
];

/**
 * The manager supplied two Facebook profiles. Both are kept so neither is
 * dropped, but the icon row shows only one to avoid two identical glyphs side
 * by side; the second is listed by name in the "Stay Connected" section.
 */
export const FACEBOOK_PAGES: { label: string; href: string }[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61594548320379",
  },
  {
    label: "Facebook — second page",
    href: "https://www.facebook.com/profile.php?id=61594053912124",
  },
];

/**
 * The copy every "Request Home Consultation" CTA sends, so the message the
 * clinic receives is consistent no matter which page the visitor clicked from.
 */
export const HOME_CONSULTATION_MESSAGE =
  "Hello QUALITY Hearing Care, I would like to know more about the Home Consultation service.";

export const homeConsultationHref = WHATSAPP.withMessage(
  HOME_CONSULTATION_MESSAGE,
);

/**
 * The general enquiry CTA. `subject` is a service or topic name ("hearing
 * tests", "hearing aids", a service title) and is folded into the pre-filled
 * message so the clinic can see what the visitor was reading.
 */
export const whatsappEnquiry = (subject: string) =>
  WHATSAPP.withMessage(
    `Hello QUALITY Hearing Care, I would like to know more about ${subject}.`,
  );
