import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { attendanceCreateSchema } from '@/lib/schemas/attendance';
import { getClientMeta } from '@/lib/auth/session';
import { writeAuditLogTx } from '@/lib/services/audit';
import { ensureJsonContentType, withErrorHandling } from '@/lib/api/http';
import { requireApiAuth } from '@/lib/auth/api-guards';

function parseIntQuery(value: string | null, defaultValue: number) {
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireApiAuth();

    const q = request.nextUrl.searchParams.get('q')?.trim();
    const status = request.nextUrl.searchParams.get('status');
    const page = Math.max(1, parseIntQuery(request.nextUrl.searchParams.get('page'), 1));
    const pageSize = Math.min(100, Math.max(5, parseIntQuery(request.nextUrl.searchParams.get('pageSize'), 20)));

    const where: Prisma.AttendanceWhereInput = {
      AND: [
        q
          ? {
              OR: [
                { customerName: { contains: q, mode: 'insensitive' } },
                { protocol: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } }
              ]
            }
          : {},
        status ? { status: status as never } : {}
      ]
    };

    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: { assignee: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.attendance.count({ where })
    ]);

    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAuth();
    ensureJsonContentType(request);

    const body = await request.json();
    const parsed = attendanceCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

    const meta = getClientMeta();

    const created = await prisma.$transaction(async (tx) => {
      const createdAttendance = await tx.attendance.create({
        data: { ...parsed.data, referenceDate: new Date(parsed.data.referenceDate), createdBy: session.userId }
      });

      await tx.attendanceHistory.create({
        data: {
          attendanceId: createdAttendance.id,
          actionType: 'CREATED',
          description: 'Atendimento criado manualmente',
          performedBy: session.userId
        }
      });

      await writeAuditLogTx(tx, {
        actorUserId: session.userId,
        entityType: 'ATTENDANCE',
        entityId: createdAttendance.id,
        action: 'CREATE',
        newValues: createdAttendance,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });

      return createdAttendance;
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }
      throw error;
    });

    if (!created) return NextResponse.json({ error: 'Já existe atendimento com este protocolo' }, { status: 409 });

    return NextResponse.json(created, { status: 201 });
  });
}
