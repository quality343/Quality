import type { UserRole } from "@prisma/client";
import { recordAuditEventSafe } from "@/lib/audit";

/**
 * Portal layouts call this ONLY when a cross-role attempt is detected
 * (requireRole would redirect). Routine, authorized portal loads are NOT
 * audited — that would flood the audit trail with noise.
 *
 * The current requireRole() redirects before returning, so the layouts pass
 * the *attempted* area + the user's actual role when they detect a mismatch
 * themselves. This helper exists so Phase 2 service-layer checks reuse the
 * same event vocabulary.
 */
export async function recordPortalAccessDenied(
  actorId: string,
  attemptedArea: string,
  actualRole: UserRole,
): Promise<void> {
  await recordAuditEventSafe({
    action: "portal.access.denied",
    actorId,
    entityType: "PortalArea",
    entityId: attemptedArea,
    metadata: { actualRole },
  });
}
