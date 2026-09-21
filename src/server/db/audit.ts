import { Prisma } from "@prisma/client";
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
      metadata:
        event.metadata === undefined
          ? undefined
          : (JSON.parse(JSON.stringify(event.metadata)) as Prisma.InputJsonValue),
      ip: event.ip,
      userAgent: event.userAgent,
    },
  });
}
