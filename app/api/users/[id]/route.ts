import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getClientMeta } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/services/audit';
import { strongPasswordSchema } from '@/lib/schemas/user';
import { ensureJsonContentType, withErrorHandling, AppError } from '@/lib/api/http';
import { requireApiAdmin } from '@/lib/auth/api-guards';
import { ensureActiveAdminRemains, toSafeUser } from '@/lib/services/users';

const userPatchSchema = z.object({
  name: z.string().min(3).optional(),
  role: z.enum(['ADMIN', 'ATTENDANT']).optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
  resetPassword: strongPasswordSchema.optional()
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { session } = await requireApiAdmin();
    ensureJsonContentType(request);

    const parsed = userPatchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

    const before = await prisma.user.findUnique({ where: { id: params.id } });
    if (!before) throw new AppError(404, 'Usuário não encontrado');

    if (session.userId === params.id && parsed.data.isActive === false) {
      throw new AppError(409, 'Você não pode desativar o próprio usuário');
    }

    const nextRole = parsed.data.role ?? before.role;
    const nextIsActive = parsed.data.isActive ?? before.isActive;
    await ensureActiveAdminRemains({ targetUserId: params.id, nextRole, nextIsActive });

    const updateData = {
      name: parsed.data.name ?? before.name,
      role: nextRole,
      isActive: nextIsActive,
      mustChangePassword: parsed.data.mustChangePassword ?? before.mustChangePassword
    } as {
      name: string;
      role: 'ADMIN' | 'ATTENDANT';
      isActive: boolean;
      mustChangePassword: boolean;
      passwordHash?: string;
    };

    let action = 'UPDATE';
    if (parsed.data.resetPassword) {
      updateData.passwordHash = await bcrypt.hash(parsed.data.resetPassword, 12);
      updateData.mustChangePassword = true;
      action = 'RESET_PASSWORD';
    }

    const updated = await prisma.user.update({ where: { id: params.id }, data: updateData });
    const meta = getClientMeta();
    await writeAuditLog({
      actorUserId: session.userId,
      entityType: 'USER',
      entityId: params.id,
      action,
      oldValues: { name: before.name, role: before.role, isActive: before.isActive, mustChangePassword: before.mustChangePassword },
      newValues: { name: updated.name, role: updated.role, isActive: updated.isActive, mustChangePassword: updated.mustChangePassword },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return NextResponse.json(toSafeUser(updated));
  });
}
