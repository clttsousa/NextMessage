import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/api-guards';
import { prisma } from '@/lib/db/prisma';
import { mapHistoryToNotification } from '@/lib/services/notifications';

export async function GET() {
  await requireApiAuth();

  const [history, criticalSla] = await Promise.all([
    prisma.attendanceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      include: { attendance: { select: { protocol: true } } },
      take: 25
    }),
    prisma.attendance.findMany({
      where: { status: { in: ['PENDENTE', 'SEM_RETORNO', 'RETORNAR_DEPOIS'] }, referenceDate: { lt: new Date(Date.now() - 30 * 60 * 60 * 1000) } },
      orderBy: { referenceDate: 'asc' },
      take: 6,
      select: { id: true, protocol: true, customerName: true, referenceDate: true }
    })
  ]);

  const notifications = history.map(mapHistoryToNotification);

  const slaNotifications = criticalSla.map((item) => ({
    id: `sla-${item.id}`,
    title: 'SLA estourado',
    description: `${item.protocol} • ${item.customerName}`,
    attendanceId: item.id,
    attendanceProtocol: item.protocol,
    level: 'critico' as const,
    actionType: 'SLA_BREACHED',
    createdAt: item.referenceDate.toISOString()
  }));

  return NextResponse.json({ items: [...slaNotifications, ...notifications].slice(0, 25) });
}
