import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getClientMeta } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { userSchema } from '@/lib/schemas/user';
import { writeAuditLog } from '@/lib/services/audit';
import { toSafeUser } from '@/lib/services/users';
import { ensureJsonContentType, withErrorHandling } from '@/lib/api/http';
import { requireApiAdmin } from '@/lib/auth/api-guards';

export async function GET() {
  return withErrorHandling(async () => {
    await requireApiAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true
      }
    });
    return NextResponse.json(users.map(toSafeUser));
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAdmin();
    ensureJsonContentType(request);

    const parsed = userSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

    if (!parsed.data.password) return NextResponse.json({ error: 'Senha obrigatória na criação' }, { status: 400 });
    const hash = await bcrypt.hash(parsed.data.password, 12);

    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        mustChangePassword: parsed.data.mustChangePassword,
        passwordHash: hash,
        createdBy: session.userId
      }
    });

    const meta = getClientMeta();
    await writeAuditLog({
      actorUserId: session.userId,
      entityType: 'USER',
      entityId: created.id,
      action: 'CREATE',
      newValues: { email: created.email, role: created.role, isActive: created.isActive },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return NextResponse.json(toSafeUser(created), { status: 201 });
  });
}
