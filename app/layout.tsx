import './globals.css';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="pt-BR">
      <body>
        {session ? (
          <div className="min-h-screen">
            <header className="border-b border-slate-800 bg-slate-950/80">
              <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 text-sm">
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/attendimentos">Atendimentos</Link>
                {session.role === 'ADMIN' && <Link href="/usuarios">Usuários</Link>}
                {session.role === 'ADMIN' && <Link href="/auditoria">Auditoria</Link>}
                <form action="/api/auth/logout" method="post" className="ml-auto">
                  <button className="text-rose-300">Sair</button>
                </form>
              </nav>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
