import { prisma } from '@/lib/db/prisma';

export async function writeAuditLog(params: {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      oldValues: params.oldValues as never,
      newValues: params.newValues as never,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    }
  });
}
