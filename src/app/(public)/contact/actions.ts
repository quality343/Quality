"use server";

/**
 * Public contact-form action — the one remaining public write path now that the
 * online booking flow has been retired.
 *
 * The form itself sends nothing: it opens WhatsApp with the visitor's text
 * pre-filled, and the visitor presses Send there. This action exists purely to
 * keep a record of the enquiry for the clinic, so a visitor who cannot complete
 * the WhatsApp handoff is still reachable. Nothing here claims an email or a
 * WhatsApp message was sent — the UI says "Continue in WhatsApp" for that
 * reason.
 */

import { prisma } from "@/server/db/prisma";
import { hit as rateLimitHit } from "@/lib/rate-limit";
import { checkContactEnquiry } from "@/lib/validation/contact";

export type ContactEnquiryResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Coarse per-IP limiting for public actions (keyed, no PII stored). */
function limited(scope: string, key: string, limit: number, windowMs: number): boolean {
  return rateLimitHit(`${scope}:${key}`, limit, windowMs);
}

/**
 * Record a contact-form enquiry. Validation runs against the same schema the
 * browser used, so a hand-crafted call cannot store anything the form would
 * have rejected.
 */
export async function submitContactEnquiry(
  input: unknown,
): Promise<ContactEnquiryResult> {
  if (!limited("contact-enquiry", "global", 10, 60_000)) {
    return { ok: false, error: "Too many submissions. Please wait a minute and try again." };
  }
  const checked = checkContactEnquiry(input);
  if (!checked.ok) {
    return { ok: false, error: checked.error, fieldErrors: checked.fieldErrors };
  }
  try {
    await prisma.contactEnquiry.create({ data: checked.data });
    return { ok: true };
  } catch (err) {
    console.error("[contact-enquiry] failed", { message: (err as Error).message });
    return { ok: false, error: "We couldn't save your message. Please call us instead." };
  }
}
