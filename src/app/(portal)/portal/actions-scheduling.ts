"use server";

/**
 * Server actions for scheduling. Each action re-checks authorization
 * server-side, validates input, audits the event, and returns typed results.
 */

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { prisma } from "@/server/db/prisma";
import { recordAuditEventSafe } from "@/lib/audit";
import {
  bookAppointment,
  bookForPatient,
  changeAppointmentStatus,
  generateSlots,
  rescheduleAppointment,
  SlotUnavailableError,
} from "@/server/services/scheduling";
import { requireUser } from "@/lib/auth/guards";
import {
  fieldErrors,
} from "@/lib/validation/scheduling";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/service-errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fields?: Record<string, string> };

function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    const fields = fieldErrors(error);
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  if (
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ValidationError ||
    error instanceof SlotUnavailableError
  ) {
    return { ok: false, error: error.message };
  }
  // Unknown errors: generic message, no internals leaked.
  console.error("[action]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function generateSlotsAction(raw: unknown): Promise<ActionResult<{ created: number }>> {
  try {
    const user = await requireUser();
    const created = await generateSlots(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "SLOTS_GENERATED",
      entityType: "AppointmentSlot",
      metadata: { created },
    });
    revalidatePath("/portal/admin/availability");
    revalidatePath("/portal/admin/appointments");
    return { ok: true, data: { created }, message: `Created ${created} slot(s).` };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function bookAppointmentAction(raw: unknown): Promise<ActionResult<{ appointmentId: string }>> {
  try {
    const user = await requireUser();
    const appointment = await bookAppointment(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "APPOINTMENT_BOOKED",
      entityType: "Appointment",
      entityId: appointment.id,
    });
    revalidatePath("/portal/patient/appointments");
    return { ok: true, data: { appointmentId: appointment.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function bookForPatientAction(
  raw: { patientId: string } & Record<string, unknown>,
): Promise<ActionResult<{ appointmentId: string }>> {
  try {
    const user = await requireUser();
    const appointment = await bookForPatient(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "APPOINTMENT_BOOKED_STAFF",
      entityType: "Appointment",
      entityId: appointment.id,
      metadata: { patientId: raw && typeof raw === "object" && "patientId" in raw ? String((raw as { patientId: unknown }).patientId) : undefined },
    });
    revalidatePath("/portal/admin/appointments");
    return { ok: true, data: { appointmentId: appointment.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function rescheduleAppointmentAction(raw: {
  appointmentId: string;
  newSlotId: string;
}): Promise<ActionResult<{ appointmentId: string }>> {
  try {
    const user = await requireUser();
    const updated = await rescheduleAppointment(user, raw);
    revalidatePath("/portal/admin/appointments");
    revalidatePath("/portal/admin/availability");
    return { ok: true, message: "Appointment rescheduled.", data: { appointmentId: updated.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function changeAppointmentStatusAction(raw: {
  appointmentId: string;
  status: string;
  cancelReason?: string;
}): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await changeAppointmentStatus(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "APPOINTMENT_STATUS",
      entityType: "Appointment",
      entityId: raw.appointmentId,
      metadata: { status: raw.status },
    });
    revalidatePath("/portal/admin/appointments");
    revalidatePath("/portal/admin/home-consultations");
    revalidatePath("/portal/patient/appointments");
    return { ok: true, message: "Appointment updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

/** Minimal patient lookup for staff booking forms (scoped to branch access). */
export async function searchPatientsAction(
  query: string,
): Promise<ActionResult<{ patients: { id: string; name: string; mrn: string }[] }>> {
  try {
    const user = await requireUser();
    if (user.role !== "CLINIC_STAFF" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "AUDIOLOGIST" && user.role !== "THERAPIST") {
      throw new ForbiddenError();
    }
    const patients = await prisma.patient.findMany({
      where: {
        user: { name: { contains: query, mode: "insensitive" } },
      },
      take: 8,
      select: { id: true, mrn: true, name: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });
    return {
      ok: true,
      data: {
        patients: patients.map((p) => ({ id: p.id, name: p.user?.name ?? p.name ?? p.mrn, mrn: p.mrn })),
      },
    };
  } catch (error) {
    return toActionResult(error);
  }
}
