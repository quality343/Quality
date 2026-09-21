/**
 * Read-side queries for portal dashboards and lists. All patient-scoped reads
 * are filtered by the session user's own ids — never by client-supplied ids.
 */

import { prisma } from "@/server/db/prisma";
import { staffBranchId } from "./scheduling";
import type { SessionUser } from "@/lib/auth/guards";

// ─── Catalogue ───────────────────────────────────────────────────────────────

export function listBranches(activeOnly = true) {
  return prisma.branch.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { name: "asc" },
  });
}

export function listServices(activeOnly = true) {
  return prisma.service.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listBranchServices(branchId: string) {
  return prisma.branchService.findMany({
    where: { branchId, isActive: true },
    include: { service: { select: { name: true, category: true, durationMinutes: true } } },
  });
}

// ─── Appointments ────────────────────────────────────────────────────────────

const APPOINTMENT_INCLUDE = {
  patient: { select: { id: true, mrn: true, name: true, phone: true, email: true, isGuest: true, user: { select: { name: true } } } },
  service: { select: { name: true, category: true } },
  branch: { select: { name: true, code: true } },
  staff: { include: { user: { select: { name: true } } } },
  slot: { select: { startsAt: true, endsAt: true } },
} as const;

/** Branch-scoped appointment list for clinic/admin worklists. */
export async function listAppointmentsForStaff(user: SessionUser, day?: Date) {
  const branchId = await staffBranchId(user);
  const startOfDay = day ? new Date(day.getFullYear(), day.getMonth(), day.getDate()) : undefined;
  const endOfDay = startOfDay ? new Date(startOfDay.getTime() + 86_400_000) : undefined;

  return prisma.appointment.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(startOfDay && endOfDay ? { slot: { startsAt: { gte: startOfDay, lt: endOfDay } } } : {}),
    },
    orderBy: { slot: { startsAt: "asc" } },
    take: 100,
    include: APPOINTMENT_INCLUDE,
  });
}

export type AppointmentSearch = {
  q?: string;
  branchId?: string;
  serviceId?: string;
  status?: string;
  date?: string;
  /** Date-preset filter: today | tomorrow | upcoming | past */
  when?: string;
  /** Appointment type filter: CLINIC_VISIT | HOME_CONSULTATION */
  type?: string;
  /** Booking reference search (QHC-XXXXXXXX). */
};

function displayName(p: {
  name: string | null;
  isGuest: boolean;
  user: { name: string } | null;
}): string {
  if (p.user?.name) return p.user.name;
  if (p.name) return p.name;
  return "Guest";
}

/**
 * Filtered appointment list for admin worklists. Search matches guest or
 * registered patient name, mobile, and booking reference. ADMIN / SUPER_ADMIN
 * see all branches.
 */
export async function searchAppointmentsForStaff(opts: AppointmentSearch) {
  const where: Record<string, unknown> = {
    ...(opts.branchId ? { branchId: opts.branchId } : {}),
    ...(opts.serviceId ? { serviceId: opts.serviceId } : {}),
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.type ? { appointmentType: opts.type } : {}),
  };

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  if (opts.when === "today") {
    where.slot = { startsAt: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86_400_000) } };
  } else if (opts.when === "tomorrow") {
    const t = new Date(startOfToday.getTime() + 86_400_000);
    where.slot = { startsAt: { gte: t, lt: new Date(t.getTime() + 86_400_000) } };
  } else if (opts.when === "upcoming") {
    where.OR = [
      { slot: { startsAt: { gte: startOfToday } } },
      { AND: [{ appointmentType: "HOME_CONSULTATION" }, { status: "BOOKED" }] },
    ];
  } else if (opts.when === "past") {
    where.slot = { startsAt: { lt: startOfToday } };
  }

  if (opts.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date)) {
    const [y, m, d] = opts.date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(start.getTime() + 86_400_000);
    where.slot = { startsAt: { gte: start, lt: end } };
  }

  if (opts.q?.trim()) {
    const q = opts.q.trim();
    const refMatch = /^QHC-[0-9A-F]{8}$/i.test(q) ? q.toUpperCase() : null;
    where.OR = [
      { patient: { name: { contains: q, mode: "insensitive" } } },
      { patient: { user: { name: { contains: q, mode: "insensitive" } } } },
      { patient: { phone: { contains: q } } },
      { patient: { user: { phone: { contains: q } } } },
      ...(refMatch ? [{ bookingRef: refMatch }] : []),
    ];
  }

  if (opts.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date)) {
    const [y, m, d] = opts.date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(start.getTime() + 86_400_000);
    where.slot = { startsAt: { gte: start, lt: end } };
  }

  const rows = await prisma.appointment.findMany({
    where: where as never,
    orderBy: { slot: { startsAt: "desc" } },
    take: 200,
    include: APPOINTMENT_INCLUDE,
  });

  return rows.map((a) => ({
    id: a.id,
    status: String(a.status),
    when: a.slot?.startsAt.toLocaleString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) ?? "—",
    whenISO: a.slot?.startsAt.toISOString() ?? "",
    patient: displayName(a.patient),
    mrn: a.patient.mrn,
    isGuest: a.patient.isGuest,
    mobile: a.patient.phone,
    service: a.service.name,
    branch: a.branch.name,
    provider: a.staff?.user.name ?? "Any",
    source: String(a.source),
    ref: a.bookingRef ?? null,
    appointmentType: String(a.appointmentType),
    homeLocality: a.homeLocality,
    homeAddress: a.homeAddress,
    homeInstructions: a.homeInstructions,
    homeConfirmationStatus: a.homeConfirmationStatus ? String(a.homeConfirmationStatus) : null,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
    email: a.patient.email,
  }));
}

/** One patient's appointments (self only — id resolved from session). */
export async function listAppointmentsForPatientUser(userId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!patient) return [];
  return prisma.appointment.findMany({
    where: { patientId: patient.id },
    orderBy: { slot: { startsAt: "desc" } },
    take: 50,
    include: APPOINTMENT_INCLUDE,
  });
}

export async function countAppointmentsToday(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);
  return prisma.appointment.count({
    where: { slot: { startsAt: { gte: start, lt: end } } },
  });
}

export async function countOpenSlots(): Promise<number> {
  return prisma.appointmentSlot.count({
    where: { status: "OPEN", startsAt: { gte: new Date() } },
  });
}

// ─── Clinical reads (deferred module — minimal read paths) ───────────────────

export async function listAssessmentsForStaff(user: SessionUser) {
  const branchId = await staffBranchId(user);
  return prisma.hearingAssessment.findMany({
    where: branchId ? { branchId } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      patient: { select: { mrn: true, name: true, isGuest: true, user: { select: { name: true } } } },
      audiologist: { include: { user: { select: { name: true } } } },
      _count: { select: { testResults: true } },
    },
  });
}

export async function listAssessmentsForPatientUser(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) return [];
  return prisma.hearingAssessment.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { testResults: true },
  });
}

export async function listReportsForPatientUser(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) return [];
  return prisma.report.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─── Notifications ─────────────────────────────────────────────────────

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

// ─── Patient lookups (portal) ────────────────────────────────────────────────

export async function getPatientByUserId(userId: string) {
  return prisma.patient.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
}
