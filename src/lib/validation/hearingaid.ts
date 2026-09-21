import { z } from "zod";

/**
 * Phase 4 hearing-aid lifecycle validation. All staff actions are additionally
 * permission-checked in the service layer; patients are scoped to own records.
 */

const cuid = z.string().cuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

// ─── Catalogue ───────────────────────────────────────────────────────────────

export const brandUpsertSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(2).max(80),
  description: optionalText(600),
  website: z.string().trim().url("Enter a valid URL").max(200).optional().or(z.literal("")),
  logoUrl: z.string().trim().max(300).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});
export type BrandUpsertInput = z.infer<typeof brandUpsertSchema>;

export const modelUpsertSchema = z.object({
  id: cuid.optional(),
  brandId: cuid,
  modelName: z.string().trim().min(2).max(80),
  modelCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only")
    .transform((v) => v.toUpperCase()),
  deviceType: z.enum(["BTE", "RIC", "ITE", "ITC", "CIC", "IIC"]),
  technologyLevel: z.enum(["PREMIUM", "ADVANCED", "MID", "ESSENTIAL"]),
  description: optionalText(800),
  priceInr: z.coerce.number().int().min(0).max(10_000_000).optional(),
  warrantyMonths: z.coerce.number().int().min(0).max(120).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  featureKeys: z.array(z.string().trim().max(40)).max(30).default([]),
});
export type ModelUpsertInput = z.infer<typeof modelUpsertSchema>;

// ─── Inventory ───────────────────────────────────────────────────────────────

export const inventoryItemUpsertSchema = z.object({
  id: cuid.optional(),
  modelId: cuid,
  branchId: cuid,
  serialNo: z.string().trim().min(3).max(60),
  condition: z.enum(["NEW", "REFURBISHED", "USED", "DAMAGED"]).default("NEW"),
  acquiredNote: optionalText(200),
  unitCostInr: z.coerce.number().int().min(0).max(10_000_000).optional(),
  notes: optionalText(300),
});
export type InventoryItemUpsertInput = z.infer<typeof inventoryItemUpsertSchema>;

export const inventoryStatusSchema = z.object({
  itemId: cuid,
  status: z.enum(["AVAILABLE", "RESERVED", "DEMO", "FITTED", "DISPENSED", "REPAIR", "RETIRED"]),
});

// ─── Recommendation ──────────────────────────────────────────────────────────

export const recommendationCreateSchema = z.object({
  patientId: cuid,
  assessmentId: cuid.optional(),
  modelId: cuid,
  reason: z.string().trim().min(10, "Record the professional rationale (min 10 chars)").max(1000),
  listeningNeeds: optionalText(600),
  communicationPrefs: optionalText(600),
  handlingNotes: optionalText(600),
  professionalConsiderations: optionalText(600),
  followUpPlan: optionalText(400),
});
export type RecommendationCreateInput = z.infer<typeof recommendationCreateSchema>;

export const recommendationStatusSchema = z.object({
  recommendationId: cuid,
  status: z.enum(["UNDER_REVIEW", "APPROVED", "DECLINED", "EXPIRED", "CANCELLED"]),
});

export const recommendationDecisionSchema = z.object({
  recommendationId: cuid,
  decision: z.enum(["PENDING", "ACCEPTED", "DECLINED", "NEEDS_REVIEW"]),
});

// ─── Demo ────────────────────────────────────────────────────────────────────

export const demoScheduleSchema = z
  .object({
    patientId: cuid,
    inventoryItemId: cuid,
    expectedReturnAt: z.coerce.date(),
    notes: optionalText(400),
  })
  .refine(
    (v) => v.expectedReturnAt.getTime() > Date.now(),
    { message: "Expected return must be in the future", path: ["expectedReturnAt"] },
  );
export type DemoScheduleInput = z.infer<typeof demoScheduleSchema>;

export const demoTransitionSchema = z.object({
  demoId: cuid,
  status: z.enum(["ACTIVE", "RETURNED", "CANCELLED", "OVERDUE"]),
  patientFeedback: optionalText(600),
});

// ─── Fitting ─────────────────────────────────────────────────────────────────

export const fittingCreateSchema = z.object({
  patientId: cuid,
  inventoryItemId: cuid,
  recommendationId: cuid.optional(),
  assessmentId: cuid.optional(),
  earSide: z.enum(["RIGHT", "LEFT", "BILATERAL"]),
  fittingDate: z.coerce.date().optional(),
  notes: optionalText(400),
});
export type FittingCreateInput = z.infer<typeof fittingCreateSchema>;

export const fittingUpdateSchema = z.object({
  fittingId: cuid,
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "FOLLOW_UP_REQUIRED", "CANCELLED"]).optional(),
  programmingSummary: optionalText(600),
  verificationNotes: optionalText(600),
  patientFeedback: optionalText(600),
  followUpDate: z.coerce.date().optional(),
});

// ─── Dispensing ──────────────────────────────────────────────────────────────

export const dispensingCreateSchema = z.object({
  patientId: cuid,
  inventoryItemId: cuid,
  recommendationId: cuid.optional(),
  fittingId: cuid.optional(),
  notes: optionalText(400),
});
export type DispensingCreateInput = z.infer<typeof dispensingCreateSchema>;

export const dispensingTransitionSchema = z.object({
  dispensingId: cuid,
  status: z.enum(["DISPENSED", "CANCELLED", "RETURNED"]),
  acknowledge: z.coerce.boolean().optional(),
});

// ─── Warranty ────────────────────────────────────────────────────────────────

export const warrantyUpsertSchema = z
  .object({
    id: cuid.optional(),
    patientId: cuid,
    inventoryItemId: cuid,
    provider: z.string().trim().min(2).max(120),
    reference: optionalText(60),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    coverageNotes: optionalText(400),
    status: z.enum(["ACTIVE", "EXPIRED", "CLAIM_IN_PROGRESS", "CLOSED"]).default("ACTIVE"),
  })
  .refine((v) => v.endDate.getTime() > v.startDate.getTime(), {
    message: "End date must be after start date",
    path: ["endDate"],
  });
export type WarrantyUpsertInput = z.infer<typeof warrantyUpsertSchema>;

// ─── Service / repair ────────────────────────────────────────────────────────

export const serviceRequestSchema = z.object({
  inventoryItemId: cuid,
  issueDescription: z.string().trim().min(10, "Describe the issue (min 10 chars)").max(600),
  serviceType: z.enum(["REPAIR", "CLEANING", "PART_REPLACE", "CHECKUP"]).default("REPAIR"),
});
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

export const serviceUpdateSchema = z.object({
  serviceRecordId: cuid,
  status: z
    .enum(["REPORTED", "UNDER_REVIEW", "SENT_FOR_REPAIR", "REPAIRED", "READY_FOR_COLLECTION", "COMPLETED", "CANCELLED"])
    .optional(),
  assignedStaffId: cuid.optional(),
  resolutionNotes: optionalText(600),
});

// ─── Aftercare ───────────────────────────────────────────────────────────────

export const aftercareCreateSchema = z.object({
  patientId: cuid,
  fittingId: cuid.optional(),
  inventoryItemId: cuid.optional(),
  reason: z.enum([
    "INITIAL_FITTING_REVIEW",
    "COMFORT_REVIEW",
    "LISTENING_REVIEW",
    "CLEANING_GUIDANCE",
    "BATTERY_CHARGING_GUIDANCE",
    "DEVICE_MAINTENANCE",
    "OTHER",
  ]),
  dueDate: z.coerce.date(),
  notes: optionalText(400),
});
export type AftercareCreateInput = z.infer<typeof aftercareCreateSchema>;

export const aftercareUpdateSchema = z.object({
  followUpId: cuid,
  status: z.enum(["PENDING", "SCHEDULED", "DONE", "CANCELLED"]).optional(),
  outcome: optionalText(600),
  dueDate: z.coerce.date().optional(),
});

// ─── Shared ──────────────────────────────────────────────────────────────────

/** Flatten a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
