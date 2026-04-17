import { redirect } from 'next/navigation';
import { clearSession, getCurrentUser, getSession } from '@/lib/auth/session';

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await getCurrentUser();
  if (!user) {
    await clearSession();
    redirect('/login');
  }

  if (user.mustChangePassword) redirect('/trocar-senha');

  return { session, user };
}

export async function requireAdmin() {
  const { session, user } = await requireAuth();
  if (session.role !== 'ADMIN' || user.role !== 'ADMIN') redirect('/dashboard');
  return { session, user };
}
