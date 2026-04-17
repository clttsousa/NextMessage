import { AppError } from '@/lib/api/http';
import { clearSession, getCurrentUser, getSession } from '@/lib/auth/session';

export async function requireApiAuth() {
  const session = await getSession();
  const user = await getCurrentUser();
  if (!session || !user) {
    await clearSession();
    throw new AppError(401, 'Não autenticado');
  }

  if (user.mustChangePassword) {
    throw new AppError(403, 'Troca de senha obrigatória antes de continuar');
  }

  return { session, user };
}

export async function requireApiAdmin() {
  const ctx = await requireApiAuth();
  if (ctx.user.role !== 'ADMIN') {
    throw new AppError(403, 'Sem permissão');
  }
  return ctx;
}
