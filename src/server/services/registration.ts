/**
 * ⚠️ DEFERRED — NOT WIRED TO ANY ROUTE.
 *
 * Patient self-registration is not part of the current product: visitors book as
 * guests and never create an account. The `/register` page and its server action
 * were removed, so nothing in the app calls `registerPatient` any more.
 *
 * This module is kept because it is correct, tested work that a future phase may
 * want back — but it must not be re-exposed without a deliberate decision, since
 * it is the one place that can create a PATIENT account. See docs/RBAC.md
 * (deferred roles) and docs/SCOPE-REVISION.md.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { hashPassword } from "@/server/auth/password";
import { recordAuditEventSafe } from "@/lib/audit";

export type RegistrationResult =
  | { ok: true; userId: string }
  | { ok: false; errors: Record<string, string> };

/**
 * Patient self-registration. Creates User (role PATIENT) + Patient profile in
 * one transaction. Duplicate email/phone return field-level errors — the
 * message wording avoids confirming whether an *account* exists beyond what
 * the field itself reveals (industry-standard tradeoff for signup UX).
 */
export async function registerPatient(
  input: unknown,
  requestMeta?: { ip?: string; userAgent?: string },
): Promise<RegistrationResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }

  const { name, email, phone, password } = parsed.data as RegisterInput;

  // Duplicate check before hashing (avoid wasted bcrypt work; no enumeration
  // beyond the field-level message, which signup forms conventionally show).
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true, phone: true },
  });
  if (existing) {
    const errors: Record<string, string> = {};
    if (existing.email === email) errors.email = "This email is already registered";
    if (existing.phone === phone) errors.phone = "This mobile number is already registered";
    await recordAuditEventSafe({
      action: "auth.register.duplicate",
      entityType: "User",
      metadata: { via: "patient_registration" },
      ...requestMeta,
    });
    return { ok: false, errors };
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: "PATIENT",
        },
        select: { id: true },
      });
      await tx.patient.create({
        data: { userId: created.id },
      });
      return created;
    });

    await recordAuditEventSafe({
      action: "auth.register.success",
      actorId: user.id,
      entityType: "User",
      entityId: user.id,
      metadata: { role: "PATIENT" },
      ...requestMeta,
    });

    return { ok: true, userId: user.id };
  } catch (error) {
    // Race with a concurrent signup hitting the unique constraints
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[])
        : [];
      const errors: Record<string, string> = {};
      if (target.includes("email")) errors.email = "This email is already registered";
      if (target.includes("phone")) errors.phone = "This mobile number is already registered";
      if (!errors.email && !errors.phone) errors.form = "Account could not be created";
      return { ok: false, errors };
    }
    console.error("registerPatient failed:", error);
    return {
      ok: false,
      errors: { form: "Something went wrong creating your account. Please try again." },
    };
  }
}
