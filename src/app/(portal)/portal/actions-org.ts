"use server";

/** Admin CRUD actions for branches and services (permission-gated). */

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/server/db/prisma";
import { recordAuditEventSafe } from "@/lib/audit";
import { canAccess, requireUser } from "@/lib/auth/guards";
import { ForbiddenError, ValidationError } from "@/lib/service-errors";
import {
  branchUpsertSchema,
  branchServiceToggleSchema,
  fieldErrors,
  serviceUpsertSchema,
} from "@/lib/validation/scheduling";
import type { ActionResult } from "./actions-scheduling";

function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(error) };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, error: "A record with that code already exists." };
  }
  if (error instanceof ForbiddenError || error instanceof ValidationError) {
    return { ok: false, error: error.message };
  }
  console.error("[org-action]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function branchUpsertAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "branch.manage")) throw new ForbiddenError();
    const input = branchUpsertSchema.parse(raw);

    // Clinic information, including the switches that decide what the public
    // website may offer (online booking, home consultation configuration).
    const data = {
      code: input.code,
      name: input.name,
      city: input.city || null,
      address: input.address || null,
      phone: input.phone || null,
      isActive: input.isActive,
      acceptsOnlineBookings: input.acceptsOnlineBookings,
      homeConsultationsEnabled: input.homeConsultationsEnabled,
      homeConsultationNote: input.homeConsultationNote || null,
      homeServiceAreas: input.homeServiceAreas || null,
      homeMaxPerDay: input.homeMaxPerDay,
    };

    const branch = input.id
      ? await prisma.branch.update({ where: { id: input.id }, data })
      : await prisma.branch.create({ data });

    await recordAuditEventSafe({
      actorId: user.id,
      action: input.id ? "BRANCH_UPDATED" : "BRANCH_CREATED",
      entityType: "Branch",
      entityId: branch.id,
    });
    revalidatePath("/portal/admin/branches");
    revalidatePath("/branches");
    revalidatePath("/contact");
    revalidatePath("/home-consultation");
    revalidatePath("/book-appointment");
    return { ok: true, data: { id: branch.id }, message: "Branch saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function serviceUpsertAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "service.manage")) throw new ForbiddenError();
    const input = serviceUpsertSchema.parse(raw);

    const service = input.id
      ? await prisma.service.update({
          where: { id: input.id },
          data: {
            code: input.code,
            name: input.name,
            category: input.category,
            description: input.description || null,
            durationMinutes: input.durationMinutes,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
          },
        })
      : await prisma.service.create({
          data: {
            code: input.code,
            name: input.name,
            category: input.category,
            description: input.description || null,
            durationMinutes: input.durationMinutes,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
          },
        });

    await recordAuditEventSafe({
      actorId: user.id,
      action: input.id ? "SERVICE_UPDATED" : "SERVICE_CREATED",
      entityType: "Service",
      entityId: service.id,
    });
    revalidatePath("/portal/admin/services");
    revalidatePath("/services");
    return { ok: true, data: { id: service.id }, message: "Service saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function branchServiceToggleAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "service.manage") && !canAccess(user, "branch.manage")) {
      throw new ForbiddenError();
    }
    const input = branchServiceToggleSchema.parse(raw);
    await prisma.branchService.upsert({
      where: { branchId_serviceId: { branchId: input.branchId, serviceId: input.serviceId } },
      create: { branchId: input.branchId, serviceId: input.serviceId, isActive: input.isActive },
      update: { isActive: input.isActive },
    });
    await recordAuditEventSafe({
      actorId: user.id,
      action: "BRANCH_SERVICE_TOGGLED",
      entityType: "BranchService",
      metadata: { branchId: input.branchId, serviceId: input.serviceId, active: input.isActive },
    });
    revalidatePath("/portal/admin/branches");
    revalidatePath("/services");
    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}
