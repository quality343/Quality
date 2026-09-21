/**
 * Server-side data loading for the public booking wizard. Only active branches
 * that accept online bookings and active services actually offered at that
 * branch are exposed. No pricing or internal fields.
 */
import { prisma } from "@/server/db/prisma";

export type BranchOption = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  homeConsultationsEnabled: boolean;
  homeConsultationNote: string | null;
};

export type ServiceOption = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  durationMinutes: number;
};

/** Branches accepting public online bookings, regardless of any URL param. */
export async function listBookingBranches(): Promise<BranchOption[]> {
  const rows = await prisma.branch.findMany({
    where: { isActive: true, acceptsOnlineBookings: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      city: true,
      address: true,
      phone: true,
      homeConsultationsEnabled: true,
      homeConsultationNote: true,
    },
  });
  return rows;
}

/**
 * Active services offered at the branch. `preselectedServiceId` is only kept
 * if it is genuinely offered here — URL params are never trusted (spec 16).
 */
export async function listBranchServiceOptions(
  branchId: string,
  preselectedServiceId?: string,
): Promise<{ services: ServiceOption[]; preselectValid: boolean }> {
  const rows = await prisma.branchService.findMany({
    where: { branchId, isActive: true, service: { isActive: true } },
    orderBy: { service: { sortOrder: "asc" } },
    select: {
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          durationMinutes: true,
        },
      },
    },
  });
  const services = rows.map((r) => r.service);
  const preselectValid =
    !!preselectedServiceId && services.some((s) => s.id === preselectedServiceId);
  return { services, preselectValid };
}
