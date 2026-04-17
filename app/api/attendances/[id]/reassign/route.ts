import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta } from '@/lib/auth/session';
import { writeAuditLogTx } from '@/lib/services/audit';
import { ensureJsonContentType, withErrorHandling, AppError } from '@/lib/api/http';
import { requireApiAdmin } from '@/lib/auth/api-guards';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAdmin();
    ensureJsonContentType(request);

    const { assignedTo } = (await request.json()) as { assignedTo?: string };
    if (!assignedTo) throw new AppError(400, 'Responsável é obrigatório');

    const [before, targetUser] = await Promise.all([
      prisma.attendance.findUnique({ where: { id: params.id } }),
      prisma.user.findUnique({ where: { id: assignedTo }, select: { id: true, isActive: true } })
    ]);

    if (!before) throw new AppError(404, 'Atendimento não encontrado');
    if (!targetUser || !targetUser.isActive) throw new AppError(422, 'Usuário responsável inválido ou inativo');

    const meta = getClientMeta();
    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.attendance.update({ where: { id: params.id }, data: { assignedTo, assignedAt: new Date(), updatedBy: session.userId } });
      await tx.attendanceHistory.create({ data: { attendanceId: params.id, actionType: 'REASSIGNED', description: 'Atendimento reatribuído por administrador', performedBy: session.userId } });
      await writeAuditLogTx(tx, {
        actorUserId: session.userId,
        entityType: 'ATTENDANCE',
        entityId: params.id,
        action: 'REASSIGN',
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
