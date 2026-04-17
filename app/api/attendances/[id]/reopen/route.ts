import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta, getSession } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/services/audit';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const before = await prisma.attendance.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: 'Atendimento não encontrado' }, { status: 404 });

  const updated = await prisma.attendance.update({ where: { id: params.id }, data: { status: 'EM_ATENDIMENTO', closedAt: null, closedBy: null, canceledAt: null, canceledBy: null, updatedBy: session.userId } });
  await prisma.attendanceHistory.create({ data: { attendanceId: params.id, actionType: 'REOPENED', description: 'Atendimento reaberto', performedBy: session.userId } });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: session.userId, entityType: 'ATTENDANCE', entityId: params.id, action: 'REOPEN', oldValues: before, newValues: updated, ipAddress: meta.ipAddress, userAgent: meta.userAgent });

  return NextResponse.json(updated);
}
