import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta, getSession } from '@/lib/auth/session';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { writeAuditLog } from '@/lib/services/audit';

const closedStatuses = ['RESOLVIDO', 'VIROU_OS', 'CANCELADO'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const existing = await prisma.attendance.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });

  const canEdit = session.role === 'ADMIN' || existing.assignedTo === session.userId;
  if (!canEdit) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await request.json();
  const parsed = attendanceUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.attendance.update({
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

  await prisma.attendanceHistory.create({ data: { attendanceId: existing.id, actionType: 'UPDATED', description: `Status atualizado para ${data.status}`, performedBy: session.userId } });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: session.userId, entityType: 'ATTENDANCE', entityId: existing.id, action: 'UPDATE', oldValues: existing, newValues: updated, ipAddress: meta.ipAddress, userAgent: meta.userAgent });

  return NextResponse.json(updated);
}
