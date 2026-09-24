"use server";

/**
 * Public contact-form action — the one remaining public write path now that the
 * online booking flow has been retired.
 *
 * No session is required, so the action is rate-limited, Zod-validated and
 * server-side only. Nothing here claims an email was sent: the enquiry is
 * stored for the clinic team to pick up.
 */

import { prisma } from "@/server/db/prisma";
import { hit as rateLimitHit } from "@/lib/rate-limit";
import { fieldErrors, mobileSchema } from "@/lib/validation/scheduling";
import { z } from "zod";

export type ContactEnquiryResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Coarse per-IP limiting for public actions (keyed, no PII stored). */
function limited(scope: string, key: string, limit: number, windowMs: number): boolean {
  return rateLimitHit(`${scope}:${key}`, limit, windowMs);
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  mobile: mobileSchema,
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email")])
    .optional()
    .transform((v) => v || undefined),
  interest: z.string().trim().max(60).optional().transform((v) => v || undefined),
  appointmentType: z
    .enum(["CLINIC_VISIT", "HOME_CONSULTATION", "GENERAL"])
    .optional(),
  message: z.string().trim().min(5, "Message is required").max(2000, "Message is too long"),
});

/**
 * Public contact-form submission. No email backend is configured, so the
 * enquiry is stored for admin review — nothing claims an email was sent.
 */
export async function submitContactEnquiry(
  input: unknown,
): Promise<ContactEnquiryResult> {
  if (!limited("contact-enquiry", "global", 10, 60_000)) {
    return { ok: false, error: "Too many submissions. Please wait a minute and try again." };
  }
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  try {
    await prisma.contactEnquiry.create({ data: parsed.data });
    return { ok: true };
  } catch (err) {
    console.error("[contact-enquiry] failed", { message: (err as Error).message });
    return { ok: false, error: "We couldn't save your message. Please call us instead." };
  }
}
