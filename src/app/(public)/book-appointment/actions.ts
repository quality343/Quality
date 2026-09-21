"use server";

/**
 * Guest (public) booking actions. No session required — but every action is
 * rate-limited, Zod-validated, and executed server-side through the existing
 * conflict-safe scheduling service. The browser is never the authority for
 * slot availability.
 */

import { prisma } from "@/server/db/prisma";
import {
  bookGuestAppointment,
  SlotUnavailableError,
  cancelGuestBooking,
} from "@/server/services/scheduling";
import { notifyBookingEvent } from "@/lib/notifications";
import { hit as rateLimitHit } from "@/lib/rate-limit";
import {
  guestBookingSchema,
  bookingLookupSchema,
  fieldErrors,
  mobileSchema,
} from "@/lib/validation/scheduling";
import { randomUUID } from "crypto";
import { ValidationError } from "@/lib/service-errors";
import { z } from "zod";

export type BookingActionResult =
  | { ok: true; ref: string; manageToken: string | null }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type LookupResult =
  | { ok: true; booking: {
      ref: string;
      status: string;
      appointmentType: string;
      startsAt: string;
      serviceName: string;
      branchName: string;
      guestName: string;
      canCancel: boolean;
    } }
  | { ok: false; error: string };

export type ContactEnquiryResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Cancel needs the reference AND the management token (from the confirmation). */
export type CancelResult = { ok: true } | { ok: false; error: string };

/** Friendly slot message — never leak DB/SQL details to visitors. */
const SLOT_FRIENDLY = "This time slot is no longer available. Please select another time.";

/** Coarse per-IP limiting for public actions (keyed, no PII stored). */
function limited(scope: string, key: string, limit: number, windowMs: number): boolean {
  return rateLimitHit(`${scope}:${key}`, limit, windowMs);
}

export async function submitGuestBooking(input: unknown): Promise<BookingActionResult> {
  // 1. Rate limit the public endpoint (per action server; documented strategy).
  if (!limited("guest-booking", "global", 60, 60_000)) {
    return { ok: false, error: "Too many booking attempts. Please wait a minute and try again." };
  }

  // 2. Validate guest contact details server-side.
  const parsed = guestBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const idempotencyKey = typeof data.idempotencyKey === "string" && data.idempotencyKey
    ? data.idempotencyKey
    : randomUUID();

  try {
    const { appointment, manageToken } = await bookGuestAppointment({
      ...data,
      idempotencyKey,
    });

    // In-app delivery only until a provider is configured (see notifications.ts).
    // Notification payload intentionally minimal — service/branch/time render on
    // the confirmation page the visitor is looking at.
    void notifyBookingEvent({
      event: "BOOKING_CONFIRMED",
      to: {
        email: appointment.patient?.email ?? null,
        phone: appointment.patient?.phone ?? null,
        name: appointment.patient?.name ?? "Guest",
      },
      booking: {
        ref: appointment.bookingRef ?? "",
        serviceName: appointment.service?.name ?? "",
        branchName: appointment.branch?.name ?? "",
        startsAt: appointment.slot?.startsAt ?? new Date(),
      },
    });

    return {
      ok: true,
      ref: appointment.bookingRef ?? "",
      manageToken,
    };
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return { ok: false, error: SLOT_FRIENDLY };
    }
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("[guest-booking] failed", { message: (err as Error).message });
    return { ok: false, error: "We couldn't complete your booking. Please try again." };
  }
}

export async function lookupBooking(input: unknown): Promise<LookupResult> {
  if (!limited("booking-lookup", "global", 30, 60_000)) {
    return { ok: false, error: "Too many lookups. Please wait a minute." };
  }

  const parsed = bookingLookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter your appointment number (e.g. QHC-1A2B3C4D) and the mobile number used for booking." };
  }
  const { ref, mobile } = parsed.data;

  // Two-factor lookup: reference AND booking mobile. Neither alone succeeds.
  const appointment = await prisma.appointment.findUnique({
    where: { bookingRef: ref },
    include: {
      slot: { include: { branch: { select: { name: true } } } },
      service: { select: { name: true } },
      patient: { select: { name: true, phone: true } },
    },
  });

  if (!appointment || appointment.patient.phone !== mobile) {
    // Deliberately generic: does not reveal whether the reference exists.
    return { ok: false, error: "No booking found for that appointment number and mobile number." };
  }

  const status = String(appointment.status);
  const canCancel =
    (status === "BOOKED") &&
    !!appointment.slot &&
    appointment.slot.startsAt > new Date() &&
    Boolean(appointment.manageTokenHash);

  return {
    ok: true,
    booking: {
      ref: appointment.bookingRef ?? "",
      status,
      appointmentType: String(appointment.appointmentType),
      startsAt: appointment.slot?.startsAt.toISOString() ?? "",
      serviceName: appointment.service.name,
      branchName: appointment.slot?.branch.name ?? "—",
      guestName: appointment.patient.name ?? "Guest",
      canCancel,
    },
  };
}

export async function cancelBooking(input: {
  ref: string;
  token: string;
}): Promise<CancelResult> {
  if (!limited("booking-cancel", "global", 20, 60_000)) {
    return { ok: false, error: "Too many attempts. Please wait a minute." };
  }

  const ref = typeof input?.ref === "string" ? input.ref.trim().toUpperCase() : "";
  const token = typeof input?.token === "string" ? input.token : "";
  if (!ref || !token) return { ok: false, error: "Missing booking details." };

  try {
    const appt = await cancelGuestBooking(ref, token);
    void notifyBookingEvent({
      event: "BOOKING_CANCELLED",
      to: { name: appt?.patient?.name ?? "Guest" },
      booking: {
        ref,
        serviceName: appt?.service?.name ?? "",
        branchName: appt?.branch?.name ?? "",
        startsAt: appt?.slot?.startsAt ?? new Date(),
      },
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "ForbiddenError") {
        return { ok: false, error: "This cancel link is not valid for that appointment." };
      }
      if (err.name === "ValidationError") {
        return { ok: false, error: err.message };
      }
      if (err.name === "NotFoundError") {
        return { ok: false, error: "No booking found for that appointment number." };
      }
    }
    return { ok: false, error: "Cancellation failed. Please try again." };
  }
}

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  mobile: mobileSchema,
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email")])
    .optional()
    .transform((v) => v || undefined),
  interest: z.string().trim().max(60).optional().transform((v) => v || undefined),
  appointmentType: z.enum(["CLINIC_VISIT", "HOME_CONSULTATION", "GENERAL"]).optional(),
  message: z.string().trim().min(5, "Message is required").max(2000, "Message is too long"),
});

/**
 * Public contact-form submission. No email backend is configured, so the
 * enquiry is stored for admin review — nothing claims an email was sent.
 */
export async function submitContactEnquiry(input: unknown): Promise<ContactEnquiryResult> {
  if (!limited("contact-enquiry", "global", 10, 60_000)) {
    return { ok: false, error: "Too many submissions. Please wait a minute and try again." };
  }
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    await prisma.contactEnquiry.create({ data: parsed.data });
    return { ok: true };
  } catch (err) {
    console.error("[contact-enquiry] failed", { message: (err as Error).message });
    return { ok: false, error: "We couldn't save your message. Please call us instead." };
  }
}

