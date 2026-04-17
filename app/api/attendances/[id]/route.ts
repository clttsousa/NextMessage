import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta } from '@/lib/auth/session';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { writeAuditLogTx } from '@/lib/services/audit';
import { ensureJsonContentType, withErrorHandling, AppError } from '@/lib/api/http';
import { requireApiAuth } from '@/lib/auth/api-guards';
import { validateStatusTransition } from '@/lib/services/attendance/rules';

const closedStatuses = ['RESOLVIDO', 'VIROU_OS', 'CANCELADO'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAuth();
    ensureJsonContentType(request);

    const existing = await prisma.attendance.findUnique({ where: { id: params.id } });
    if (!existing) throw new AppError(404, 'Atendimento não encontrado');

    const canEdit = session.role === 'ADMIN' || existing.assignedTo === session.userId;
    if (!canEdit) throw new AppError(403, 'Sem permissão');

    const parsed = attendanceUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

    validateStatusTransition(existing.status, parsed.data.status);

    if (parsed.data.status !== 'PENDENTE' && !existing.assignedTo && session.role !== 'ADMIN') {
      throw new AppError(422, 'Atendimento sem responsável deve permanecer pendente até ser assumido');
    }

    const data = parsed.data;
    const meta = getClientMeta();

    const updated = await prisma.$transaction(async (tx) => {
      const updatedAttendance = await tx.attendance.update({
        where: { id: existing.id },
        data: {
          ...data,
          contactedAt: data.contactedAt ? new Date(data.contactedAt) : null,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          updatedBy: session.userId,
          closedAt: closedStatuses.includes(data.status) ? new Date() : null,
          closedBy: closedStatuses.includes(data.status) ? session.userId : null,
          canceledAt: data.status === 'CANCELADO' ? new Date() : null,
          canceledBy: data.status === 'CANCELADO' ? session.userId : null
        }
      });

      await tx.attendanceHistory.create({
        data: {
          attendanceId: existing.id,
          actionType: data.status === 'RESOLVIDO' ? 'RESOLVED' : data.status === 'CANCELADO' ? 'CANCELED' : 'UPDATED',
          description: `Status atualizado para ${data.status}`,
          performedBy: session.userId
        }
      });

      await writeAuditLogTx(tx, {
        actorUserId: session.userId,
        entityType: 'ATTENDANCE',
        entityId: existing.id,
        action: 'UPDATE',
        oldValues: existing,
        newValues: updatedAttendance,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });

      return updatedAttendance;
    });

    return NextResponse.json(updated);
  });
}
