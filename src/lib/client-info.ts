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
