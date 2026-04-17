'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, ClipboardList, Users, ShieldCheck, LogOut, type LucideIcon, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/layout/command-palette';
import { NotificationCenter } from '@/components/layout/notification-center';
import { toast } from 'sonner';

type NavItem = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean; count?: number };

export function AppShell({
  children,
  user,
  pendingCount,
  commandAttendances
}: {
  children: React.ReactNode;
  user: { name: string; role: 'ADMIN' | 'ATTENDANT' };
  pendingCount: number;
  commandAttendances: Array<{ id: string; protocol: string; customerName: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);


  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable=true]')) return;
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        window.location.href = '/attendimentos/novo';
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
      if (event.key === '?') {
        toast.message('Atalhos disponíveis', { description: 'Ctrl/Cmd+K: comandos • N: novo atendimento • Esc: fechar painéis' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/attendimentos', label: 'Atendimentos', icon: ClipboardList, count: pendingCount },
    { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
    { href: '/auditoria', label: 'Auditoria', icon: ShieldCheck, adminOnly: true }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen w-full max-w-[2400px] grid-cols-1 gap-4 p-3 md:grid-cols-[300px,1fr] md:gap-5 md:p-5">
        <aside className={cn('surface fixed inset-y-3 left-3 right-3 z-50 flex flex-col p-4 md:static md:inset-auto', open ? 'block md:flex' : 'hidden md:flex')}>
          <div className="mb-6 flex items-center justify-between border-b subtle-divider pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300">Operações</p>
              <h1 className="text-xl font-semibold text-slate-100">NextMessage</h1>
              <p className="mt-1 text-xs text-slate-400">Central interna premium</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:hidden"><X className="h-5 w-5" /></button>
          </div>

          <nav className="space-y-1.5">
            {navItems
              .filter((item) => !item.adminOnly || user.role === 'ADMIN')
              .map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                      active
                        ? 'bg-blue-500/15 text-blue-100 ring-1 ring-blue-400/40 shadow-[inset_0_0_0_1px_rgba(86,123,244,0.22)]'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.count && item.count > 0 ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-100">{item.count}</span>
                    ) : null}
                  </Link>
                );
              })}
          </nav>

          <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-950/40 p-3 text-xs text-slate-300">
            <p className="inline-flex items-center gap-2 font-medium text-slate-100"><Sparkles className="h-3.5 w-3.5 text-blue-300" />Ações rápidas</p>
            <p className="mt-1">Use <span className="font-semibold text-blue-200">Ctrl + K</span> para buscar protocolo, cliente e atalhos de navegação.</p>
          </div>

          <div className="mt-auto border-t subtle-divider pt-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
              <AvatarInitials name={user.name} />
              <div>
                <p className="text-sm font-medium text-slate-100">{user.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{user.role === 'ADMIN' ? 'Admin' : 'Atendente'}</p>
              </div>
            </div>
            <form action="/api/auth/logout" method="post"><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10"><LogOut className="h-4 w-4" />Sair</button></form>
          </div>
        </aside>

        {open ? <button className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" /> : null}

        <div className="min-w-0">
          <header className="surface mb-4 flex items-center justify-between px-4 py-3 md:px-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 md:hidden"><Menu className="h-5 w-5" /></button>
              <div>
                <p className="text-sm font-semibold text-slate-100">Central operacional</p>
                <p className="text-xs text-slate-400">Visão de ownership, prioridade e execução</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CommandPalette
                attendances={commandAttendances}
                shortcuts={[
                  { href: '/dashboard', label: 'Ir para Dashboard', hint: 'G D' },
                  { href: '/attendimentos', label: 'Ir para Atendimentos', hint: 'G A' },
                  { href: '/auditoria', label: 'Ir para Auditoria', hint: 'G U' },
                  { href: '/attendimentos/novo', label: 'Novo atendimento', hint: 'N' }
                ]}
              />
              <NotificationCenter />
              <AvatarInitials name={user.name} className="h-8 w-8 text-xs md:hidden" />
            </div>
          </header>
          <main className="space-y-4 pb-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
