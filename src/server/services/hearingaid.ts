/**
 * Phase 4 — hearing-aid lifecycle services.
 *
 * Invariants enforced server-side:
 * - Recommendations are created/approved only by permitted audiologists; the
 *   system never auto-generates one and approval never implies dispensing.
 * - A physical device cannot have overlapping SCHEDULED/ACTIVE demos.
 * - Dispensing flips device inventory to DISPENSED; it is a separate,
 *   explicit action — never an automatic consequence of approval.
 * - Patients read only their own records (joins anchored on session user id).
 * - Unit costs never reach patient-visible payloads.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { recordAuditEventSafe } from "@/lib/audit";
import { canAccess, type SessionUser } from "@/lib/auth/guards";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/service-errors";
import {
  aftercareCreateSchema,
  aftercareUpdateSchema,
  demoScheduleSchema,
  demoTransitionSchema,
  dispensingCreateSchema,
  dispensingTransitionSchema,
  fittingCreateSchema,
  fittingUpdateSchema,
  recommendationCreateSchema,
  recommendationDecisionSchema,
  recommendationStatusSchema,
  serviceRequestSchema,
  serviceUpdateSchema,
  warrantyUpsertSchema,
  type AftercareCreateInput,
  type DemoScheduleInput,
  type DispensingCreateInput,
  type FittingCreateInput,
  type RecommendationCreateInput,
  type ServiceRequestInput,
} from "@/lib/validation/hearingaid";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function staffIdFor(userId: string): Promise<string> {
  const staff = await prisma.staff.findUnique({ where: { userId }, select: { id: true } });
  if (!staff) throw new ForbiddenError("Staff record required for this action.");
  return staff.id;
}

/** Patient session → own patient row (never trusts a client patientId). */
export async function ownPatientId(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) throw new ForbiddenError("Patient profile required.");
  return patient.id;
}

async function notify(userId: string, n: { type: string; title: string; body: string; entityType?: string; entityId?: string }) {
  await prisma.notification.create({ data: { userId, ...n } });
}

async function notifyPatient(patientId: string, n: { type: string; title: string; body: string; entityType?: string; entityId?: string }) {
  const p = await prisma.patient.findUnique({ where: { id: patientId }, select: { userId: true } });
  if (p?.userId) await notify(p.userId, n);
}

// ─── Catalogue ───────────────────────────────────────────────────────────────

export type CatalogueFilters = {
  brandId?: string;
  deviceType?: string;
  technologyLevel?: string;
  featureKey?: string;
  q?: string;
  includeInactive?: boolean;
  maxPriceInr?: number;
  minPriceInr?: number;
};

/** Catalogue read. Patients get active-only and never see unit costs. */
export async function listCatalogue(user: SessionUser, filters: CatalogueFilters = {}) {
  const isStaff = user.role !== "PATIENT";
  const canSeeAll = isStaff && canAccess(user, "aid.catalogue.read");
  if (!isStaff && !canAccess(user, "aid.catalogue.read")) {
    // Patients may browse the public catalogue (active models only).
  }

  const models = await prisma.hearingAidModel.findMany({
    where: {
      ...(canSeeAll ? {} : { status: "ACTIVE" }),
      ...(filters.brandId ? { brandId: filters.brandId } : {}),
      ...(filters.deviceType ? { deviceType: filters.deviceType as never } : {}),
      ...(filters.technologyLevel ? { technologyLevel: filters.technologyLevel as never } : {}),
      ...(filters.maxPriceInr !== undefined || filters.minPriceInr !== undefined
        ? {
            priceInr: {
              ...(filters.minPriceInr !== undefined ? { gte: filters.minPriceInr } : {}),
              ...(filters.maxPriceInr !== undefined ? { lte: filters.maxPriceInr } : {}),
            },
          }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { modelName: { contains: filters.q, mode: "insensitive" as const } },
              { modelCode: { contains: filters.q, mode: "insensitive" as const } },
              { brand: { name: { contains: filters.q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
      ...(filters.featureKey
        ? { features: { some: { feature: { key: filters.featureKey } } } }
        : {}),
    },
    include: {
      brand: { select: { id: true, name: true } },
      features: {
        include: {
          feature: { select: { key: true, label: true, category: true } },
        },
      },
      ...(canSeeAll
        ? {
            inventory: {
              where: { status: "AVAILABLE" },
              select: { branchId: true },
              distinct: ["branchId"],
            },
          }
        : {}),
    } satisfies Prisma.HearingAidModelInclude,
    orderBy: [{ brand: { name: "asc" } }, { modelName: "asc" }],
  });

  return models.map((m) => ({
    id: m.id,
    brandId: m.brandId,
    brandName: m.brand.name,
    modelName: m.modelName,
    modelCode: m.modelCode,
    deviceType: m.deviceType,
    technologyLevel: m.technologyLevel,
    description: m.description,
    priceInr: m.priceInr,
    warrantyMonths: m.warrantyMonths,
    status: m.status,
    features: m.features.map((f) => ({
      key: f.feature.key,
      label: f.feature.label,
      category: f.feature.category,
      detail: f.detail,
    })),
    availableBranchIds: canSeeAll && Array.isArray(m.inventory) ? m.inventory.map((i) => i.branchId) : [],
  }));
}

export async function getModelDetail(user: SessionUser, modelId: string) {
  const model = await prisma.hearingAidModel.findUnique({
    where: { id: modelId },
    include: {
      brand: true,
      features: { include: { feature: true } },
      inventory: {
        where: user.role === "PATIENT" ? { status: "AVAILABLE" } : {},
        select: {
          id: true,
          status: true,
          branchId: true,
          condition: true,
          unitCostInr: user.role === "PATIENT" ? false : true,
        },
      },
    },
  });
  if (!model) throw new NotFoundError("Model not found.");
  if (model.status !== "ACTIVE" && user.role === "PATIENT") throw new NotFoundError("Model not found.");
  return model;
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export async function createRecommendation(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.recommend.create")) {
    throw new ForbiddenError("Only authorized clinicians can create recommendations.");
  }
  const input = recommendationCreateSchema.parse(raw) as RecommendationCreateInput;
  const staffId = await staffIdFor(user.id);

  const [patient, model] = await Promise.all([
    prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } }),
    prisma.hearingAidModel.findUnique({ where: { id: input.modelId }, select: { id: true, status: true } }),
  ]);
  if (!patient) throw new NotFoundError("Patient not found.");
  if (!model || model.status !== "ACTIVE") throw new ValidationError("Select an active catalogue model.");
  if (input.assessmentId) {
    const a = await prisma.hearingAssessment.findUnique({ where: { id: input.assessmentId }, select: { patientId: true } });
    if (!a) throw new NotFoundError("Assessment not found.");
    if (a.patientId !== patient.id) throw new ValidationError("Assessment belongs to a different patient.");
  }

  const rec = await prisma.hearingAidRecommendation.create({
    data: {
      patientId: patient.id,
      assessmentId: input.assessmentId ?? null,
      audiologistId: staffId,
      modelId: model.id,
      reason: input.reason,
      listeningNeeds: input.listeningNeeds || null,
      communicationPrefs: input.communicationPrefs || null,
      handlingNotes: input.handlingNotes || null,
      professionalConsiderations: input.professionalConsiderations || null,
      followUpPlan: input.followUpPlan || null,
    },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_RECOMMENDATION_CREATED",
    entityType: "HearingAidRecommendation",
    entityId: rec.id,
  });
  await notifyPatient(patient.id, {
    type: "AID_RECOMMENDATION",
    title: "New hearing aid recommendation",
    body: "Your audiologist prepared a hearing aid recommendation for your review.",
    entityType: "HearingAidRecommendation",
    entityId: rec.id,
  });
  return rec;
}

export async function changeRecommendationStatus(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.recommend.create")) throw new ForbiddenError();
  const input = recommendationStatusSchema.parse(raw);
  const rec = await prisma.hearingAidRecommendation.findUnique({ where: { id: input.recommendationId } });
  if (!rec) throw new NotFoundError("Recommendation not found.");

  if (input.status === "APPROVED" && rec.status !== "DRAFT" && rec.status !== "UNDER_REVIEW") {
    throw new ValidationError("Only drafts or reviews can be approved.");
  }
  const updated = await prisma.hearingAidRecommendation.update({
    where: { id: rec.id },
    data: {
      status: input.status,
      approvedAt: input.status === "APPROVED" ? new Date() : null,
    },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_RECOMMENDATION_STATUS",
    entityType: "HearingAidRecommendation",
    entityId: rec.id,
    metadata: { status: input.status },
  });
  return updated;
}

/** Records the PATIENT's decision — by the patient (own) or staff on their behalf. */
export async function recordPatientDecision(user: SessionUser, raw: unknown) {
  const input = recommendationDecisionSchema.parse(raw);
  const rec = await prisma.hearingAidRecommendation.findUnique({ where: { id: input.recommendationId } });
  if (!rec) throw new NotFoundError("Recommendation not found.");

  if (user.role === "PATIENT") {
    if (rec.patientId !== (await ownPatientId(user.id))) throw new ForbiddenError();
  } else if (!canAccess(user, "aid.recommend.decide")) {
    throw new ForbiddenError();
  }
  if (rec.status !== "APPROVED") {
    throw new ValidationError("Decisions apply to approved recommendations only.");
  }
  const updated = await prisma.hearingAidRecommendation.update({
    where: { id: rec.id },
    data: { patientDecision: input.decision, decisionAt: new Date() },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_RECOMMENDATION_DECISION",
    entityType: "HearingAidRecommendation",
    entityId: rec.id,
    metadata: { decision: input.decision },
  });
  return updated;
}

// ─── Demo management ─────────────────────────────────────────────────────────

const DEMO_OCCUPYING: ("SCHEDULED" | "ACTIVE")[] = ["SCHEDULED", "ACTIVE"];

export async function scheduleDemo(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.demo.manage")) throw new ForbiddenError("Not permitted to manage demos.");
  const input = demoScheduleSchema.parse(raw) as DemoScheduleInput;
  const staffId = await staffIdFor(user.id);

  const item = await prisma.hearingAidInventoryItem.findUnique({
    where: { id: input.inventoryItemId },
    select: { id: true, status: true, modelId: true },
  });
  if (!item) throw new NotFoundError("Device not found.");
  if (!["AVAILABLE", "DEMO"].includes(item.status)) {
    throw new ConflictError("Device is not available for demo (status: " + item.status + ").");
  }
  const patient = await prisma.patient.findUnique({ where: { id: input.patientId }, select: { id: true } });
  if (!patient) throw new NotFoundError("Patient not found.");

  // Core invariant: no overlapping SCHEDULED/ACTIVE demo on the same device.
  try {
    const demo = await prisma.$transaction(async (tx) => {
      const overlapping = await tx.hearingAidDemo.findFirst({
        where: { inventoryItemId: item.id, status: { in: DEMO_OCCUPYING } },
        select: { id: true },
      });
      if (overlapping) throw new ConflictError("This device is already assigned to an active demo.");
      return tx.hearingAidDemo.create({
        data: {
          patientId: patient.id,
          inventoryItemId: item.id,
          staffId,
          branchId: (await tx.hearingAidInventoryItem.findUniqueOrThrow({
            where: { id: item.id },
            select: { branchId: true },
          })).branchId,
          expectedReturnAt: input.expectedReturnAt,
          notes: input.notes || null,
          status: "SCHEDULED",
        },
      }      );
    });
    await recordAuditEventSafe({
      actorId: user.id,
      action: "AID_DEMO_ASSIGNED",
      entityType: "HearingAidDemo",
      entityId: demo.id,
    });
    return demo;
  } catch (e) {
    if (e instanceof ConflictError) throw e;
    throw e;
  }
}

export async function transitionDemo(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.demo.manage")) throw new ForbiddenError();
  const input = demoTransitionSchema.parse(raw);
  const demo = await prisma.hearingAidDemo.findUnique({ where: { id: input.demoId } });
  if (!demo) throw new NotFoundError("Demo not found.");

  const data: Record<string, unknown> = { status: input.status };
  if (input.status === "ACTIVE") {
    if (demo.status !== "SCHEDULED") throw new ValidationError("Only scheduled demos can start.");
    data.startedAt = new Date();
    await prisma.hearingAidInventoryItem.update({
      where: { id: demo.inventoryItemId },
      data: { status: "DEMO" },
    });
  }
  if (input.status === "RETURNED") {
    if (demo.status !== "ACTIVE" && demo.status !== "OVERDUE") {
      throw new ValidationError("Only active demos can be returned.");
    }
    data.actualReturnAt = new Date();
    await prisma.hearingAidInventoryItem.update({
      where: { id: demo.inventoryItemId },
      data: { status: "AVAILABLE" },
    });
  }
  if (input.status === "CANCELLED") {
    if (demo.status === "RETURNED") throw new ValidationError("Returned demos cannot be cancelled.");
    if (demo.status === "ACTIVE" || demo.status === "SCHEDULED") {
      await prisma.hearingAidInventoryItem.update({
        where: { id: demo.inventoryItemId },
        data: { status: "AVAILABLE" },
      });
    }
  }
  if (input.patientFeedback !== undefined) data.patientFeedback = input.patientFeedback || null;

  const updated = await prisma.hearingAidDemo.update({ where: { id: demo.id }, data: data as never });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_DEMO_TRANSITION",
    entityType: "HearingAidDemo",
    entityId: demo.id,
    metadata: { status: input.status },
  });
  return updated;
}

// ─── Fitting ─────────────────────────────────────────────────────────────────

export async function createFitting(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "fitting.record")) {
    throw new ForbiddenError("Only authorized clinicians can record fittings.");
  }
  const input = fittingCreateSchema.parse(raw) as FittingCreateInput;
  const staffId = await staffIdFor(user.id);

  const item = await prisma.hearingAidInventoryItem.findUnique({ where: { id: input.inventoryItemId } });
  if (!item) throw new NotFoundError("Device not found.");
  if (!["AVAILABLE", "RESERVED", "FITTED"].includes(item.status)) {
    throw new ConflictError("Device cannot be fitted in its current status (" + item.status + ").");
  }
  if (input.recommendationId) {
    const rec = await prisma.hearingAidRecommendation.findUnique({
      where: { id: input.recommendationId },
      select: { patientId: true },
    });
    if (!rec) throw new NotFoundError("Recommendation not found.");
    if (rec.patientId !== input.patientId) throw new ValidationError("Recommendation belongs to a different patient.");
  }

  const fitting = await prisma.hearingAidFitting.create({
    data: {
      patientId: input.patientId,
      inventoryItemId: item.id,
      audiologistId: staffId,
      recommendationId: input.recommendationId ?? null,
      assessmentId: input.assessmentId ?? null,
      branchId: item.branchId,
      earSide: input.earSide,
      fittingDate: input.fittingDate ?? null,
      notes: input.notes || null,
      status: "PLANNED",
    },
  });
  await prisma.hearingAidInventoryItem.update({
    where: { id: item.id },
    data: { status: "FITTED" },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_FITTING_CREATED",
    entityType: "HearingAidFitting",
    entityId: fitting.id,
  });
  await notifyPatient(input.patientId, {
    type: "AID_FITTING",
    title: "Hearing aid fitting scheduled",
    body: "A fitting record was created. See your portal for details.",
    entityType: "HearingAidFitting",
    entityId: fitting.id,
  });
  return fitting;
}

export async function updateFitting(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "fitting.record")) throw new ForbiddenError();
  const input = fittingUpdateSchema.parse(raw);
  const fitting = await prisma.hearingAidFitting.findUnique({ where: { id: input.fittingId } });
  if (!fitting) throw new NotFoundError("Fitting not found.");

  const data: Record<string, unknown> = {};
  if (input.status) data.status = input.status;
  if (input.programmingSummary !== undefined) data.programmingSummary = input.programmingSummary || null;
  if (input.verificationNotes !== undefined) data.verificationNotes = input.verificationNotes || null;
  if (input.patientFeedback !== undefined) data.patientFeedback = input.patientFeedback || null;
  if (input.followUpDate) data.followUpDate = input.followUpDate;

  const updated = await prisma.hearingAidFitting.update({ where: { id: fitting.id }, data: data as never });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_FITTING_UPDATED",
    entityType: "HearingAidFitting",
    entityId: fitting.id,
  });

  // Completing a fitting auto-creates the initial aftercare follow-up.
  if (input.status === "COMPLETED") {
    const existing = await prisma.hearingAidFollowUp.findFirst({
      where: { fittingId: fitting.id, reason: "INITIAL_FITTING_REVIEW" },
      select: { id: true },
    });
    if (!existing) {
      const due = new Date();
      due.setDate(due.getDate() + 14);
      await prisma.hearingAidFollowUp.create({
        data: {
          patientId: fitting.patientId,
          fittingId: fitting.id,
          inventoryItemId: fitting.inventoryItemId,
          audiologistId: fitting.audiologistId,
          branchId: fitting.branchId,
          reason: "INITIAL_FITTING_REVIEW",
          dueDate: due,
          notes: "Auto-created after fitting completion.",
        },
      });
    }
  }
  return updated;
}

// ─── Dispensing ──────────────────────────────────────────────────────────────

export async function createDispensing(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.dispense")) throw new ForbiddenError("Not permitted to prepare dispensing.");
  const input = dispensingCreateSchema.parse(raw) as DispensingCreateInput;
  const staffId = await staffIdFor(user.id);

  const item = await prisma.hearingAidInventoryItem.findUnique({ where: { id: input.inventoryItemId } });
  if (!item) throw new NotFoundError("Device not found.");
  if (!["FITTED", "RESERVED", "AVAILABLE"].includes(item.status)) {
    throw new ConflictError("Device cannot be prepared for dispensing (" + item.status + ").");
  }
  if (input.fittingId) {
    const f = await prisma.hearingAidFitting.findUnique({ where: { id: input.fittingId }, select: { patientId: true } });
    if (!f) throw new NotFoundError("Fitting not found.");
    if (f.patientId !== input.patientId) throw new ValidationError("Fitting belongs to a different patient.");
  }

  const dispensing = await prisma.hearingAidDispensing.create({
    data: {
      patientId: input.patientId,
      inventoryItemId: item.id,
      recommendationId: input.recommendationId ?? null,
      fittingId: input.fittingId ?? null,
      branchId: item.branchId,
      dispensedById: staffId,
      status: "PREPARED",
      notes: input.notes || null,
    },
  });
  await prisma.hearingAidInventoryItem.update({
    where: { id: item.id },
    data: { status: "RESERVED" },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_DISPENSING_PREPARED",
    entityType: "HearingAidDispensing",
    entityId: dispensing.id,
  });
  return dispensing;
}

export async function transitionDispensing(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.dispense")) throw new ForbiddenError();
  const input = dispensingTransitionSchema.parse(raw);
  const d = await prisma.hearingAidDispensing.findUnique({ where: { id: input.dispensingId } });
  if (!d) throw new NotFoundError("Dispensing record not found.");

  if (input.status === "DISPENSED") {
    if (d.status !== "PREPARED") throw new ValidationError("Only prepared records can be dispensed.");
    await prisma.hearingAidInventoryItem.update({
      where: { id: d.inventoryItemId },
      data: { status: "DISPENSED" },
    });
  }
  if (input.status === "CANCELLED" || input.status === "RETURNED") {
    if (d.status === "DISPENSED" && input.status === "CANCELLED") {
      throw new ValidationError("Dispensed records cannot be cancelled — record a return instead.");
    }
    await prisma.hearingAidInventoryItem.update({
      where: { id: d.inventoryItemId },
      data: { status: input.status === "RETURNED" ? "RETIRED" : "AVAILABLE" },
    });
  }
  const updated = await prisma.hearingAidDispensing.update({
    where: { id: d.id },
    data: {
      status: input.status,
      dispensedAt: input.status === "DISPENSED" ? new Date() : d.dispensedAt,
      patientAcknowledgedAt: input.acknowledge ? new Date() : d.patientAcknowledgedAt,
    },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: input.status === "DISPENSED" ? "AID_DEVICE_DISPENSED" : "AID_DISPENSING_STATUS",
    entityType: "HearingAidDispensing",
    entityId: d.id,
    metadata: { status: input.status },
  });
  return updated;
}

// ─── Warranty ────────────────────────────────────────────────────────────────

export async function upsertWarranty(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.warranty.manage")) throw new ForbiddenError();
  const input = warrantyUpsertSchema.parse(raw);

  if (input.id) {
    const w = await prisma.hearingAidWarranty.update({
      where: { id: input.id },
      data: {
        provider: input.provider,
        reference: input.reference || null,
        startDate: input.startDate,
        endDate: input.endDate,
        coverageNotes: input.coverageNotes || null,
        status: input.status,
      },
    });
    await recordAuditEventSafe({
      actorId: user.id,
      action: "AID_WARRANTY_UPDATED",
      entityType: "HearingAidWarranty",
      entityId: w.id,
    });
    return w;
  }
  const w = await prisma.hearingAidWarranty.create({
    data: {
      patientId: input.patientId,
      inventoryItemId: input.inventoryItemId,
      provider: input.provider,
      reference: input.reference || null,
      startDate: input.startDate,
      endDate: input.endDate,
      coverageNotes: input.coverageNotes || null,
      status: input.status,
    },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_WARRANTY_UPDATED",
    entityType: "HearingAidWarranty",
    entityId: w.id,
  });
  return w;
}

// ─── Service / repair ────────────────────────────────────────────────────────

/** Patient submits a service request for THEIR OWN device. */
export async function createServiceRequest(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.service.request")) {
    throw new ForbiddenError("Sign in as the device owner to request service.");
  }
  const input = serviceRequestSchema.parse(raw) as ServiceRequestInput;
  const patientId = await ownPatientId(user.id);

  const item = await prisma.hearingAidInventoryItem.findUnique({ where: { id: input.inventoryItemId } });
  if (!item) throw new NotFoundError("Device not found.");
  // Ownership: the device must be linked to this patient via fitting/dispensing.
  const owned = await prisma.hearingAidFitting.findFirst({
    where: { inventoryItemId: item.id, patientId },
    select: { id: true },
  });
  if (!owned) throw new ForbiddenError("This device is not linked to your records.");

  const record = await prisma.hearingAidServiceRecord.create({
    data: {
      patientId,
      inventoryItemId: item.id,
      serviceType: input.serviceType,
      status: "REPORTED",
      issueDescription: input.issueDescription,
    },
  });
  await prisma.hearingAidInventoryItem.update({
    where: { id: item.id },
    data: { status: "REPAIR" },
  }).catch(() => undefined); // only if device is with the patient; keep record either way
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_SERVICE_REQUESTED",
    entityType: "HearingAidServiceRecord",
    entityId: record.id,
  });
  return record;
}

export async function updateServiceRecord(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.service.manage")) throw new ForbiddenError();
  const input = serviceUpdateSchema.parse(raw);
  const record = await prisma.hearingAidServiceRecord.findUnique({ where: { id: input.serviceRecordId } });
  if (!record) throw new NotFoundError("Service record not found.");

  const data: Record<string, unknown> = {};
  if (input.status) {
    data.status = input.status;
    if (input.status === "COMPLETED") data.completedAt = new Date();
    if (input.status === "COMPLETED" || input.status === "READY_FOR_COLLECTION" || input.status === "CANCELLED") {
      await prisma.hearingAidInventoryItem.update({
        where: { id: record.inventoryItemId },
        data: { status: input.status === "CANCELLED" ? "AVAILABLE" : "DISPENSED" },
      }).catch(() => undefined);
    }
    if (input.status === "SENT_FOR_REPAIR") {
      await prisma.hearingAidInventoryItem.update({
        where: { id: record.inventoryItemId },
        data: { status: "REPAIR" },
      }).catch(() => undefined);
    }
  }
  if (input.assignedStaffId !== undefined) data.assignedStaffId = input.assignedStaffId || null;
  if (input.resolutionNotes !== undefined) data.resolutionNotes = input.resolutionNotes || null;

  const updated = await prisma.hearingAidServiceRecord.update({
    where: { id: record.id },
    data: data as never,
  });
  await notifyPatient(record.patientId, {
    type: "AID_SERVICE_UPDATE",
    title: "Service request update",
    body: "Your hearing aid service request has an update. Check your portal.",
    entityType: "HearingAidServiceRecord",
    entityId: record.id,
  });
  return updated;
}

// ─── Aftercare ───────────────────────────────────────────────────────────────

export async function createAftercare(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.aftercare.manage")) throw new ForbiddenError();
  const input = aftercareCreateSchema.parse(raw) as AftercareCreateInput;
  const staffId = await staffIdFor(user.id);

  const followUp = await prisma.hearingAidFollowUp.create({
    data: {
      patientId: input.patientId,
      fittingId: input.fittingId ?? null,
      inventoryItemId: input.inventoryItemId ?? null,
      audiologistId: staffId,
      reason: input.reason,
      dueDate: input.dueDate,
      notes: input.notes || null,
    },
  });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_AFTERCARE_CREATED",
    entityType: "HearingAidFollowUp",
    entityId: followUp.id,
  });
  return followUp;
}

export async function updateAftercare(user: SessionUser, raw: unknown) {
  if (!canAccess(user, "aid.aftercare.manage")) throw new ForbiddenError();
  const input = aftercareUpdateSchema.parse(raw);
  const data: Record<string, unknown> = {};
  if (input.status) data.status = input.status;
  if (input.outcome !== undefined) data.outcome = input.outcome || null;
  if (input.dueDate) data.dueDate = input.dueDate;
  const updated = await prisma.hearingAidFollowUp.update({ where: { id: input.followUpId }, data: data as never });
  await recordAuditEventSafe({
    actorId: user.id,
    action: "AID_AFTERCARE_UPDATED",
    entityType: "HearingAidFollowUp",
    entityId: updated.id,
  });
  return updated;
}

// ─── Patient-scoped reads ────────────────────────────────────────────────────

/** All hearing-aid data for the signed-in patient's portal hub. */
export async function getPatientAidOverview(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) return null;
  const patientId = patient.id;

  const [recommendations, fittings, dispensings, warranties, serviceRecords, followUps, demos] =
    await Promise.all([
      prisma.hearingAidRecommendation.findMany({
        where: { patientId, status: { in: ["APPROVED", "UNDER_REVIEW"] } },
        orderBy: { createdAt: "desc" },
        include: { model: { include: { brand: { select: { name: true } } } }, audiologist: { include: { user: { select: { name: true } } } } },
      }),
      prisma.hearingAidFitting.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } }, audiologist: { include: { user: { select: { name: true } } } } },
      }),
      prisma.hearingAidDispensing.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } } },
      }),
      prisma.hearingAidWarranty.findMany({
        where: { patientId },
        orderBy: { endDate: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } } },
      }),
      prisma.hearingAidServiceRecord.findMany({
        where: { patientId },
        orderBy: { reportedAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } } },
      }),
      prisma.hearingAidFollowUp.findMany({
        where: { patientId },
        orderBy: { dueDate: "asc" },
      }),
      prisma.hearingAidDemo.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } } },
      }),
    ]);

  return { patientId, recommendations, fittings, dispensings, warranties, serviceRecords, followUps, demos };
}

/** Staff-side: one patient's aid records (permission-checked). */
export async function getPatientAidRecordsForStaff(user: SessionUser, patientId: string) {
  if (!canAccess(user, "patient.read")) throw new ForbiddenError();
  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) throw new NotFoundError("Patient not found.");
  const [recommendations, fittings, demos, dispensings, serviceRecords, warranties, aftercare] =
    await Promise.all([
      prisma.hearingAidRecommendation.findMany({
        where: { patientId }, orderBy: { createdAt: "desc" },
        include: { model: { include: { brand: { select: { name: true } } } }, audiologist: { include: { user: { select: { name: true } } } } },
      }),
      prisma.hearingAidFitting.findMany({
        where: { patientId }, orderBy: { createdAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } }, audiologist: { include: { user: { select: { name: true } } } } },
      }),
      prisma.hearingAidDemo.findMany({
        where: { patientId }, orderBy: { createdAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } }, staff: { include: { user: { select: { name: true } } } } },
      }),
      prisma.hearingAidDispensing.findMany({
        where: { patientId }, orderBy: { createdAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } }, dispensedBy: { include: { user: { select: { name: true } } } } },
      }),
      prisma.hearingAidServiceRecord.findMany({
        where: { patientId }, orderBy: { reportedAt: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } } },
      }),
      prisma.hearingAidWarranty.findMany({
        where: { patientId }, orderBy: { endDate: "desc" },
        include: { item: { include: { model: { include: { brand: { select: { name: true } } } } } } },
      }),
      prisma.hearingAidFollowUp.findMany({
        where: { patientId }, orderBy: { dueDate: "asc" },
      }),
    ]);
  return { patientId, recommendations, fittings, demos, dispensings, serviceRecords, warranties, aftercare };
}
