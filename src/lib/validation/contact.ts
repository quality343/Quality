import { z } from "zod";
import { fieldErrors, mobileSchema } from "./scheduling";

/**
 * The public contact form.
 *
 * The form does not send anything itself: it validates what the visitor typed
 * and then hands the text to WhatsApp, where the visitor presses Send. The
 * rules therefore live here — one definition — so the browser can check the
 * fields instantly (before opening WhatsApp) while the server keeps its own
 * copy of the same guarantees for the enquiry it records.
 */

/** The three "This is about" choices, in display order. */
export const CONTACT_APPOINTMENT_TYPES = [
  "CLINIC_VISIT",
  "HOME_CONSULTATION",
  "GENERAL",
] as const;

export type ContactAppointmentType = (typeof CONTACT_APPOINTMENT_TYPES)[number];

/** Display names shared by the radio group, the WhatsApp message and admin. */
export const CONTACT_APPOINTMENT_LABELS: Record<ContactAppointmentType, string> =
  {
    CLINIC_VISIT: "Clinic Visit",
    HOME_CONSULTATION: "Home Consultation",
    GENERAL: "General Enquiry",
  };

export const contactEnquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  mobile: mobileSchema,
  email: z
    .union([
      z.literal(""),
      z.string().trim().toLowerCase().email("Enter a valid email"),
    ])
    .optional()
    .transform((v) => v || undefined),
  interest: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || undefined),
  appointmentType: z.enum(CONTACT_APPOINTMENT_TYPES).optional(),
  message: z
    .string()
    .trim()
    .min(5, "Message is required")
    .max(2000, "Message is too long"),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;

/** Which field failed and why, keyed by input `name` for inline rendering. */
export type ContactEnquiryCheck =
  | { ok: true; data: ContactEnquiryInput }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

/**
 * Validate and normalise a raw contact-form payload. `input` is deliberately
 * `unknown` — it arrives as `FormData` values in the browser and as an
 * action argument on the server, and both paths must run identical rules.
 */
export function checkContactEnquiry(input: unknown): ContactEnquiryCheck {
  const parsed = contactEnquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  return { ok: true, data: parsed.data };
}
