import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireApiAdmin } from '@/lib/auth/api-guards';
import { withErrorHandling } from '@/lib/api/http';

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireApiAdmin();
    const sp = request.nextUrl.searchParams;
    const actorUserId = sp.get('actorUserId') || undefined;
    const action = sp.get('action') || undefined;
    const entityType = sp.get('entityType') || undefined;
    const from = sp.get('from');
    const to = sp.get('to');

    const logs = await prisma.auditLog.findMany({
      where: {
        actorUserId,
        action,
        entityType,
        createdAt: from || to ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } : undefined
      },
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json(logs);
  });
}
