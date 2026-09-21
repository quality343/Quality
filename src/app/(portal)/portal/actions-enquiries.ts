"use server";

/**
 * Admin enquiry actions. Every call re-checks the session role server-side;
 * unauthorized attempts are audited. Status transitions only — enquiry content
 * is never editable (it is a record of what the visitor submitted).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { recordAuditEventSafe } from "@/lib/audit";
import { requireRole } from "@/lib/auth/guards";
import { NotFoundError, ValidationError } from "@/lib/service-errors";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
});

export async function updateEnquiryStatusAction(raw: unknown) {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationError("Invalid enquiry update.");

  const enquiry = await prisma.contactEnquiry.findUnique({ where: { id: parsed.data.id } });
  if (!enquiry) throw new NotFoundError("Enquiry");

  await prisma.contactEnquiry.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  await recordAuditEventSafe({
    actorId: user.id,
    action: "ENQUIRY_STATUS_UPDATED",
    entityType: "ContactEnquiry",
    entityId: parsed.data.id,
    metadata: { from: enquiry.status, to: parsed.data.status },
  });

  revalidatePath("/portal/admin/enquiries");
  return { ok: true as const };
}
