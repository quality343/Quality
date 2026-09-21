"use server";

/**
 * Phase 4 hearing-aid server actions. Authorization lives in the service
 * layer; here we audit events (no PHI beyond entity ids), revalidate views,
 * and map errors to typed results.
 */

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/guards";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/service-errors";
import { fieldErrors } from "@/lib/validation/hearingaid";
import {
  changeRecommendationStatus,
  createAftercare,
  createDispensing,
  createFitting,
  createRecommendation,
  createServiceRequest,
  recordPatientDecision,
  scheduleDemo,
  transitionDemo,
  transitionDispensing,
  updateAftercare,
  updateFitting,
  updateServiceRecord,
  upsertWarranty,
} from "@/server/services/hearingaid";
import type { ActionResult } from "./actions-scheduling";

function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(error) };
  }
  if (
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ValidationError ||
    error instanceof ConflictError
  ) {
    return { ok: false, error: error.message };
  }
  console.error("[aid-action]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createRecommendationAction(
  raw: unknown,
): Promise<ActionResult<{ recommendationId: string }>> {
  try {
    const user = await requireUser();
    const rec = await createRecommendation(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids");
    return { ok: true, data: { recommendationId: rec.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function changeRecommendationStatusAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await changeRecommendationStatus(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids");
    return { ok: true, message: "Recommendation updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function recordPatientDecisionAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await recordPatientDecision(user, raw);
    revalidatePath("/portal/patient/hearing-aids");
    revalidatePath("/portal/audiologist/hearing-aids");
    return { ok: true, message: "Decision recorded." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function scheduleDemoAction(raw: unknown): Promise<ActionResult<{ demoId: string }>> {
  try {
    const user = await requireUser();
    const demo = await scheduleDemo(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, data: { demoId: demo.id }, message: "Demo scheduled." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function transitionDemoAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await transitionDemo(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, message: "Demo updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createFittingAction(
  raw: unknown,
): Promise<ActionResult<{ fittingId: string }>> {
  try {
    const user = await requireUser();
    const fitting = await createFitting(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, data: { fittingId: fitting.id }, message: "Fitting record created." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateFittingAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateFitting(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, message: "Fitting updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createDispensingAction(
  raw: unknown,
): Promise<ActionResult<{ dispensingId: string }>> {
  try {
    const user = await requireUser();
    const d = await createDispensing(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, data: { dispensingId: d.id }, message: "Dispensing prepared." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function transitionDispensingAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await transitionDispensing(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, message: "Dispensing updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function upsertWarrantyAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await upsertWarranty(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids");
    revalidatePath("/portal/patient/hearing-aids");
    return { ok: true, message: "Warranty saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createServiceRequestAction(
  raw: unknown,
): Promise<ActionResult<{ serviceRecordId: string }>> {
  try {
    const user = await requireUser();
    const rec = await createServiceRequest(user, raw);
    revalidatePath("/portal/patient/hearing-aids");
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, data: { serviceRecordId: rec.id }, message: "Service request submitted." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateServiceRecordAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateServiceRecord(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    revalidatePath("/portal/patient/hearing-aids");
    return { ok: true, message: "Service record updated." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createAftercareAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createAftercare(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, message: "Aftercare follow-up scheduled." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateAftercareAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateAftercare(user, raw);
    revalidatePath("/portal/audiologist/hearing-aids/operations");
    return { ok: true, message: "Aftercare updated." };
  } catch (error) {
    return toActionResult(error);
  }
}
