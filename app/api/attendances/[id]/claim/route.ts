import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta } from '@/lib/auth/session';
import { writeAuditLogTx } from '@/lib/services/audit';
import { withErrorHandling } from '@/lib/api/http';
import { requireApiAuth } from '@/lib/auth/api-guards';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAuth();

    const meta = getClientMeta();
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.attendance.updateMany({
        where: { id: params.id, assignedTo: null },
        data: { assignedTo: session.userId, assignedAt: new Date(), status: 'EM_ATENDIMENTO', updatedBy: session.userId }
      });
      if (updated.count === 0) return null;

      const attendance = await tx.attendance.findUnique({ where: { id: params.id } });
      if (!attendance) return null;

      await tx.attendanceHistory.create({ data: { attendanceId: params.id, actionType: 'CLAIMED', description: 'Atendimento assumido', performedBy: session.userId } });
      await writeAuditLogTx(tx, {
        actorUserId: session.userId,
        entityType: 'ATTENDANCE',
        entityId: params.id,
        action: 'CLAIM',
        newValues: { assignedTo: session.userId },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });

      return attendance;
    });

    if (!result) return NextResponse.json({ error: 'Atendimento já foi assumido por outro atendente' }, { status: 409 });

    return NextResponse.json(result);
  });
}
