import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta, getSession } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/services/audit';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.attendance.updateMany({
      where: { id: params.id, assignedTo: null },
      data: { assignedTo: session.userId, assignedAt: new Date(), status: 'EM_ATENDIMENTO', updatedBy: session.userId }
    });
    if (updated.count === 0) return null;

    const attendance = await tx.attendance.findUnique({ where: { id: params.id } });
    await tx.attendanceHistory.create({ data: { attendanceId: params.id, actionType: 'CLAIMED', description: 'Atendimento assumido', performedBy: session.userId } });
    return attendance;
  });

  if (!result) return NextResponse.json({ error: 'Atendimento já foi assumido por outro atendente' }, { status: 409 });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: session.userId, entityType: 'ATTENDANCE', entityId: params.id, action: 'CLAIM', newValues: { assignedTo: session.userId }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });

  return NextResponse.json(result);
}
