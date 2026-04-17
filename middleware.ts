import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { env } from '@/lib/config/env';
import type { SessionPayload } from '@/lib/auth/session';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const publicPaths = ['/login'];
const forcePasswordChangePath = '/trocar-senha';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  if (publicPaths.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get('ops_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  try {
    const { payload } = await jwtVerify(token, secret);
    const session = payload as SessionPayload;

    if (session.mustChangePassword && pathname !== forcePasswordChangePath && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL(forcePasswordChangePath, req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
