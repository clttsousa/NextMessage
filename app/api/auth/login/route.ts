import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { createSession, getClientMeta } from '@/lib/auth/session';
import { loginSchema } from '@/lib/schemas/auth';
import { writeAuditLog } from '@/lib/services/audit';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) return NextResponse.json({ error: 'Credenciais inválidas ou usuário inativo' }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });

  await createSession({ userId: user.id, role: user.role, name: user.name, email: user.email });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: user.id, entityType: 'AUTH', entityId: user.id, action: 'LOGIN', ipAddress: meta.ipAddress, userAgent: meta.userAgent });

  return NextResponse.json({ ok: true });
}
