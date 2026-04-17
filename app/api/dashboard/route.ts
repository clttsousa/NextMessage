import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

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
}
