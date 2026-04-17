import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireApiAuth } from '@/lib/auth/api-guards';
import { withErrorHandling } from '@/lib/api/http';

export async function GET() {
  return withErrorHandling(async () => {
    await requireApiAuth();

    const [total, pending, inProgress, noResponse, followUp, resolved, serviceOrder] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: 'PENDENTE' } }),
      prisma.attendance.count({ where: { status: 'EM_ATENDIMENTO' } }),
      prisma.attendance.count({ where: { status: 'SEM_RETORNO' } }),
      prisma.attendance.count({ where: { status: 'RETORNAR_DEPOIS' } }),
      prisma.attendance.count({ where: { status: 'RESOLVIDO' } }),
      prisma.attendance.count({ where: { OR: [{ status: 'VIROU_OS' }, { becameServiceOrder: true }] } })
    ]);

    return NextResponse.json({ total, pending, inProgress, noResponse, followUp, resolved, serviceOrder });
  });
}
