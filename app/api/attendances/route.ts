import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { attendanceCreateSchema } from '@/lib/schemas/attendance';
import { getSession, getClientMeta } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/services/audit';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const items = await prisma.attendance.findMany({ include: { assignee: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const body = await request.json();
  const parsed = attendanceCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

  const created = await prisma.attendance.create({ data: { ...parsed.data, referenceDate: new Date(parsed.data.referenceDate), createdBy: session.userId } });
  await prisma.attendanceHistory.create({ data: { attendanceId: created.id, actionType: 'CREATED', description: 'Atendimento criado manualmente', performedBy: session.userId } });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: session.userId, entityType: 'ATTENDANCE', entityId: created.id, action: 'CREATE', newValues: created, ipAddress: meta.ipAddress, userAgent: meta.userAgent });

  return NextResponse.json(created, { status: 201 });
}
