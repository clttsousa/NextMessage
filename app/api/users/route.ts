import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getClientMeta, getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { userSchema } from '@/lib/schemas/user';
import { writeAuditLog } from '@/lib/services/audit';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const parsed = userSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

  if (!parsed.data.password) return NextResponse.json({ error: 'Senha obrigatória na criação' }, { status: 400 });
  const hash = await bcrypt.hash(parsed.data.password, 12);

  const created = await prisma.user.create({ data: { ...parsed.data, passwordHash: hash, createdBy: session.userId } });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: session.userId, entityType: 'USER', entityId: created.id, action: 'CREATE', newValues: { email: created.email, role: created.role }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
  return NextResponse.json(created, { status: 201 });
}
