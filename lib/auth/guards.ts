import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return session;
}
