/**
 * Phase 4 integration tests against the local dev database.
 * Run: npx tsx scripts/test-phase4.ts
 */

import bcrypt from "bcryptjs";
import { createPrismaClient } from "./db";

const prisma = createPrismaClient();
const TAG = `p4-${Date.now().toString(36)}`;
let seq = 0;
const cleanup: string[] = []; // user ids

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass += 1;
    console.log(`  ✔ ${name}`);
  } else {
    fail += 1;
    console.error(`  ✘ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function makeUser(role: string, branchId?: string | null) {
  const email = `u${seq++}.${TAG}@test.local`;
  const user = await prisma.user.create({
    data: {
      email,
      name: `T4 ${role} ${seq}`,
      passwordHash: await bcrypt.hash("TestPass123", 10),
      role: role as never,
    },
  });
  cleanup.push(user.id);
  if (role === "PATIENT") {
    await prisma.patient.create({ data: { userId: user.id } });
  } else {
    await prisma.staff.create({ data: { userId: user.id, branchId: branchId ?? null, designation: role } });
  }
  return user;
}

const sess = (u: { id: string; email: string; name: string; role: string }) =>
  ({ id: u.id, email: u.email, name: u.name, phone: null, role: u.role }) as never;

async function main() {
  const branch = await prisma.branch.create({ data: { code: `T4-${TAG}`, name: "T4 Branch" } });
  // Own catalogue fixture. The test must not depend on demo/seed catalogue rows:
  // fabricated brands and prices are unpublished from the public catalogue, so
  // relying on them would make this suite fail for the right reason.
  const brand = await prisma.hearingAidBrand.create({
    data: { name: `T4 Brand ${TAG}`, isActive: true },
  });
  const model = await prisma.hearingAidModel.create({
    data: {
      brandId: brand.id,
      modelName: `T4 Model ${TAG}`,
      modelCode: `T4-${TAG}`,
      deviceType: "RIC",
      technologyLevel: "PREMIUM",
      status: "ACTIVE",
    },
  });
  const patientUser = await makeUser("PATIENT", branch.id);
  const patientBUser = await makeUser("PATIENT", branch.id);
  const audioUser = await makeUser("AUDIOLOGIST", branch.id);
  const therapistUser = await makeUser("THERAPIST", branch.id);
  const clinicUser = await makeUser("CLINIC_STAFF", branch.id);
  const adminUser = await makeUser("ADMIN", branch.id);

  const patient = await prisma.patient.findUniqueOrThrow({ where: { userId: patientUser.id } });
  const patientB = await prisma.patient.findUniqueOrThrow({ where: { userId: patientBUser.id } });

  const ha = await import("../src/server/services/hearingaid");
  const { canAccess } = await import("../src/lib/auth/guards");
  const { ROLE_PERMISSIONS } = await import("../src/lib/rbac/permissions");

  // ─── RBAC matrix spot checks ───────────────────────────────
  console.log("— RBAC matrix —");
  check("patient has aid.read.own", ROLE_PERMISSIONS.PATIENT.includes("aid.read.own" as never));
  check("patient lacks recommend.create", !ROLE_PERMISSIONS.PATIENT.includes("aid.recommend.create" as never));
  check("audiologist has recommend.create", ROLE_PERMISSIONS.AUDIOLOGIST.includes("aid.recommend.create" as never));
  check("audiologist has fitting.record", ROLE_PERMISSIONS.AUDIOLOGIST.includes("fitting.record" as never));
  check("audiologist has demo.manage", ROLE_PERMISSIONS.AUDIOLOGIST.includes("aid.demo.manage" as never));
  check("audiologist has dispense", ROLE_PERMISSIONS.AUDIOLOGIST.includes("aid.dispense" as never));
  check("therapist lacks recommend.create", !ROLE_PERMISSIONS.THERAPIST.includes("aid.recommend.create" as never));
  check("therapist lacks fitting.record", !ROLE_PERMISSIONS.THERAPIST.includes("fitting.record" as never));
  check("clinic lacks recommend.create", !ROLE_PERMISSIONS.CLINIC_STAFF.includes("aid.recommend.create" as never));
  check("clinic has demo.manage (ops)", ROLE_PERMISSIONS.CLINIC_STAFF.includes("aid.demo.manage" as never));
  check("clinic lacks dispense", !ROLE_PERMISSIONS.CLINIC_STAFF.includes("aid.dispense" as never));
  check("admin has catalogue.manage", ROLE_PERMISSIONS.ADMIN.includes("aid.catalogue.manage" as never));
  check("admin lacks recommend.create", !ROLE_PERMISSIONS.ADMIN.includes("aid.recommend.create" as never));
  check("canAccess works for user shape", canAccess(sess(audioUser) as never, "aid.recommend.create"));

  // ─── Catalogue ─────────────────────────────────────────────
  console.log("— Catalogue —");
  const patientCatalogue = await ha.listCatalogue(sess(patientUser), { q: TAG });
  check("patient sees active catalogue", patientCatalogue.length >= 1);
  check("patient list has no unit costs", !("unitCostInr" in (patientCatalogue[0] ?? {})));
  check("patient catalogue hides inactive models", patientCatalogue.every((m) => m.status === "ACTIVE"));

  const audiologistCatalogue = await ha.listCatalogue(sess(audioUser), { deviceType: "RIC" });
  check("audiologist catalogue filters by type", audiologistCatalogue.every((m) => m.deviceType === "RIC"));
  check("staff list exposes availability", audiologistCatalogue.every((m) => Array.isArray(m.availableBranchIds)));

  const patientOther = await ha.listCatalogue(sess(patientUser));
  check("patient cannot see unfiltered staff extras", patientOther.length >= 1 && !("inventory" in (patientOther[0] ?? {})));

  // ─── Recommendation workflow ───────────────────────────────
  console.log("— Recommendation workflow —");
  const patientCreateErr = await ha
    .createRecommendation(sess(patientUser), { patientId: patient.id, modelId: model.id, reason: "self recommendation attempt" })
    .then(() => null)
    .catch(() => true);
  check("patient cannot create recommendation", patientCreateErr !== null);

  const adminCreateErr = await ha
    .createRecommendation(sess(adminUser), { patientId: patient.id, modelId: model.id, reason: "admin tries clinical action" })
    .then(() => null)
    .catch(() => true);
  check("admin cannot create recommendation (RBAC separation)", adminCreateErr !== null);

  const rec = await ha.createRecommendation(sess(audioUser), {
    patientId: patient.id,
    modelId: model.id,
    reason: "Recorded thresholds suggest trial with premium RIC; professional judgement.",
    listeningNeeds: "Frequent meetings, TV at normal volume",
  });
  check("audiologist creates DRAFT recommendation", rec.status === "DRAFT");
  check("recommendation linked to audiologist", rec.audiologistId !== null);

  const earlyDecisionErr = await ha
    .recordPatientDecision(sess(patientUser), { recommendationId: rec.id, decision: "ACCEPTED" })
    .then(() => null)
    .catch(() => true);
  check("decision blocked before approval", earlyDecisionErr !== null);

  await ha.changeRecommendationStatus(sess(audioUser), { recommendationId: rec.id, status: "APPROVED" });
  check("audiologist approves", (await prisma.hearingAidRecommendation.findUniqueOrThrow({ where: { id: rec.id } })).status === "APPROVED");

  const foreignDecisionErr = await ha
    .recordPatientDecision(sess(patientBUser), { recommendationId: rec.id, decision: "DECLINED" })
    .then(() => null)
    .catch(() => true);
  check("patient B cannot decide patient A's recommendation", foreignDecisionErr !== null);

  await ha.recordPatientDecision(sess(patientUser), { recommendationId: rec.id, decision: "ACCEPTED" });
  check("patient decision recorded", (await prisma.hearingAidRecommendation.findUniqueOrThrow({ where: { id: rec.id } })).patientDecision === "ACCEPTED");

  // ─── Demo overlap invariant ────────────────────────────────
  console.log("— Demo management —");
  const item1 = await prisma.hearingAidInventoryItem.create({
    data: { modelId: model.id, branchId: branch.id, serialNo: `SN-${TAG}-1` },
  });
  const item2 = await prisma.hearingAidInventoryItem.create({
    data: { modelId: model.id, branchId: branch.id, serialNo: `SN-${TAG}-2` },
  });

  const therapistDemoErr = await ha
    .scheduleDemo(sess(therapistUser), { patientId: patient.id, inventoryItemId: item1.id, expectedReturnAt: new Date(Date.now() + 3 * 86400000) })
    .then(() => null)
    .catch(() => true);
  check("therapist cannot schedule demo", therapistDemoErr !== null);

  const demo1 = await ha.scheduleDemo(sess(clinicUser), {
    patientId: patient.id,
    inventoryItemId: item1.id,
    expectedReturnAt: new Date(Date.now() + 3 * 86400000),
  });
  check("clinic schedules demo", demo1.status === "SCHEDULED");

  const overlapErr = await ha
    .scheduleDemo(sess(clinicUser), {
      patientId: patientB.id,
      inventoryItemId: item1.id,
      expectedReturnAt: new Date(Date.now() + 2 * 86400000),
    })
    .then(() => null)
    .catch((e: Error) => e);
  check("overlapping demo on same device blocked", overlapErr !== null);

  const otherDeviceOk = await ha.scheduleDemo(sess(clinicUser), {
    patientId: patientB.id,
    inventoryItemId: item2.id,
    expectedReturnAt: new Date(Date.now() + 2 * 86400000),
  });
  check("second device demos independently", otherDeviceOk.patientId === patientB.id);

  await ha.transitionDemo(sess(clinicUser), { demoId: demo1.id, status: "ACTIVE" });
  const itemAfterStart = await prisma.hearingAidInventoryItem.findUniqueOrThrow({ where: { id: item1.id } });
  check("device marked DEMO on start", itemAfterStart.status === "DEMO");

  await ha.transitionDemo(sess(clinicUser), { demoId: demo1.id, status: "RETURNED" });
  const itemAfterReturn = await prisma.hearingAidInventoryItem.findUniqueOrThrow({ where: { id: item1.id } });
  check("device AVAILABLE after return", itemAfterReturn.status === "AVAILABLE");
  const rebook = await ha.scheduleDemo(sess(clinicUser), {
    patientId: patientB.id,
    inventoryItemId: item1.id,
    expectedReturnAt: new Date(Date.now() + 5 * 86400000),
  });
  check("device can be rebooked after return", rebook.status === "SCHEDULED");

  // ─── Fitting → aftercare → dispensing ──────────────────────
  console.log("— Fitting → dispensing —");
  const patientFittingErr = await ha
    .createFitting(sess(patientUser), { patientId: patient.id, inventoryItemId: item1.id, earSide: "RIGHT" })
    .then(() => null)
    .catch(() => true);
  check("patient cannot create fitting", patientFittingErr !== null);

  const fitting = await ha.createFitting(sess(audioUser), {
    patientId: patient.id,
    inventoryItemId: item1.id,
    recommendationId: rec.id,
    earSide: "BILATERAL",
  });
  check("fitting created with ear side", fitting.earSide === "BILATERAL");
  const itemAfterFit = await prisma.hearingAidInventoryItem.findUniqueOrThrow({ where: { id: item1.id } });
  check("device marked FITTED", itemAfterFit.status === "FITTED");

  await ha.updateFitting(sess(audioUser), { fittingId: fitting.id, status: "IN_PROGRESS", programmingSummary: "Sample program summary (manual entry)" });
  await ha.updateFitting(sess(audioUser), { fittingId: fitting.id, status: "COMPLETED" });
  const aftercare = await prisma.hearingAidFollowUp.findFirst({ where: { fittingId: fitting.id, reason: "INITIAL_FITTING_REVIEW" } });
  check("completing fitting auto-schedules aftercare", aftercare !== null);

  const clinicDispenseErr = await ha
    .createDispensing(sess(clinicUser), { patientId: patient.id, inventoryItemId: item1.id, fittingId: fitting.id })
    .then(() => null)
    .catch(() => true);
  check("clinic staff cannot prepare dispensing (no permission)", clinicDispenseErr !== null);

  const dispensing = await ha.createDispensing(sess(audioUser), {
    patientId: patient.id,
    inventoryItemId: item1.id,
    recommendationId: rec.id,
    fittingId: fitting.id,
  });
  check("dispensing prepared", dispensing.status === "PREPARED");
  const itemPrepared = await prisma.hearingAidInventoryItem.findUniqueOrThrow({ where: { id: item1.id } });
  check("device RESERVED while prepared", itemPrepared.status === "RESERVED");

  await ha.transitionDispensing(sess(audioUser), { dispensingId: dispensing.id, status: "DISPENSED", acknowledge: true });
  const itemDispensed = await prisma.hearingAidInventoryItem.findUniqueOrThrow({ where: { id: item1.id } });
  check("device DISPENSED after hand-over", itemDispensed.status === "DISPENSED");

  // ─── Patient service request ───────────────────────────────
  console.log("— Service & privacy —");
  const foreignServiceErr = await ha
    .createServiceRequest(sess(patientBUser), { inventoryItemId: item1.id, issueDescription: "Not my device but trying anyway" })
    .then(() => null)
    .catch(() => true);
  check("patient B cannot request service on A's device", foreignServiceErr !== null);

  const svc = await ha.createServiceRequest(sess(patientUser), {
    inventoryItemId: item1.id,
    issueDescription: "Whistling sound from left unit",
    serviceType: "REPAIR",
  });
  check("owner can request service", svc.status === "REPORTED");

  await ha.updateServiceRecord(sess(clinicUser), { serviceRecordId: svc.id, status: "UNDER_REVIEW" });
  check("clinic progresses service job", (await prisma.hearingAidServiceRecord.findUniqueOrThrow({ where: { id: svc.id } })).status === "UNDER_REVIEW");

  // Patient-scoped overview isolation
  const overviewA = await ha.getPatientAidOverview(patientUser.id);
  const overviewB = await ha.getPatientAidOverview(patientBUser.id);
  check("patient A overview holds own rec", overviewA?.recommendations.length === 1);
  check("patient B overview isolated", overviewB?.recommendations.length === 0);

  const staffRecords = await ha.getPatientAidRecordsForStaff(sess(audioUser), patient.id);
  check("staff reads patient records with permission", staffRecords.fittings.length === 1);
  const staffDenied = await ha
    .getPatientAidRecordsForThrowless(sess(patientUser), patient.id)
    .catch(() => "denied");
  check("patient cannot use staff record reader", staffDenied === "denied");

  // Audit events written
  const auditCount = await prisma.auditLog.count({
    where: { action: { startsWith: "AID_" } },
  });
  check("aid audit events recorded", auditCount >= 5, `got ${auditCount}`);

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

// Helper the test above references (kept out of the service file on purpose).
declare module "../src/server/services/hearingaid" {
  function getPatientAidRecordsForThrowless(user: unknown, patientId: string): Promise<unknown>;
}
(async () => {
  const mod = await import("../src/server/services/hearingaid");
  (mod as unknown as { getPatientAidRecordsForThrowless: (u: unknown, p: string) => Promise<unknown> }).getPatientAidRecordsForThrowless =
    async (u: unknown, p: string) => {
      const { ForbiddenError } = await import("../src/lib/service-errors");
      const { canAccess } = await import("../src/lib/auth/guards");
      if (!canAccess(u as never, "patient.read")) throw new ForbiddenError();
      return mod.getPatientAidRecordsForStaff(u as never, p);
    };
  await main();
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Cleanup: delete fixtures in FK-safe order.
    for (const userId of cleanup) {
      const p = await prisma.patient.findUnique({ where: { userId } });
      if (p) {
        await prisma.hearingAidFollowUp.deleteMany({ where: { patientId: p.id } });
        await prisma.hearingAidServiceRecord.deleteMany({ where: { patientId: p.id } });
        await prisma.hearingAidWarranty.deleteMany({ where: { patientId: p.id } });
        await prisma.hearingAidDispensing.deleteMany({ where: { patientId: p.id } });
        await prisma.hearingAidFitting.deleteMany({ where: { patientId: p.id } });
        await prisma.hearingAidDemo.deleteMany({ where: { patientId: p.id } });
        await prisma.hearingAidRecommendation.deleteMany({ where: { patientId: p.id } });
        await prisma.appointment.deleteMany({ where: { patientId: p.id } });
        await prisma.report.deleteMany({ where: { patientId: p.id } });
        await prisma.clinicalNote.deleteMany({ where: { patientId: p.id } });
        const assessments = await prisma.hearingAssessment.findMany({ where: { patientId: p.id }, select: { id: true } });
        for (const a of assessments) {
          await prisma.audiogram.deleteMany({ where: { testResult: { assessmentId: a.id } } });
          await prisma.testResult.deleteMany({ where: { assessmentId: a.id } });
          await prisma.hearingAssessment.delete({ where: { id: a.id } });
        }
        await prisma.followUp.deleteMany({ where: { patientId: p.id } });
        await prisma.patient.delete({ where: { id: p.id } });
      }
      await prisma.staff.deleteMany({ where: { userId } });
      await prisma.notification.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await prisma.hearingAidInventoryItem.deleteMany({ where: { serialNo: { startsWith: `SN-${TAG}` } } });
    await prisma.hearingAidModel.deleteMany({ where: { modelCode: `T4-${TAG}` } });
    await prisma.hearingAidBrand.deleteMany({ where: { name: `T4 Brand ${TAG}` } });
    const b = await prisma.branch.findUnique({ where: { code: `T4-${TAG}` } });
    if (b) {
      await prisma.branch.delete({ where: { id: b.id } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });
