import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { createSession, getCurrentUser, getSession } from '@/lib/auth/session';
import { ensureJsonContentType, withErrorHandling } from '@/lib/api/http';
import { writeAuditLog } from '@/lib/services/audit';

const schema = z.object({
  password: z
    .string()
    .min(10, 'Senha deve ter no mínimo 10 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial')
});

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    ensureJsonContentType(request);
    const session = await getSession();
    const currentUser = await getCurrentUser();
    if (!session || !currentUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash, mustChangePassword: false }
    });

    await createSession({ userId: session.userId, role: session.role, mustChangePassword: false });

    await writeAuditLog({ actorUserId: session.userId, entityType: 'AUTH', entityId: session.userId, action: 'PASSWORD_CHANGED' });

    return NextResponse.json({ ok: true });
  });
}
