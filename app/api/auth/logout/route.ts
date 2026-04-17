import { NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/services/audit';

export async function POST() {
  const session = await getSession();
  if (session) await writeAuditLog({ actorUserId: session.userId, entityType: 'AUTH', entityId: session.userId, action: 'LOGOUT' });
  await clearSession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
