/**
 * Server-side scheduling services. Every function:
 * 1. Verifies authorization via guard utilities (never trusts client role).
 * 2. Validates input with Zod.
 * 3. Enforces business invariants (slot occupancy, branch scoping).
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/service-errors";
import { canAccess, type SessionUser } from "@/lib/auth/guards";
import {
  bookAppointmentSchema,
  canTransition,
  guestBookingSchema,
  slotGenerateSchema,
  type BookAppointmentInput,
  type GuestBookingInput,
} from "@/lib/validation/scheduling";
import { recordAuditEventSafe } from "@/lib/audit";
import { createHash, randomBytes } from "crypto";

// ─── Guest booking (public, no account) ─────────────────────────────────────

/** QHC-XXXXXX public booking reference. */
export function generateBookingRef(): string {
  return `QHC-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Books an appointment for a visitor WITHOUT an account. All availability
 * checks run server-side inside the same transaction as the write, and the
 * unique constraint on Appointment.slotId remains the single source of truth
 * against double-booking.
 *
 * Guest identity: a lightweight Patient row (isGuest, no User). Repeated
 * bookings with the same mobile reuse the same guest row (upsert on phone) so
 * future account linking is a single userId attach.
 *
 * Idempotency: an optional client key makes retries/double-clicks return the
 * original appointment instead of creating a duplicate.
 *
 * Returns the appointment plus a one-time manage token (shown once) that lets
 * the visitor view/cancel this booking without an account.
 */
export async function bookGuestAppointment(raw: unknown) {
  const input = guestBookingSchema.parse(raw) as GuestBookingInput;
  const isHome = input.appointmentType === "HOME_CONSULTATION";

  /** Full detail needed by the confirmation page and notification layer. */
  const detailInclude = {
    patient: { select: { name: true, phone: true, email: true } },
    service: { select: { name: true } },
    branch: { select: { name: true, city: true, address: true, phone: true } },
    slot: { select: { startsAt: true, endsAt: true } },
  } as const;

  // Idempotent replay: same key → return the original booking.
  if (input.idempotencyKey) {
    const existing = await prisma.appointment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: detailInclude,
    });
    if (existing) {
      return { appointment: existing, manageToken: null as string | null };
    }
  }

  // Guest patient (no user account). Normalized mobile is the natural key:
  // the same person booking again reuses their row (single attach point for
  // future account linking), and their latest submitted name/email wins so
  // the clinic always calls the details the visitor just confirmed.
  const guest = await (async () => {
    const found = await prisma.patient.findFirst({
      where: { isGuest: true, phone: input.mobile },
      select: { id: true },
    });
    if (found) {
      return prisma.patient.update({
        where: { id: found.id },
        data: { name: input.name, email: input.email ?? null },
        select: { id: true },
      });
    }
    return prisma.patient.create({
      data: {
        isGuest: true,
        name: input.name,
        phone: input.mobile,
        email: input.email ?? null,
      },
      select: { id: true },
    });
  })();

  // Active services only; branch linkage re-verified per path below.
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, isActive: true },
    select: { id: true },
  });
  if (!service) throw new ValidationError("That service is not available.");

  // ── HOME_CONSULTATION path ──
  // No slot engine for home visits (and none invented): the request carries a
  // preferred date + time window, owned by the clinic branch, and starts as
  // PENDING_CONFIRMATION. Staff confirm the actual visit time afterwards.
  if (isHome) {
    const homeInput = input as Extract<GuestBookingInput, { appointmentType: "HOME_CONSULTATION" }>;
    const [y, m, d] = homeInput.date.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d);
    if (dayStart < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new ValidationError("Please choose today or a future date for your home visit.");
    }

    const homeBranch = await prisma.branch.findFirst({
      where: { isActive: true, homeConsultationsEnabled: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, homeServiceAreas: true, homeMaxPerDay: true },
    });
    if (!homeBranch) {
      throw new ValidationError(
        "Home consultations are not available right now. Please call the clinic.",
      );
    }

    // Optional daily cap (admin-configured; null = no cap configured).
    if (homeBranch.homeMaxPerDay != null) {
      const sameDay = await prisma.appointment.count({
        where: {
          appointmentType: "HOME_CONSULTATION",
          branchId: homeBranch.id,
          status: { not: "CANCELLED" },
          createdAt: { gte: dayStart, lt: new Date(dayStart.getTime() + 86_400_000) },
        },
      });
      if (sameDay >= homeBranch.homeMaxPerDay) {
        throw new ValidationError(
          "Our home-visit schedule is full for that day. Please choose another date or call the clinic.",
        );
      }
    }

    const manageToken = randomBytes(24).toString("base64url");
    const windows = { MORNING: "morning", AFTERNOON: "afternoon", EVENING: "evening" } as const;
    const appt = await prisma.appointment.create({
      data: {
        patientId: guest.id,
        serviceId: homeInput.serviceId,
        branchId: homeBranch.id,
        source: "ONLINE",
        appointmentType: "HOME_CONSULTATION",
        homeAddress: homeInput.homeAddress,
        homeLocality: homeInput.homeLocality,
        homeInstructions: homeInput.homeInstructions ?? null,
        homeConfirmationStatus: "PENDING_CONFIRMATION",
        reason: `Preferred: ${homeInput.date} (${windows[homeInput.timePreference]})${homeInput.note ? ` — ${homeInput.note}` : ""}`,
        bookingRef: generateBookingRef(),
        manageTokenHash: hashToken(manageToken),
        ...(homeInput.idempotencyKey ? { idempotencyKey: homeInput.idempotencyKey } : {}),
      },
    });
    await recordAuditEventSafe({
      action: "APPOINTMENT_BOOKED",
      entityType: "Appointment",
      entityId: appt.id,
      metadata: { source: "GUEST_ONLINE", type: "HOME_CONSULTATION" },
    });
    const detailed = await prisma.appointment.findUniqueOrThrow({
      where: { id: appt.id },
      include: detailInclude,
    });
    return { appointment: detailed, manageToken };
  }

  // ── CLINIC_VISIT path (slot-based) ──
  const clinicInput = input as Extract<GuestBookingInput, { appointmentType: "CLINIC_VISIT" }>;
  const slotId = clinicInput.slotId;

  const manageToken = randomBytes(24).toString("base64url");

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.appointmentSlot.findUnique({
        where: { id: slotId },
        include: { branch: { select: { isActive: true, acceptsOnlineBookings: true } } },
      });
      if (!slot) throw new NotFoundError("Slot not found.");
      if (!slot.branch.isActive || !slot.branch.acceptsOnlineBookings) {
        throw new ValidationError("This branch is not accepting online bookings.");
      }
      if (slot.status !== "OPEN" || slot.startsAt <= new Date()) {
        throw new SlotUnavailableError();
      }
      // Service must be offered at this branch.
      const offered = await tx.branchService.findUnique({
        where: { branchId_serviceId: { branchId: slot.branchId, serviceId: clinicInput.serviceId } },
        select: { isActive: true },
      });
      if (!offered?.isActive) {
        throw new ValidationError("That service is not available at this branch.");
      }

      const appt = await tx.appointment.create({
        data: {
          patientId: guest.id,
          slotId: slot.id,
          serviceId: clinicInput.serviceId,
          branchId: slot.branchId,
          staffId: slot.staffId,
          source: "ONLINE",
          appointmentType: "CLINIC_VISIT",
          reason: clinicInput.note || null,
          bookingRef: generateBookingRef(),
          manageTokenHash: hashToken(manageToken),
          ...(clinicInput.idempotencyKey ? { idempotencyKey: clinicInput.idempotencyKey } : {}),
        },
      });
      await tx.appointmentSlot.update({
        where: { id: slot.id },
        data: { status: "BOOKED" },
      });
      return appt;
    });

    // Guest has no user row → in-app notification is skipped; email/SMS land
    // behind the transport abstraction in a later phase.
    await recordAuditEventSafe({
      action: "APPOINTMENT_BOOKED",
      entityType: "Appointment",
      entityId: appointment.id,
      metadata: { source: "GUEST_ONLINE" },
    });
    const detailed = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: detailInclude,
    });
    if (!detailed) throw new Error("Appointment vanished after creation");
    return { appointment: detailed, manageToken };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Same idempotency key written concurrently → treat as replay.
      if (input.idempotencyKey) {
        const replay = await prisma.appointment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: detailInclude,
        });
        if (replay) return { appointment: replay, manageToken: null };
      }
      throw new SlotUnavailableError();
    }
    throw e;
  }
}

/**
 * Guest self-service lookup: booking reference + manage token. The token is
 * compared by hash, so knowing only the reference grants nothing.
 */
export async function getGuestBookingByRefAndToken(bookingRef: string, token: string) {
  const appt = await prisma.appointment.findUnique({
    where: { bookingRef },
    include: {
      patient: { select: { name: true, phone: true } },
      service: { select: { name: true } },
      branch: { select: { name: true, city: true, address: true, phone: true } },
      slot: { select: { startsAt: true, endsAt: true } },
    },
  });
  if (!appt || !appt.manageTokenHash) return null;
  if (hashToken(token) !== appt.manageTokenHash) return null;
  return appt;
}

/**
 * Guest cancellation via manage token. Only future, non-terminal appointments
 * can be cancelled; the slot is released for rebooking.
 */
export async function cancelGuestBooking(bookingRef: string, token: string) {
  const appt = await prisma.appointment.findUnique({
    where: { bookingRef },
    select: { id: true, status: true, slotId: true, manageTokenHash: true, slot: { select: { startsAt: true } } },
  });
  if (!appt || !appt.manageTokenHash || hashToken(token) !== appt.manageTokenHash) {
    throw new ForbiddenError("This link is not valid for this booking.");
  }
  if (!canTransition(appt.status, "CANCELLED")) {
    throw new ValidationError("This appointment can no longer be cancelled online. Please call the clinic.");
  }
  // Home consultations have no slot; their lifecycle is date-window based.
  if (appt.slot) {
    if (appt.slot.startsAt <= new Date()) {
      throw new ValidationError("This appointment time has passed. Please call the clinic.");
    }
  }
  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appt.id },
      data: { status: "CANCELLED", cancelReason: "Cancelled by patient (online)" },
    }),
    ...(appt.slotId
      ? [prisma.appointmentSlot.update({ where: { id: appt.slotId }, data: { status: "OPEN" } })]
      : []),
  ]);
  await recordAuditEventSafe({
    action: "APPOINTMENT_CANCELLED",
    entityType: "Appointment",
    entityId: appt.id,
    metadata: { actor: "GUEST_SELF_SERVICE" },
  });
  return prisma.appointment.findUnique({
    where: { id: appt.id },
    include: {
      patient: { select: { name: true } },
      service: { select: { name: true } },
      branch: { select: { name: true } },
      slot: { select: { startsAt: true } },
    },
  });
}

/**
 * Staff reschedule: move an appointment to a different open slot atomically.
 * The new slot must be OPEN and in the future; the old slot is released and
 * the new one claimed in one transaction.
 */
export async function rescheduleAppointment(
  user: SessionUser,
  raw: { appointmentId: string; newSlotId: string },
) {
  if (!canAccess(user, "appointment.manage.branch")) {
    throw new ForbiddenError("Not permitted to reschedule appointments.");
  }
  const appointment = await prisma.appointment.findUnique({
    where: { id: raw.appointmentId },
    select: { id: true, status: true, branchId: true, slotId: true },
  });
  if (!appointment) throw new NotFoundError("Appointment not found.");
  await assertBranchAccess(user, appointment.branchId);
  if (!canTransition(appointment.status, "IN_PROGRESS") && appointment.status !== "BOOKED") {
    throw new ValidationError("Only booked appointments can be rescheduled.");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const newSlot = await tx.appointmentSlot.findUnique({ where: { id: raw.newSlotId } });
      if (!newSlot) throw new NotFoundError("New slot not found.");
      if (newSlot.branchId !== appointment.branchId) {
        throw new ValidationError("The new slot must belong to the same branch.");
      }
      if (newSlot.status !== "OPEN" || newSlot.startsAt <= new Date()) {
        throw new SlotUnavailableError();
      }
      await tx.appointmentSlot.update({
        where: { id: appointment.slotId ?? "" },
        data: { status: "OPEN" },
      });
      await tx.appointmentSlot.update({
        where: { id: newSlot.id },
        data: { status: "BOOKED" },
      });
      return tx.appointment.update({
        where: { id: appointment.id },
        data: { slotId: newSlot.id, staffId: newSlot.staffId },
      });
    });
    await recordAuditEventSafe({
      actorId: user.id,
      action: "APPOINTMENT_RESCHEDULED",
      entityType: "Appointment",
      entityId: updated.id,
      metadata: { newSlotId: raw.newSlotId },
    });
    return updated;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new SlotUnavailableError();
    }
    throw e;
  }
}

// ─── Branch scoping ──────────────────────────────────────────────────────────

/** Resolves the staff record for portal users (branch-scoped operations). */
export async function getStaffForUser(userId: string) {
  return prisma.staff.findUnique({ where: { userId } });
}

/**
 * ADMIN/SUPER_ADMIN operate across all branches. Other staff are restricted to
 * their own branch; patients can never manage scheduling.
 */
export async function assertBranchAccess(
  user: SessionUser,
  branchId: string | null | undefined,
): Promise<void> {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return;
  if (user.role === "CLINIC_STAFF" || user.role === "AUDIOLOGIST" || user.role === "THERAPIST") {
    const staff = await getStaffForUser(user.id);
    if (!staff?.branchId) {
      throw new ForbiddenError("Your account is not assigned to a branch yet.");
    }
    if (branchId && staff.branchId !== branchId) {
      throw new ForbiddenError("This record belongs to another branch.");
    }
    return;
  }
  throw new ForbiddenError("Not permitted for scheduling operations.");
}

export async function staffBranchId(user: SessionUser): Promise<string | null> {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return null; // all branches
  const staff = await getStaffForUser(user.id);
  return staff?.branchId ?? null;
}

// ─── Slot generation ─────────────────────────────────────────────────────────

export async function generateSlots(user: SessionUser, raw: unknown) {
  if (
    !canAccess(user, "appointment.manage.branch") &&
    !canAccess(user, "service.manage")
  ) {
    throw new ForbiddenError("Not permitted to generate slots.");
  }
  const input = slotGenerateSchema.parse(raw);
  await assertBranchAccess(user, input.branchId);

  const [y, m, d] = input.date.split("-").map(Number);
  const [sh, sm] = input.startTime.split(":").map(Number);
  const [eh, em] = input.endTime.split(":").map(Number);

  const start = new Date(y, m - 1, d, sh, sm);
  const end = new Date(y, m - 1, d, eh, em);

  // Local server time is IST for this deployment; serialize as UTC instants.
  const slots: { startsAt: Date; endsAt: Date }[] = [];
  for (let t = start.getTime(); t + input.slotMinutes * 60_000 <= end.getTime(); t += input.slotMinutes * 60_000) {
    slots.push({
      startsAt: new Date(t),
      endsAt: new Date(t + input.slotMinutes * 60_000),
    });
  }
  if (slots.length === 0) {
    throw new ValidationError("Slot length does not fit the selected window.");
  }

  // Idempotent: existing (branch, startsAt, staff) rows are kept as-is
  // (status/bookings preserved). A concurrent duplicate create hits the DB
  // unique constraint and is safely ignored.
  let created = 0;
  for (const s of slots) {
    try {
      const existing = await prisma.appointmentSlot.findFirst({
        where: { branchId: input.branchId, startsAt: s.startsAt, staffId: input.staffId ?? null },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.appointmentSlot.create({
        data: {
          branchId: input.branchId,
          staffId: input.staffId ?? null,
          serviceId: input.serviceId ?? null,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
        },
      });
      created += 1;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        continue; // concurrent generation created it first
      }
      throw e;
    }
  }
  return created;
}

// ─── Slot queries ────────────────────────────────────────────────────────────

export type SlotView = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  staffName: string | null;
  serviceName: string | null;
};

/** Open, future slots for a branch (+optional service), soonest first.
 *  A serviceId filter matches slots dedicated to that service AND generic
 *  slots (serviceId null) — generic slots are bookable for any service. */
export async function listOpenSlots(
  branchId: string,
  serviceId?: string,
  limit = 60,
): Promise<SlotView[]> {
  const slots = await prisma.appointmentSlot.findMany({
    where: {
      branchId,
      status: "OPEN",
      startsAt: { gte: new Date() },
      ...(serviceId ? { OR: [{ serviceId }, { serviceId: null }] } : {}),
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: {
      staff: { include: { user: { select: { name: true } } } },
      service: { select: { name: true } },
    },
  });
  return slots.map((s) => ({
    id: s.id,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    staffName: s.staff?.user.name ?? null,
    serviceName: s.service?.name ?? null,
  }));
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export class SlotUnavailableError extends Error {
  constructor() {
    super("That time is no longer available. Please choose another slot.");
    this.name = "SlotUnavailableError";
  }
}

export async function bookAppointment(user: SessionUser, raw: unknown) {
  if (user.role !== "PATIENT" && !canAccess(user, "appointment.manage.branch")) {
    throw new ForbiddenError("Booking is available to patients and staff only.");
  }
  const input = bookAppointmentSchema.parse(raw) as BookAppointmentInput;

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) throw new ForbiddenError("Only patient profiles can book appointments.");

  // The unique constraint on appointments.slotId is the single source of truth
  // against double-booking; P2002 is translated to a friendly error.
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.appointmentSlot.findUnique({
        where: { id: input.slotId },
      });
      if (!slot) throw new NotFoundError("Slot not found.");
      if (slot.status !== "OPEN" || slot.startsAt <= new Date()) {
        throw new SlotUnavailableError();
      }

      const appt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          slotId: slot.id,
          serviceId: input.serviceId,
          branchId: slot.branchId,
          staffId: slot.staffId,
          bookedById: user.id,
          source: "ONLINE",
          reason: input.reason || null,
        },
      });
      await tx.appointmentSlot.update({
        where: { id: slot.id },
        data: { status: "BOOKED" },
      });
      return appt;
    });

    await notify(user.id, {
      type: "APPOINTMENT_BOOKED",
      title: "Appointment booked",
      body: "Your appointment request is confirmed. See your portal for details.",
      entityType: "Appointment",
      entityId: appointment.id,
    });
    return appointment;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new SlotUnavailableError();
    }
    throw e;
  }
}

/** Staff-side booking on behalf of a walk-in or phone patient. */
export async function bookForPatient(
  user: SessionUser,
  raw: { patientId: string } & Record<string, unknown>,
) {
  if (!canAccess(user, "appointment.manage.branch")) {
    throw new ForbiddenError("Not permitted.");
  }
  const input = bookAppointmentSchema.parse(raw);
  const patient = await prisma.patient.findUnique({ where: { id: raw.patientId } });
  if (!patient) throw new NotFoundError("Patient not found.");

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.appointmentSlot.findUnique({ where: { id: input.slotId } });
      if (!slot) throw new NotFoundError("Slot not found.");
      if (slot.status !== "OPEN" || slot.startsAt <= new Date()) {
        throw new SlotUnavailableError();
      }
      const appt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          slotId: slot.id,
          serviceId: input.serviceId,
          branchId: slot.branchId,
          staffId: slot.staffId,
          bookedById: user.id,
          source: "STAFF",
          reason: input.reason || null,
        },
      });
      await tx.appointmentSlot.update({
        where: { id: slot.id },
        data: { status: "BOOKED" },
      });
      return appt;
    });
    // Guest patients have no user row — in-app notification is skipped.
    if (patient?.userId) await notify(patient.userId, {
      type: "APPOINTMENT_BOOKED",
      title: "Appointment booked",
      body: "Your appointment is confirmed. See your portal for details.",
      entityType: "Appointment",
      entityId: appointment.id,
    });
    return appointment;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new SlotUnavailableError();
    }
    throw e;
  }
}

// ─── Status transitions ──────────────────────────────────────────────────────

export async function changeAppointmentStatus(
  user: SessionUser,
  raw: { appointmentId: string; status: string; cancelReason?: string },
) {
  if (!canAccess(user, "appointment.manage.branch")) {
    throw new ForbiddenError("Not permitted to change appointments.");
  }
  const appointment = await prisma.appointment.findUnique({
    where: { id: raw.appointmentId },
    select: { id: true, status: true, branchId: true, patientId: true, slotId: true },
  });
  if (!appointment) throw new NotFoundError("Appointment not found.");
  await assertBranchAccess(user, appointment.branchId);

  if (!canTransition(appointment.status, raw.status)) {
    throw new ValidationError(
      `Cannot move from ${appointment.status} to ${raw.status}.`,
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: raw.status as never,
      cancelReason: raw.status === "CANCELLED" ? raw.cancelReason || null : null,
    },
  });

  // Free the slot when an appointment is cancelled or marked no-show.
  if ((raw.status === "CANCELLED" || raw.status === "NO_SHOW") && appointment.slotId) {
    await prisma.appointmentSlot.update({
      where: { id: appointment.slotId },
      data: { status: "OPEN" },
    });
  }

  await notifyPatientOf(appointment.patientId, {
    type: `APPOINTMENT_${raw.status}`,
    title: `Appointment ${raw.status.toLowerCase().replace("_", " ")}`,
    body: "Your appointment status was updated. Check your portal for details.",
    entityType: "Appointment",
    entityId: appointment.id,
  });
  return updated;
}

// ─── Notifications ───────────────────────────────────────────────────────────

async function notify(
  userId: string,
  n: { type: string; title: string; body: string; entityType?: string; entityId?: string },
) {
  await prisma.notification.create({ data: { userId, ...n } });
}

async function notifyPatientOf(
  patientId: string,
  n: { type: string; title: string; body: string; entityType?: string; entityId?: string },
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { userId: true },
  });
  // Guest patients have no user row — in-app notification is skipped.
  if (patient?.userId) await notify(patient.userId, n);
}
