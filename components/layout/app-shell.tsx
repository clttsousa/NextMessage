'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type NavItem = { href: string; label: string; admin?: boolean };

export function AppShell({ children, role, userName }: { children: React.ReactNode; role: 'ADMIN' | 'ATTENDANT'; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Visão geral' },
    { href: '/attendimentos', label: 'Atendimentos' },
    { href: '/usuarios', label: 'Usuários', admin: true },
    { href: '/auditoria', label: 'Auditoria', admin: true }
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <button className="rounded-lg border border-slate-700 px-2 py-1 text-sm md:hidden" onClick={() => setOpen((v) => !v)}>Menu</button>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-blue-300">NextMessage Ops</p>
            <p className="text-sm text-slate-400">Plataforma operacional interna</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-slate-400">{role === 'ADMIN' ? 'Administrador' : 'Atendente'}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10">Sair</button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className={cn('space-y-2 md:block', open ? 'block' : 'hidden')}>
          <div className="surface p-3">
            {items.filter((item) => !item.admin || role === 'ADMIN').map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('mb-1 block rounded-xl px-3 py-2 text-sm transition', active ? 'bg-blue-500/20 text-blue-200' : 'text-slate-300 hover:bg-slate-800')}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
