import { z } from "zod";

/**
 * Clinical payloads are typed per test. These models store RECORDED DATA only —
 * no automatic interpretation or diagnosis. All clinical conclusions are
 * entered by authorized professionals.
 */

export const AUDIO_FREQS = [250, 500, 1000, 2000, 4000, 8000] as const;
export type AudioFreq = (typeof AUDIO_FREQS)[number];

/** Threshold in dB HL. Audiometric range −10…120. */
const threshold = z.coerce
  .number()
  .int("Thresholds are whole numbers")
  .min(-10, "Threshold must be ≥ −10 dB HL")
  .max(120, "Threshold must be ≤ 120 dB HL");

/** Thresholds per frequency; missing entries are simply absent (not measured). */
const earThresholds = z
  .object({
    f250: threshold.optional(),
    f500: threshold.optional(),
    f1000: threshold.optional(),
    f2000: threshold.optional(),
    f4000: threshold.optional(),
    f8000: threshold.optional(),
  })
  .partial();

export const ptaPayloadSchema = z
  .object({
    air: z.object({
      right: earThresholds,
      left: earThresholds,
    }),
    bone: z
      .object({
        right: earThresholds,
        left: earThresholds,
      })
      .optional(),
    maskingApplied: z.boolean().optional().default(false),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) =>
      Object.keys(v.air.right).length + Object.keys(v.air.left).length > 0,
    { message: "Record at least one air-conduction threshold", path: ["air"] },
  );
export type PtaPayload = z.infer<typeof ptaPayloadSchema>;

export const speechPayloadSchema = z.object({
  srtRight: threshold.optional(),
  srtLeft: threshold.optional(),
  wrsRight: z.coerce.number().int().min(0).max(100).optional(),
  wrsLeft: z.coerce.number().int().min(0).max(100).optional(),
  satRight: threshold.optional(),
  satLeft: threshold.optional(),
  notes: z.string().trim().max(500).optional(),
});
export type SpeechPayload = z.infer<typeof speechPayloadSchema>;

export const tympanometryPayloadSchema = z.object({
  rightType: z.enum(["A", "AS", "AD", "B", "C"]).optional(),
  leftType: z.enum(["A", "AS", "AD", "B", "C"]).optional(),
  rightCompliance: z.coerce.number().min(0).max(10).optional(),
  leftCompliance: z.coerce.number().min(0).max(10).optional(),
  rightEarCanalVolume: z.coerce.number().min(0).max(10).optional(),
  leftEarCanalVolume: z.coerce.number().min(0).max(10).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type TympanometryPayload = z.infer<typeof tympanometryPayloadSchema>;

export const abrPayloadSchema = z.object({
  rightLatency: z.coerce.number().min(0).max(20).optional(),
  leftLatency: z.coerce.number().min(0).max(20).optional(),
  rightThreshold: threshold.optional(),
  leftThreshold: threshold.optional(),
  notes: z.string().trim().max(500).optional(),
});
export type AbrPayload = z.infer<typeof abrPayloadSchema>;

export const oaePayloadSchema = z.object({
  rightPresent: z.boolean().optional(),
  leftPresent: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type OaePayload = z.infer<typeof oaePayloadSchema>;

export const vestibularPayloadSchema = z.object({
  findings: z.string().trim().min(1).max(2000),
});
export type VestibularPayload = z.infer<typeof vestibularPayloadSchema>;

export const tinnitusPayloadSchema = z.object({
  earSide: z.enum(["RIGHT", "LEFT", "BOTH"]).optional(),
  pitchHz: z.coerce.number().min(20).max(20000).optional(),
  loudness: z.coerce.number().int().min(0).max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type TinnitusPayload = z.infer<typeof tinnitusPayloadSchema>;

export const specializedPayloadSchema = z.object({
  findings: z.string().trim().min(1).max(2000),
});
export type SpecializedPayload = z.infer<typeof specializedPayloadSchema>;

/** Discriminated union over every supported test kind (assessmentId included). */
const assessmentIdField = z.string().cuid();
export const testResultSchema = z.discriminatedUnion("testType", [
  z.object({ testType: z.literal("PTA"), assessmentId: assessmentIdField, payload: ptaPayloadSchema }),
  z.object({ testType: z.literal("SPEECH"), assessmentId: assessmentIdField, payload: speechPayloadSchema }),
  z.object({ testType: z.literal("TYMPANOMETRY"), assessmentId: assessmentIdField, payload: tympanometryPayloadSchema }),
  z.object({ testType: z.literal("ABR"), assessmentId: assessmentIdField, payload: abrPayloadSchema }),
  z.object({ testType: z.literal("OAE"), assessmentId: assessmentIdField, payload: oaePayloadSchema }),
  z.object({ testType: z.literal("VESTIBULAR"), assessmentId: assessmentIdField, payload: vestibularPayloadSchema }),
  z.object({ testType: z.literal("TINNITUS"), assessmentId: assessmentIdField, payload: tinnitusPayloadSchema }),
  z.object({ testType: z.literal("SPECIALIZED"), assessmentId: assessmentIdField, payload: specializedPayloadSchema }),
]);
export type TestResultInput = z.infer<typeof testResultSchema>;

// ─── Assessments ─────────────────────────────────────────────────────────────

export const assessmentCreateSchema = z.object({
  patientId: z.string().cuid(),
  appointmentId: z.string().cuid().optional(),
  complaints: z.string().trim().max(1000).optional().or(z.literal("")),
  history: z.string().trim().max(2000).optional().or(z.literal("")),
  referredBy: z.string().trim().max(120).optional().or(z.literal("")),
});
export type AssessmentCreateInput = z.infer<typeof assessmentCreateSchema>;

export const assessmentHistorySchema = z.object({
  assessmentId: z.string().cuid(),
  complaints: z.string().trim().max(1000).optional().or(z.literal("")),
  history: z.string().trim().max(2000).optional().or(z.literal("")),
  referredBy: z.string().trim().max(120).optional().or(z.literal("")),
});

export const assessmentMarkCompleteSchema = z.object({
  assessmentId: z.string().cuid(),
});

export const assessmentReviewSchema = z.object({
  assessmentId: z.string().cuid(),
  reviewText: z.string().trim().min(5, "Review text is required").max(4000),
});

// ─── Notes & reports ─────────────────────────────────────────────────────────

export const noteCreateSchema = z.object({
  patientId: z.string().cuid(),
  assessmentId: z.string().cuid().optional(),
  body: z.string().trim().min(3, "Note text is required").max(5000),
  sign: z.coerce.boolean().default(false),
});
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;

export const reportGenerateSchema = z.object({
  assessmentId: z.string().cuid(),
  title: z.string().trim().min(3).max(150),
  finalize: z.coerce.boolean().default(false),
});
export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;

export const reportFinalizeSchema = z.object({
  reportId: z.string().cuid(),
});

// ─── Errors ──────────────────────────────────────────────────────────────────

/** Flatten a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
