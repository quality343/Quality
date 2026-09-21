"use server";

/**
 * Server actions for the clinical module. Authorization is enforced in the
 * service layer; here we audit events and revalidate affected views.
 */

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { recordAuditEventSafe } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guards";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/service-errors";
import { fieldErrors } from "@/lib/validation/clinical";
import {
  createAssessment,
  createClinicalNote,
  finalizeReport,
  generateReport,
  markAssessmentComplete,
  recordTestResult,
  reviewAssessment,
  updateAssessmentHistory,
} from "@/server/services/clinical";
import type { ActionResult } from "./actions-scheduling";

function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(error) };
  }
  if (
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ValidationError
  ) {
    return { ok: false, error: error.message };
  }
  console.error("[clinical-action]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createAssessmentAction(
  raw: unknown,
): Promise<ActionResult<{ assessmentId: string }>> {
  try {
    const user = await requireUser();
    const assessment = await createAssessment(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "ASSESSMENT_CREATED",
      entityType: "HearingAssessment",
      entityId: assessment.id,
    });
    revalidatePath("/portal/audiologist/assessments");
    return { ok: true, data: { assessmentId: assessment.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateAssessmentHistoryAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateAssessmentHistory(user, raw);
    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function recordTestResultAction(
  raw: unknown,
): Promise<ActionResult<{ testResultId: string }>> {
  try {
    const user = await requireUser();
    const result = await recordTestResult(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "TEST_RECORDED",
      entityType: "TestResult",
      entityId: result.id,
    });
    revalidatePath("/portal/audiologist/assessments");
    return { ok: true, data: { testResultId: result.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function markAssessmentCompleteAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await markAssessmentComplete(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "ASSESSMENT_COMPLETED",
      entityType: "HearingAssessment",
      entityId: typeof raw === "object" && raw !== null && "assessmentId" in raw
        ? String((raw as { assessmentId: unknown }).assessmentId)
        : undefined,
    });
    revalidatePath("/portal/audiologist/assessments");
    return { ok: true, message: "Assessment marked complete." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function reviewAssessmentAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await reviewAssessment(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "ASSESSMENT_REVIEWED",
      entityType: "HearingAssessment",
      entityId: typeof raw === "object" && raw !== null && "assessmentId" in raw
        ? String((raw as { assessmentId: unknown }).assessmentId)
        : undefined,
    });
    revalidatePath("/portal/audiologist/assessments");
    return { ok: true, message: "Review saved." };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createClinicalNoteAction(
  raw: unknown,
): Promise<ActionResult<{ noteId: string }>> {
  try {
    const user = await requireUser();
    const note = await createClinicalNote(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "NOTE_CREATED",
      entityType: "ClinicalNote",
      entityId: note.id,
      metadata: { signed: note.isSigned },
    });
    revalidatePath("/portal/audiologist/assessments");
    return { ok: true, data: { noteId: note.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function generateReportAction(
  raw: unknown,
): Promise<ActionResult<{ reportId: string }>> {
  try {
    const user = await requireUser();
    const report = await generateReport(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "REPORT_GENERATED",
      entityType: "Report",
      entityId: report.id,
    });
    revalidatePath("/portal/audiologist/reports");
    return { ok: true, data: { reportId: report.id } };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function finalizeReportAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await finalizeReport(user, raw);
    await recordAuditEventSafe({
      actorId: user.id,
      action: "REPORT_FINALIZED",
      entityType: "Report",
      entityId: typeof raw === "object" && raw !== null && "reportId" in raw
        ? String((raw as { reportId: unknown }).reportId)
        : undefined,
    });
    revalidatePath("/portal/audiologist/reports");
    revalidatePath("/portal/patient/reports");
    return { ok: true, message: "Report finalized and released to the patient." };
  } catch (error) {
    return toActionResult(error);
  }
}
