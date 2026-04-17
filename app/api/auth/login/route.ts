import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { createSession, getClientMeta } from '@/lib/auth/session';
import { loginSchema } from '@/lib/schemas/auth';
import { writeAuditLog } from '@/lib/services/audit';
import { ensureJsonContentType, withErrorHandling } from '@/lib/api/http';
import { getLoginThrottle, registerLoginFailure, registerLoginSuccess } from '@/lib/auth/login-rate-limit';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    ensureJsonContentType(request);
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

    const email = parsed.data.email.toLowerCase();
    const throttle = getLoginThrottle(email);
    if (throttle.blocked) {
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${throttle.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      registerLoginFailure(email);
      return NextResponse.json({ error: 'Credenciais inválidas ou usuário inativo' }, { status: 401 });
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      registerLoginFailure(email);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    registerLoginSuccess(email);

    await createSession({
      userId: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const meta = getClientMeta();
    await writeAuditLog({
      actorUserId: user.id,
      entityType: 'AUTH',
      entityId: user.id,
      action: 'LOGIN',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return NextResponse.json({ ok: true, mustChangePassword: user.mustChangePassword });
  });
}
