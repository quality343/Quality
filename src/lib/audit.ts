import { recordAuditEvent } from "@/server/db/audit";

type AuditEvent = {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

/**
 * Fire-and-forget audit logging for security-relevant events.
 * Failures are swallowed (and should be reported via monitoring once wired) so
 * that audit issues never block critical clinical flows. Metadata must not
 * contain PHI — pass entity type + id only.
 */
export async function recordAuditEventSafe(event: AuditEvent): Promise<void> {
  try {
    await recordAuditEvent(event);
  } catch {
    // Intentionally ignore: audit must not break business flow. Monitoring hook lands in Phase 2.
  }
}
