/**
 * Integration tests for Phases 2–3 against the local dev database.
 * Run: npx tsx scripts/test-phases-2-3.ts
 * Creates and cleans up its own fixtures (tagged emails), no real data touched.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

const TAG = `${Date.now().toString(36)}`;
let userSeq = 0;

/**
 * Slot dates must be in the future — `bookAppointment` correctly refuses a slot
 * whose start time has already passed, so a hardcoded date silently turns into
 * a failing suite once that day goes by.
 */
function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const cleanupIds: { email: string }[] = [];

async function makeUser(role: string, branchId?: string) {
  const email = `${role.toLowerCase()}.${TAG}.${userSeq++}@test.local`;
  cleanupIds.push({ email });
  const user = await prisma.user.create({
    data: {
      email,
      name: `Test ${role}`,
      passwordHash: await bcrypt.hash("TestPass123", 10),
      role: role as never,
    },
  });
  if (role === "PATIENT") {
    await prisma.patient.create({ data: { userId: user.id } });
  } else {
    await prisma.staff.create({
      data: { userId: user.id, branchId: branchId ?? null, designation: role },
    });
  }
  return user;
}

async function main() {
  console.log("— Fixtures —");
  const branch = await prisma.branch.create({
    data: { code: `T-${TAG}`, name: "Test Branch" },
  });
  const service = await prisma.service.create({
    data: { code: `TSVC-${TAG}`, name: "Test Service", category: "HEARING_TEST", durationMinutes: 30 },
  });
  const patientUser = await makeUser("PATIENT");
  const patient = await prisma.patient.findUniqueOrThrow({ where: { userId: patientUser.id } });
  const audiologist = await makeUser("AUDIOLOGIST", branch.id);
  const clinic = await makeUser("CLINIC_STAFF", branch.id);
  const otherBranchStaff = await makeUser("CLINIC_STAFF"); // no branch
  const admin = await makeUser("ADMIN", branch.id);
  const audiologistSession = { id: audiologist.id, email: audiologist.email, name: audiologist.name, phone: null, role: "AUDIOLOGIST" as const };
  const patientSession = { id: patientUser.id, email: patientUser.email, name: patientUser.name, phone: null, role: "PATIENT" as const };
  const clinicSession = { id: clinic.id, email: clinic.email, name: clinic.name, phone: null, role: "CLINIC_STAFF" as const };
  const noBranchSession = { id: otherBranchStaff.id, email: otherBranchStaff.email, name: otherBranchStaff.name, phone: null, role: "CLINIC_STAFF" as const };
  const adminSession = { id: admin.id, email: admin.email, name: admin.name, phone: null, role: "ADMIN" as const };

  // ─── Scheduling ──────────────────────────────────────────────
  console.log("— Scheduling —");
  const { generateSlots, bookAppointment, changeAppointmentStatus, SlotUnavailableError } = await import("../src/server/services/scheduling");

  const created = await generateSlots(clinicSession, {
    branchId: branch.id, serviceId: service.id, date: futureDate(7), startTime: "09:00", endTime: "11:00", slotMinutes: 30,
  });
  check("slot generation creates 4 slots", created === 4, `got ${created}`);

  const again = await generateSlots(clinicSession, {
    branchId: branch.id, serviceId: service.id, date: futureDate(7), startTime: "09:00", endTime: "11:00", slotMinutes: 30,
  });
  check("slot regeneration is idempotent", again === 0, `got ${again}`);

  const slots = await prisma.appointmentSlot.findMany({ where: { branchId: branch.id }, orderBy: { startsAt: "asc" } });

  const appt = await bookAppointment(patientSession, { slotId: slots[0].id, serviceId: service.id });
  check("patient books an open slot", !!appt.id);
  const slotAfter = await prisma.appointmentSlot.findUniqueOrThrow({ where: { id: slots[0].id } });
  check("slot flips to BOOKED", slotAfter.status === "BOOKED");

  try {
    await bookAppointment(patientSession, { slotId: slots[0].id, serviceId: service.id });
    check("double-booking rejected", false);
  } catch (e) {
    check("double-booking rejected", e instanceof SlotUnavailableError);
  }

  // Race: two bookings on the same fresh slot — exactly one must win.
  const fresh = slots[1];
  const [a, b] = await Promise.allSettled([
    bookAppointment(patientSession, { slotId: fresh.id, serviceId: service.id }),
    bookAppointment(patientSession, { slotId: fresh.id, serviceId: service.id }),
  ]);
  const winners = [a, b].filter((r) => r.status === "fulfilled");
  check("concurrent double-book: exactly one wins", winners.length === 1, `${winners.length} won`);

  const notifCount = await prisma.notification.count({ where: { userId: patientUser.id } });
  check("booking created a notification", notifCount >= 1);

  // Status machine
  const transitionErr = await changeAppointmentStatus(clinicSession, { appointmentId: appt.id, status: "COMPLETED" })
    .then(() => null)
    .catch((e: Error) => e);
  check("illegal transition BOOKED→COMPLETED rejected", transitionErr !== null);

  await changeAppointmentStatus(clinicSession, { appointmentId: appt.id, status: "CANCELLED", cancelReason: "test" });
  const freed = await prisma.appointmentSlot.findUniqueOrThrow({ where: { id: slots[0].id } });
  check("cancel frees the slot", freed.status === "OPEN");

  // Cross-branch denial
  const denialErr = await changeAppointmentStatus(noBranchSession, { appointmentId: appt.id, status: "CHECKED_IN" })
    .then(() => null)
    .catch((e: Error) => e);
  check("staff without branch access denied", denialErr !== null);

  // Patient can't use staff booking path
  const { bookForPatient } = await import("../src/server/services/scheduling");
  const patientStaffErr = await bookForPatient(patientSession, { patientId: patient.id, slotId: slots[2].id, serviceId: service.id })
    .then(() => null)
    .catch((e: Error) => e);
  check("patient cannot book on behalf of others", patientStaffErr !== null);

  // ─── Clinical chain ──────────────────────────────────────────
  console.log("— Clinical chain —");
  const clinical = await import("../src/server/services/clinical");

  const assessment = await clinical.createAssessment(audiologistSession, {
    patientId: patient.id, complaints: "Difficulty hearing in crowds", history: "Progressive, bilateral",
  });
  check("audiologist creates draft assessment", assessment.status === "DRAFT");

  const patientCreateErr = await clinical.createAssessment(patientSession, { patientId: patient.id })
    .then(() => null)
    .catch(() => true);
  check("patient cannot create assessments", patientCreateErr !== null);

  // Record PTA → audiogram auto-created
  const ptaPayload = {
    air: { right: { f250: 25, f500: 30, f1000: 40, f2000: 45, f4000: 60, f8000: 65 }, left: { f250: 20, f500: 25, f1000: 35, f2000: 40, f4000: 55, f8000: 60 } },
    bone: { right: { f500: 10, f1000: 10, f2000: 15 }, left: { f500: 10, f1000: 15, f2000: 15 } },
    maskingApplied: false,
  };
  const pta = await clinical.recordTestResult(audiologistSession, { testType: "PTA", assessmentId: assessment.id, payload: ptaPayload });
  const audiogram = await prisma.audiogram.findUnique({ where: { testResultId: pta.id } });
  check("PTA saves and auto-creates audiogram", audiogram !== null);

  // Invalid threshold rejected
  const badThresholdErr = await clinical.recordTestResult(audiologistSession, {
    testType: "PTA", assessmentId: assessment.id,
    payload: { air: { right: { f500: 500 } } },
  }).then(() => null).catch(() => true);
  check("invalid threshold (>120 dB) rejected", badThresholdErr !== null);

  await clinical.recordTestResult(audiologistSession, {
    testType: "SPEECH", assessmentId: assessment.id,
    payload: { srtRight: 40, wrsRight: 76 },
  });
  check("speech test recorded", (await prisma.testResult.count({ where: { assessmentId: assessment.id } })) === 2);

  // Complete → review → report
  const completeErr = await clinical.markAssessmentComplete(audiologistSession, { assessmentId: assessment.id }).then(() => null).catch((e: Error) => e);
  check("assessment completes with tests", completeErr === null);

  const earlyReportErr = await clinical.generateReport(audiologistSession, { assessmentId: assessment.id, title: "Early" })
    .then(() => null).catch(() => true);
  check("report before review rejected", earlyReportErr !== null);

  await clinical.reviewAssessment(audiologistSession, {
    assessmentId: assessment.id,
    reviewText: "Bilateral sensorineural pattern noted per recorded thresholds; recommend hearing aid trial.",
  });
  const reviewed = await prisma.hearingAssessment.findUniqueOrThrow({ where: { id: assessment.id } });
  check("review moves to REVIEWED with reviewer", reviewed.status === "REVIEWED" && reviewed.reviewedById !== null);

  const report = await clinical.generateReport(audiologistSession, { assessmentId: assessment.id, title: "Hearing Assessment Report", finalize: true });
  check("report generated + finalized", report.status === "FINAL");

  const reported = await prisma.hearingAssessment.findUniqueOrThrow({ where: { id: assessment.id } });
  check("assessment locked as REPORTED", reported.status === "REPORTED");

  // Patient access: own FINAL report OK, others denied
  const ownReport = await clinical.getReportForUser(patientSession, report.id);
  check("patient reads own final report", ownReport.id === report.id);

  const secondPatientUser = await makeUser("PATIENT");
  const secondSession = { id: secondPatientUser.id, email: secondPatientUser.email, name: secondPatientUser.name, phone: null, role: "PATIENT" as const };
  const foreignErr = await clinical.getReportForUser(secondSession, report.id).then(() => null).catch(() => true);
  check("patient denied another patient's report", foreignErr !== null);

  // Patient can't record tests or review
  const patientTestErr = await clinical.recordTestResult(patientSession, { testType: "OAE", assessmentId: assessment.id, payload: { rightPresent: true } })
    .then(() => null).catch(() => true);
  check("patient cannot record tests", patientTestErr !== null);

  const patientReviewErr = await clinical.reviewAssessment(patientSession, { assessmentId: assessment.id, reviewText: "self-review" })
    .then(() => null).catch(() => true);
  check("patient cannot review assessments", patientReviewErr !== null);

  // Admin CAN read org-wide (patient.read) but cannot review clinically
  const adminReviewErr = await clinical.reviewAssessment(adminSession, { assessmentId: assessment.id, reviewText: "admin conclusion" })
    .then(() => null).catch(() => true);
  check("admin cannot write clinical reviews", adminReviewErr !== null);

  // Assessment visibility guard
  const foreignViewErr = await clinical
    .getAssessmentForUser(secondSession, assessment.id)
    .then((a) => {
      clinical.assertCanViewAssessment(secondSession, a);
      return "allowed";
    })
    .catch(() => "denied");
  check("foreign patient view denied", foreignViewErr === "denied");

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Cleanup fixtures
    for (const { email } of cleanupIds) {
      const u = await prisma.user.findUnique({ where: { email } });
      if (u) {
        const p = await prisma.patient.findUnique({ where: { userId: u.id } });
        if (p) {
          await prisma.report.deleteMany({ where: { patientId: p.id } });
          await prisma.clinicalNote.deleteMany({ where: { patientId: p.id } });
          const assessments = await prisma.hearingAssessment.findMany({ where: { patientId: p.id }, select: { id: true } });
          for (const a of assessments) {
            await prisma.audiogram.deleteMany({ where: { testResult: { assessmentId: a.id } } });
            await prisma.testResult.deleteMany({ where: { assessmentId: a.id } });
            await prisma.hearingAssessment.delete({ where: { id: a.id } });
          }
          await prisma.followUp.deleteMany({ where: { patientId: p.id } });
          await prisma.appointment.deleteMany({ where: { patientId: p.id } });
          await prisma.patient.delete({ where: { id: p.id } });
        }
        await prisma.staff.deleteMany({ where: { userId: u.id } });
        await prisma.notification.deleteMany({ where: { userId: u.id } });
        await prisma.user.delete({ where: { id: u.id } });
      }
    }
    const b = await prisma.branch.findUnique({ where: { code: `T-${TAG}` } });
    if (b) {
      await prisma.appointment.deleteMany({ where: { branchId: b.id } });
      await prisma.appointmentSlot.deleteMany({ where: { branchId: b.id } });
      await prisma.branchService.deleteMany({ where: { branchId: b.id } });
      await prisma.branch.delete({ where: { id: b.id } }).catch(() => undefined);
    }
    await prisma.service.deleteMany({ where: { code: `TSVC-${TAG}` } });
    await prisma.$disconnect();
  });
