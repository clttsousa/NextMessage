import { UserRole } from '@prisma/client';
import { AppError } from '@/lib/api/http';
import { prisma } from '@/lib/db/prisma';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt
  };
}

export async function ensureActiveAdminRemains(params: {
  targetUserId: string;
  nextRole: UserRole;
  nextIsActive: boolean;
}) {
  const target = await prisma.user.findUnique({ where: { id: params.targetUserId }, select: { role: true, isActive: true } });
  if (!target) throw new AppError(404, 'Usuário não encontrado');

  const currentlyActiveAdmin = target.role === 'ADMIN' && target.isActive;
  const remainsActiveAdmin = params.nextRole === 'ADMIN' && params.nextIsActive;
  if (!currentlyActiveAdmin || remainsActiveAdmin) return;

  const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
  if (activeAdmins <= 1) {
    throw new AppError(409, 'Não é permitido remover ou desativar o último administrador ativo');
  }
}
