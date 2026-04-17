import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

type AuditParams = {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuditClient = PrismaClient | Prisma.TransactionClient;

async function writeWithClient(client: AuditClient, params: AuditParams) {
  await client.auditLog.create({
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

export async function writeAuditLog(params: AuditParams) {
  await writeWithClient(prisma, params);
}

export async function writeAuditLogTx(client: Prisma.TransactionClient, params: AuditParams) {
  await writeWithClient(client, params);
}
