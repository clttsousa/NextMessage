'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, ClipboardList, Users, ShieldCheck, LogOut } from 'lucide-react';
import { useState } from 'react';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: any; adminOnly?: boolean };

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendimentos', label: 'Atendimentos', icon: ClipboardList },
  { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  { href: '/auditoria', label: 'Auditoria', icon: ShieldCheck, adminOnly: true }
];

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; role: 'ADMIN' | 'ATTENDANT' } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen w-full max-w-[1460px] grid-cols-1 gap-4 p-3 md:grid-cols-[260px,1fr] md:p-5">
        <aside className={cn('surface fixed inset-y-3 left-3 right-3 z-40 flex flex-col p-4 md:static md:inset-auto', open ? 'block' : 'hidden md:flex')}>
          <div className="mb-6 flex items-center justify-between border-b subtle-divider pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">Operações</p>
              <h1 className="text-xl font-semibold text-slate-100">NextMessage</h1>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:hidden"><X className="h-5 w-5" /></button>
          </div>
          <nav className="space-y-1.5">
            {navItems.filter((i) => !i.adminOnly || user.role === 'ADMIN').map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition', active ? 'bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/30' : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100')}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t subtle-divider pt-4">
            <div className="mb-3 flex items-center gap-3">
              <AvatarInitials name={user.name} />
              <div>
                <p className="text-sm font-medium text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-400">{user.role === 'ADMIN' ? 'Administrador' : 'Atendente'}</p>
              </div>
            </div>
            <form action="/api/auth/logout" method="post"><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10"><LogOut className="h-4 w-4" />Sair</button></form>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="surface mb-4 flex items-center justify-between px-4 py-3 md:hidden">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"><Menu className="h-5 w-5" /></button>
            <p className="text-sm font-medium text-slate-200">Central operacional</p>
            <AvatarInitials name={user.name} className="h-7 w-7 text-[11px]" />
          </header>
          <main className="space-y-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
