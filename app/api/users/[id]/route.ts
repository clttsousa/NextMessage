import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta, getSession } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/services/audit';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await request.json() as { name?: string; role?: 'ADMIN' | 'ATTENDANT'; isActive?: boolean; mustChangePassword?: boolean; resetPassword?: string };
  const before = await prisma.user.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const data: any = {
    name: body.name ?? before.name,
    role: body.role ?? before.role,
    isActive: body.isActive ?? before.isActive,
    mustChangePassword: body.mustChangePassword ?? before.mustChangePassword
  };

  let action = 'UPDATE';
  if (body.resetPassword) {
    data.passwordHash = await bcrypt.hash(body.resetPassword, 12);
    data.mustChangePassword = true;
    action = 'RESET_PASSWORD';
  }

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  const meta = getClientMeta();
  await writeAuditLog({ actorUserId: session.userId, entityType: 'USER', entityId: params.id, action, oldValues: { name: before.name, role: before.role, isActive: before.isActive }, newValues: { name: updated.name, role: updated.role, isActive: updated.isActive }, ipAddress: meta.ipAddress, userAgent: meta.userAgent });

  return NextResponse.json(updated);
}
