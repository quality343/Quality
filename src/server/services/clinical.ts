/**
 * Server-side clinical services (Phase 3).
 * Philosophy: the system stores and displays RECORDED DATA. It never
 * interprets, scores, or diagnoses — conclusions are typed by audiologists and
 * captured in review text, signed notes, and reports.
 */

import { TestType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { canAccess, type SessionUser } from "@/lib/auth/guards";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/service-errors";
import {
  assessmentCreateSchema,
  assessmentHistorySchema,
  assessmentMarkCompleteSchema,
  assessmentReviewSchema,
  noteCreateSchema,
  reportFinalizeSchema,
  reportGenerateSchema,
  testResultSchema,
  type NoteCreateInput,
  type ReportGenerateInput,
} from "@/lib/validation/clinical";
import { assertBranchAccess } from "./scheduling";

// ─── Assessment lifecycle ────────────────────────────────────────────────────

/** Creates a DRAFT assessment for a patient (audiologist-initiated). */
export async function createAssessment(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "assessment.create")) {
    throw new ForbiddenError("Not permitted to create assessments.");
  }
  const input = assessmentCreateSchema.parse(raw);

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    select: { id: true, branchId: true },
  });
  if (!patient) throw new NotFoundError("Patient not found.");
  if (patient.branchId) await assertBranchAccess(user, patient.branchId);

  if (input.appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
      select: { patientId: true },
    });
    if (!appt) throw new NotFoundError("Appointment not found.");
    if (appt.patientId !== patient.id) {
      throw new ValidationError("Appointment belongs to a different patient.");
    }
  }

  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });

  return prisma.hearingAssessment.create({
    data: {
      patientId: patient.id,
      audiologistId: staff?.id ?? null,
      branchId: staff?.branchId ?? patient.branchId ?? null,
      appointmentId: input.appointmentId ?? null,
      complaints: input.complaints || null,
      history: input.history || null,
      referredBy: input.referredBy || null,
    },
  });
}

/** Audits a single assessment for the given user, enforcing branch scoping. */
export async function getAssessmentForUser(user: SessionUser, assessmentId: string) {
  const assessment = await prisma.hearingAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      patient: { select: { id: true, userId: true, mrn: true, branchId: true } },
      audiologist: { include: { user: { select: { name: true } } } },
      reviewer: { include: { user: { select: { name: true } } } },
      testResults: { orderBy: { performedAt: "asc" } },
      appointment: { select: { id: true, status: true } },
    },
  });
  if (!assessment) throw new NotFoundError("Assessment not found.");
  return assessment;
}

/** Patients may only ever see their own assessment. */
export function assertCanViewAssessment(
  user: SessionUser,
  assessment: { patient: { userId: string | null } },
): void {
  if (user.role === "PATIENT") {
    // Guest patients (userId null) have no portal session to view anything.
    if (assessment.patient.userId !== user.id) {
      throw new ForbiddenError();
    }
    return;
  }
  if (!canAccess(user, "patient.read")) throw new ForbiddenError();
}

/** Updates case history fields while the assessment is a DRAFT. */
export async function updateAssessmentHistory(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "assessment.create")) throw new ForbiddenError();
  const input = assessmentHistorySchema.parse(raw);

  const assessment = await prisma.hearingAssessment.findUnique({
    where: { id: input.assessmentId },
    select: { status: true },
  });
  if (!assessment) throw new NotFoundError("Assessment not found.");
  if (assessment.status !== "DRAFT") {
    throw new ValidationError("Case history can only be edited while the assessment is a draft.");
  }

  return prisma.hearingAssessment.update({
    where: { id: input.assessmentId },
    data: {
      complaints: input.complaints || null,
      history: input.history || null,
      referredBy: input.referredBy || null,
    },
  });
}

/** DRAFT → COMPLETED (all data entry done). */
export async function markAssessmentComplete(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "assessment.create")) throw new ForbiddenError();
  const { assessmentId } = assessmentMarkCompleteSchema.parse(raw);

  const assessment = await prisma.hearingAssessment.findUnique({
    where: { id: assessmentId },
    select: { status: true, testResults: { select: { id: true } } },
  });
  if (!assessment) throw new NotFoundError("Assessment not found.");
  if (assessment.status !== "DRAFT") {
    throw new ValidationError("Only draft assessments can be marked complete.");
  }
  if (assessment.testResults.length === 0) {
    throw new ValidationError("Record at least one test result before completing.");
  }
  return prisma.hearingAssessment.update({
    where: { id: assessmentId },
    data: { status: "COMPLETED" },
  });
}

/** COMPLETED → REVIEWED with the audiologist's typed conclusion. */
export async function reviewAssessment(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "assessment.review")) {
    throw new ForbiddenError("Not permitted to review assessments.");
  }
  const input = assessmentReviewSchema.parse(raw);

  const assessment = await prisma.hearingAssessment.findUnique({
    where: { id: input.assessmentId },
    select: { status: true },
  });
  if (!assessment) throw new NotFoundError("Assessment not found.");
  if (assessment.status !== "COMPLETED") {
    throw new ValidationError("Only completed assessments can be reviewed.");
  }

  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  return prisma.hearingAssessment.update({
    where: { id: input.assessmentId },
    data: {
      status: "REVIEWED",
      reviewText: input.reviewText,
      reviewedById: staff?.id ?? null,
      reviewedAt: new Date(),
    },
  });
}

// ─── Test results ────────────────────────────────────────────────────────────

export const CLINICAL_TEST_TYPES = Object.values(TestType);

/** Records a test result on a DRAFT assessment. PTA also creates the audiogram. */
export async function recordTestResult(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "audiogram.manage") && !canAccess(user, "assessment.create")) {
    throw new ForbiddenError("Not permitted to record test results.");
  }
  const input = testResultSchema.parse(raw);
  const assessment = await getAssessmentForUser(user, input.assessmentId);
  if (assessment.status !== "DRAFT") {
    throw new ValidationError("Tests can only be recorded while the assessment is a draft.");
  }

  return prisma.$transaction(async (tx) => {
    const result = await tx.testResult.create({
      data: {
        assessmentId: assessment.id,
        testType: input.testType,
        payload: input.payload as object,
        performedById: (await tx.staff.findUnique({ where: { userId: user.id } }))?.id ?? null,
      },
    });

    if (input.testType === "PTA") {
      await tx.audiogram.create({
        data: { testResultId: result.id, data: input.payload as object },
      });
    }
    return result;
  });
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function createClinicalNote(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "note.create")) throw new ForbiddenError();
  const input = noteCreateSchema.parse(raw) as NoteCreateInput;

  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) throw new ForbiddenError("Only staff can author notes.");

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    select: { id: true },
  });
  if (!patient) throw new NotFoundError("Patient not found.");

  return prisma.clinicalNote.create({
    data: {
      patientId: patient.id,
      authorId: staff.id,
      assessmentId: input.assessmentId ?? null,
      body: input.body,
      isSigned: input.sign,
      signedAt: input.sign ? new Date() : null,
    },
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

/** Builds a snapshot report from the assessment's recorded data. */
export async function generateReport(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "report.generate")) {
    throw new ForbiddenError("Not permitted to generate reports.");
  }
  const input = reportGenerateSchema.parse(raw) as ReportGenerateInput;

  const assessment = await getAssessmentForUser(user, input.assessmentId);
  if (assessment.status !== "REVIEWED") {
    throw new ValidationError("Reports can be generated only for reviewed assessments.");
  }

  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) throw new ForbiddenError("Only staff can generate reports.");

  const content = {
    generatedAt: new Date().toISOString(),
    patient: { mrn: assessment.patient.mrn },
    history: {
      complaints: assessment.complaints,
      history: assessment.history,
      referredBy: assessment.referredBy,
    },
    tests: assessment.testResults.map((t) => ({ testType: t.testType, payload: t.payload })),
    review: {
      text: assessment.reviewText,
      reviewer: assessment.reviewer?.user.name ?? null,
      reviewedAt: assessment.reviewedAt?.toISOString() ?? null,
    },
  };

  const report = await prisma.report.create({
    data: {
      patientId: assessment.patientId,
      assessmentId: assessment.id,
      generatedById: staff.id,
      title: input.title,
      content: content as object,
      status: input.finalize ? "FINAL" : "DRAFT",
      finalizedById: input.finalize ? staff.id : null,
      finalizedAt: input.finalize ? new Date() : null,
    },
  });

  if (input.finalize) {
    await prisma.hearingAssessment.update({
      where: { id: assessment.id },
      data: { status: "REPORTED" },
    });
  }
  return report;
}

/** DRAFT report → FINAL (immutable snapshot; assessment becomes REPORTED). */
export async function finalizeReport(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "report.generate")) throw new ForbiddenError();
  const { reportId } = reportFinalizeSchema.parse(raw);

  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) throw new ForbiddenError();

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new NotFoundError("Report not found.");
  if (report.status !== "DRAFT") throw new ValidationError("Report is already final.");

  const finalized = await prisma.report.update({
    where: { id: reportId },
    data: { status: "FINAL", finalizedById: staff.id, finalizedAt: new Date() },
  });

  if (report.assessmentId) {
    await prisma.hearingAssessment.update({
      where: { id: report.assessmentId },
      data: { status: "REPORTED" },
    });
  }
  return finalized;
}

/** Patient-safe report fetch: patients see only their own FINAL reports. */
export async function getReportForUser(user: SessionUser, reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      patient: { select: { userId: true, mrn: true } },
      assessment: { select: { id: true } },
    },
  });
  if (!report) throw new NotFoundError("Report not found.");
  if (user.role === "PATIENT") {
    if (report.patient.userId !== user.id || report.status !== "FINAL") {
      throw new ForbiddenError();
    }
  } else if (!canAccess(user, "patient.read")) {
    throw new ForbiddenError();
  }
  return report;
}
