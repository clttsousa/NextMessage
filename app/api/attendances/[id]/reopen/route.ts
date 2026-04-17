import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta } from '@/lib/auth/session';
import { writeAuditLogTx } from '@/lib/services/audit';
import { withErrorHandling, AppError } from '@/lib/api/http';
import { requireApiAdmin } from '@/lib/auth/api-guards';
import { getReopenStatus } from '@/lib/services/attendance/rules';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAdmin();

    const before = await prisma.attendance.findUnique({ where: { id: params.id } });
    if (!before) throw new AppError(404, 'Atendimento não encontrado');

    const reopenedStatus = getReopenStatus(before.assignedTo);
    const meta = getClientMeta();

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.attendance.update({
        where: { id: params.id },
        data: {
          status: reopenedStatus,
          closedAt: null,
          closedBy: null,
          canceledAt: null,
          canceledBy: null,
          updatedBy: session.userId
        }
      });

      await tx.attendanceHistory.create({ data: { attendanceId: params.id, actionType: 'REOPENED', description: `Atendimento reaberto para ${reopenedStatus}`, performedBy: session.userId } });
      await writeAuditLogTx(tx, {
        actorUserId: session.userId,
        entityType: 'ATTENDANCE',
        entityId: params.id,
        action: 'REOPEN',
        oldValues: before,
        newValues: changed,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
      return changed;
    });

    return NextResponse.json(updated);
  });
}
