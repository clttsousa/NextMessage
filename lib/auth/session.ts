import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
const cookieName = 'ops_session';

export type SessionPayload = { userId: string; role: 'ADMIN' | 'ATTENDANT'; name: string; email: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);

  cookies().set(cookieName, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
}

export async function clearSession() {
  cookies().delete(cookieName);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export function getClientMeta() {
  const h = headers();
  return {
    ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: h.get('user-agent')
  };
}
