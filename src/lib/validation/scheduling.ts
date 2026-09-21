import { z } from "zod";

// ─── Slots ───────────────────────────────────────────────────────────────────

/** Generates same-length slots for one branch/day between start and end times. */
export const slotGenerateSchema = z
  .object({
    branchId: z.string().cuid(),
    serviceId: z.string().cuid().optional(),
    staffId: z.string().cuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
    slotMinutes: z.coerce.number().int().min(10).max(240),
  })
  .refine(
    (v) => {
      const [sh, sm] = v.startTime.split(":").map(Number);
      const [eh, em] = v.endTime.split(":").map(Number);
      return sh * 60 + sm < eh * 60 + em;
    },
    { message: "End time must be after start time", path: ["endTime"] },
  );
export type SlotGenerateInput = z.infer<typeof slotGenerateSchema>;

export const slotToggleSchema = z.object({
  slotId: z.string().cuid(),
});

// ─── Booking ─────────────────────────────────────────────────────────────────

export const bookAppointmentSchema = z.object({
  slotId: z.string().cuid(),
  serviceId: z.string().cuid(),
  reason: z.string().trim().max(300, "Reason is too long").optional(),
});
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

/** Indian mobile: normalizes spaces/dashes/+91 prefix, then validates. */
export const mobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+91/, "").replace(/^\+/, ""))
  .pipe(z.string().regex(/^(91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));

/** Public booking reference format (QHC-XXXXXXXX). */
export const bookingRefSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^QHC-[0-9A-F]{8}$/, "Enter the appointment number from your confirmation");

/**
 * Public guest booking (no account required). Two appointment types:
 * CLINIC_VISIT books a branch slot; HOME_CONSULTATION requests a visit to the
 * patient's address (never published; visible to authorized staff only).
 * Mobile is normalized to Indian 10-digit form; email and note are optional
 * and length-limited. The idempotency key (generated client-side per booking
 * attempt) makes retried submissions return the original appointment.
 */
export const appointmentTypeSchema = z.enum(["CLINIC_VISIT", "HOME_CONSULTATION"]);

export const guestBookingSchema = z.discriminatedUnion("appointmentType", [
  z.object({
    appointmentType: z.literal("CLINIC_VISIT"),
    slotId: z.string().cuid(),
    serviceId: z.string().cuid(),
    name: z.string().trim().min(2, "Name is required").max(100),
    mobile: mobileSchema,
    email: z
      .union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email")])
      .optional()
      .transform((v) => v || undefined),
    note: z.string().trim().max(300, "Note is too long").optional().transform((v) => v || undefined),
    idempotencyKey: z.string().trim().min(8).max(64).optional(),
  }),
  z.object({
    appointmentType: z.literal("HOME_CONSULTATION"),
    serviceId: z.string().cuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a preferred date"),
    timePreference: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
    name: z.string().trim().min(2, "Name is required").max(100),
    mobile: mobileSchema,
    email: z
      .union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email")])
      .optional()
      .transform((v) => v || undefined),
    homeAddress: z.string().trim().min(10, "Enter your full home address").max(400),
    homeLocality: z.string().trim().min(2, "Enter your area or locality").max(200),
    homeInstructions: z.string().trim().max(300, "Instructions are too long").optional().transform((v) => v || undefined),
    note: z.string().trim().max(300, "Note is too long").optional().transform((v) => v || undefined),
    idempotencyKey: z.string().trim().min(8).max(64).optional(),
  }),
]);
export type GuestBookingInput = z.infer<typeof guestBookingSchema>;

/**
 * Guest self-service lookup: booking reference + the mobile number used at
 * booking. Both factors are required — knowing only the reference grants
 * nothing. Returns a view-only summary; cancellation additionally requires
 * the private manage token issued on the confirmation page.
 */
export const bookingLookupSchema = z.object({
  ref: bookingRefSchema,
  mobile: mobileSchema,
});

// ─── Appointment status ──────────────────────────────────────────────────────

export const APPOINTMENT_TRANSITIONS = {
  BOOKED: ["CHECKED_IN", "IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
} as const satisfies Record<string, readonly string[]>;

export type AppointmentStatusName = keyof typeof APPOINTMENT_TRANSITIONS;

export function canTransition(from: string, to: string): boolean {
  const allowed = APPOINTMENT_TRANSITIONS[from as AppointmentStatusName];
  return allowed?.includes(to as never) ?? false;
}

export const appointmentStatusSchema = z.object({
  appointmentId: z.string().cuid(),
  status: z.enum(["CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  cancelReason: z.string().trim().max(300).optional(),
});

// ─── Branches & services (admin) ─────────────────────────────────────────────

/**
 * Clinic information (single-clinic product). Includes the public-visibility
 * switches and the confirmed home-consultation settings — the clinic configures
 * these itself; the site never invents timings, a service radius or a
 * guaranteed visit.
 */
export const branchUpsertSchema = z.object({
  id: z.string().cuid().optional(),
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(20, "Code is too long")
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only")
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2, "Name is required").max(120),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  acceptsOnlineBookings: z.coerce.boolean().default(true),
  homeConsultationsEnabled: z.coerce.boolean().default(false),
  homeConsultationNote: z.string().trim().max(300, "Note is too long").optional().or(z.literal("")),
  homeServiceAreas: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
  homeMaxPerDay: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce.number().int().min(1, "At least 1").max(200, "Too many").nullable(),
  ),
});
export type BranchUpsertInput = z.infer<typeof branchUpsertSchema>;

export const serviceUpsertSchema = z.object({
  id: z.string().cuid().optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only")
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  category: z.enum(["DIAGNOSTIC", "HEARING_TEST", "HEARING_AID", "THERAPY", "COCHLEAR"]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(10).max(480).default(30),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().default(true),
});
export type ServiceUpsertInput = z.infer<typeof serviceUpsertSchema>;

export const branchServiceToggleSchema = z.object({
  branchId: z.string().cuid(),
  serviceId: z.string().cuid(),
  isActive: z.boolean(),
});

/** Flatten a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
