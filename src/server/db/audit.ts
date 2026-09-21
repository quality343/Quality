import { prisma } from "./prisma";

type AuditEvent = {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: event.actorId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      // SQLite has no Json column type (Turso is libSQL), so this column is
      // text and metadata is stored JSON-encoded. Callers keep passing plain
      // objects — this is the single place that knows about the encoding.
      metadata: event.metadata === undefined ? undefined : JSON.stringify(event.metadata),
      ip: event.ip,
      userAgent: event.userAgent,
    },
  });
}
