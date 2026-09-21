"use server";

/** Admin catalogue & inventory administration (permission: aid.catalogue.manage). */

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/server/db/prisma";
import { recordAuditEventSafe } from "@/lib/audit";
import { canAccess, requireUser } from "@/lib/auth/guards";
import { ForbiddenError, ValidationError } from "@/lib/service-errors";
import { fieldErrors } from "@/lib/validation/hearingaid";
import {
  brandUpsertSchema,
  inventoryItemUpsertSchema,
  inventoryStatusSchema,
  modelUpsertSchema,
} from "@/lib/validation/hearingaid";
import type { ActionResult } from "./actions-scheduling";

function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(error) };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, error: "A record with that unique code/name already exists." };
  }
  if (error instanceof ForbiddenError || error instanceof ValidationError) {
    return { ok: false, error: error.message };
  }
  console.error("[catalogue-action]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function brandUpsertAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "aid.catalogue.manage")) throw new ForbiddenError();
    const input = brandUpsertSchema.parse(raw);

    const brand = input.id
      ? await prisma.hearingAidBrand.update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description || null,
            website: input.website || null,
            logoUrl: input.logoUrl || null,
            isActive: input.isActive,
          },
        })
      : await prisma.hearingAidBrand.create({
          data: {
            name: input.name,
            description: input.description || null,
            website: input.website || null,
            logoUrl: input.logoUrl || null,
            isActive: input.isActive,
          },
        });

    await recordAuditEventSafe({
      actorId: user.id,
      action: input.id ? "AID_BRAND_UPDATED" : "AID_BRAND_CREATED",
      entityType: "HearingAidBrand",
      entityId: brand.id,
    });
    revalidatePath("/portal/admin/hearing-aids");
    revalidatePath("/hearing-aids");
    return { ok: true, data: { id: brand.id }, message: "Brand saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function modelUpsertAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "aid.catalogue.manage")) throw new ForbiddenError();
    const input = modelUpsertSchema.parse(raw);

    const model = await prisma.$transaction(async (tx) => {
      const data = {
        brandId: input.brandId,
        modelName: input.modelName,
        modelCode: input.modelCode,
        deviceType: input.deviceType,
        technologyLevel: input.technologyLevel,
        description: input.description || null,
        priceInr: input.priceInr ?? null,
        warrantyMonths: input.warrantyMonths ?? null,
        status: input.status,
      };
      const m = input.id
        ? await tx.hearingAidModel.update({ where: { id: input.id }, data })
        : await tx.hearingAidModel.create({ data });

      if (input.id) {
        await tx.hearingAidModelFeature.deleteMany({ where: { modelId: m.id } });
      }
      if (input.featureKeys.length > 0) {
        const features = await tx.hearingAidFeature.findMany({
          where: { key: { in: input.featureKeys } },
          select: { id: true },
        });
        // SQLite (Turso) does not support `skipDuplicates` on createMany, so
        // features already linked to this model are filtered out first. The
        // result is the same idempotent outcome, just made explicit.
        const alreadyLinked = await tx.hearingAidModelFeature.findMany({
          where: { modelId: m.id },
          select: { featureId: true },
        });
        const linkedIds = new Set(alreadyLinked.map((l) => l.featureId));
        const toLink = [...new Set(features.map((f) => f.id))].filter((id) => !linkedIds.has(id));
        if (toLink.length > 0) {
          await tx.hearingAidModelFeature.createMany({
            data: toLink.map((featureId) => ({ modelId: m.id, featureId })),
          });
        }
      }
      return m;
    });

    await recordAuditEventSafe({
      actorId: user.id,
      action: input.id ? "AID_MODEL_UPDATED" : "AID_MODEL_CREATED",
      entityType: "HearingAidModel",
      entityId: model.id,
    });
    revalidatePath("/portal/admin/hearing-aids");
    revalidatePath("/hearing-aids");
    return { ok: true, data: { id: model.id }, message: "Model saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function modelStatusAction(raw: { modelId: string; status: "ACTIVE" | "INACTIVE" }): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "aid.catalogue.manage")) throw new ForbiddenError();
    await prisma.hearingAidModel.update({
      where: { id: raw.modelId },
      data: { status: raw.status },
    });
    await recordAuditEventSafe({
      actorId: user.id,
      action: raw.status === "ACTIVE" ? "AID_MODEL_ACTIVATED" : "AID_MODEL_DEACTIVATED",
      entityType: "HearingAidModel",
      entityId: raw.modelId,
    });
    revalidatePath("/portal/admin/hearing-aids");
    revalidatePath("/hearing-aids");
    return { ok: true, message: `Model ${raw.status.toLowerCase()}.` };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function inventoryItemUpsertAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "aid.catalogue.manage")) throw new ForbiddenError();
    const input = inventoryItemUpsertSchema.parse(raw);

    const item = input.id
      ? await prisma.hearingAidInventoryItem.update({
          where: { id: input.id },
          data: {
            condition: input.condition,
            acquiredNote: input.acquiredNote || null,
            unitCostInr: input.unitCostInr ?? null,
            notes: input.notes || null,
          },
        })
      : await prisma.hearingAidInventoryItem.create({
          data: {
            modelId: input.modelId,
            branchId: input.branchId,
            serialNo: input.serialNo,
            condition: input.condition,
            acquiredAt: new Date(),
            acquiredNote: input.acquiredNote || null,
            unitCostInr: input.unitCostInr ?? null,
            notes: input.notes || null,
          },
        });

    await recordAuditEventSafe({
      actorId: user.id,
      action: input.id ? "AID_INVENTORY_UPDATED" : "AID_INVENTORY_CREATED",
      entityType: "HearingAidInventoryItem",
      entityId: item.id,
    });
    revalidatePath("/portal/admin/hearing-aids");
    return { ok: true, data: { id: item.id }, message: "Device saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function inventoryStatusAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "aid.catalogue.manage")) throw new ForbiddenError();
    const input = inventoryStatusSchema.parse(raw);
    await prisma.hearingAidInventoryItem.update({
      where: { id: input.itemId },
      data: { status: input.status },
    });
    await recordAuditEventSafe({
      actorId: user.id,
      action: "AID_INVENTORY_STATUS",
      entityType: "HearingAidInventoryItem",
      entityId: input.itemId,
      metadata: { status: input.status },
    });
    revalidatePath("/portal/admin/hearing-aids");
    return { ok: true, message: "Device status updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function accessoryUpsertAction(
  raw: {
    id?: string;
    name: string;
    category: string;
    description?: string;
    priceInr?: number;
    isActive: boolean;
    compatibleModelIds?: string[];
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!canAccess(user, "aid.catalogue.manage")) throw new ForbiddenError();

    const accessory = await prisma.$transaction(async (tx) => {
      const data = {
        name: raw.name,
        category: raw.category as never,
        description: raw.description || null,
        priceInr: raw.priceInr ?? null,
        isActive: raw.isActive,
      };
      const a = raw.id
        ? await tx.hearingAidAccessory.update({ where: { id: raw.id }, data })
        : await tx.hearingAidAccessory.create({ data });

      await tx.hearingAidAccessoryCompatibility.deleteMany({ where: { accessoryId: a.id } });
      // Deduplicated because SQLite does not support `skipDuplicates`. The rows
      // for this accessory were deleted just above, so only repeats inside the
      // submitted list could collide.
      const ids = [...new Set(raw.compatibleModelIds ?? [])];
      if (ids.length > 0) {
        await tx.hearingAidAccessoryCompatibility.createMany({
          data: ids.map((modelId) => ({ accessoryId: a.id, modelId })),
        });
      }
      return a;
    });

    await recordAuditEventSafe({
      actorId: user.id,
      action: raw.id ? "AID_ACCESSORY_UPDATED" : "AID_ACCESSORY_CREATED",
      entityType: "HearingAidAccessory",
      entityId: accessory.id,
    });
    revalidatePath("/portal/admin/hearing-aids");
    return { ok: true, data: { id: accessory.id }, message: "Accessory saved." };
  } catch (error) {
    return toActionResult(error);
  }
}
