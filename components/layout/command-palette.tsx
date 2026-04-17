'use client';

import Link from 'next/link';
import { Search, CornerDownLeft, Command } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type CommandAttendance = { id: string; protocol: string; customerName: string };

type Shortcut = { href: string; label: string; hint?: string };

function fuzzyMatch(text: string, query: string) {
  const source = text.toLowerCase();
  const target = query.toLowerCase();
  let pointer = 0;
  for (const char of source) {
    if (char === target[pointer]) pointer += 1;
    if (pointer === target.length) return true;
  }
  return source.includes(target);
}

export function CommandPalette({ attendances, shortcuts }: { attendances: CommandAttendance[]; shortcuts: Shortcut[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<Array<{ id: string; protocol: string; customerName: string }>>([]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((v) => !v);
      }
    };

    const recentItems = JSON.parse(localStorage.getItem('ops.recent.protocols') ?? '[]') as Array<{ id: string; protocol: string; customerName: string }>;
    setRecent(recentItems.slice(0, 6));

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return attendances;
    return attendances.filter((attendance) => [attendance.protocol, attendance.customerName].some((value) => fuzzyMatch(value, query)));
  }, [attendances, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 lg:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        Comandos
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"><Command className="h-3 w-3" />K</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(96vw,820px)] p-0">
          <DialogTitle className="sr-only">Paleta de comandos</DialogTitle>
          <div className="border-b border-slate-800 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="border-none bg-transparent px-0"
                placeholder="Buscar comando, protocolo ou cliente"
              />
              <span className="text-[10px] text-slate-500">Esc fecha</span>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-[0.9fr,1.2fr,1fr]">
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Atalhos</p>
              <div className="space-y-1.5">
                {shortcuts.map((shortcut) => (
                  <Link key={shortcut.href} href={shortcut.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
                    {shortcut.label}
                    <span className="inline-flex items-center gap-2 text-xs text-slate-500">{shortcut.hint ?? <CornerDownLeft className="h-3.5 w-3.5" />}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-800 p-3 md:border-l md:border-t-0">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Atendimentos</p>
                <span className="text-[11px] text-slate-500">{filtered.length} resultados</span>
              </div>
              <div className="max-h-80 space-y-1.5 overflow-auto">
                {filtered.length === 0 ? <p className="px-3 py-5 text-sm text-slate-400">Nenhum atendimento encontrado.</p> : filtered.map((attendance) => (
                  <Link key={attendance.id} href={`/attendimentos/${attendance.id}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 transition hover:bg-slate-800">
                    <p className="text-sm font-semibold text-slate-100">{attendance.protocol}</p>
                    <p className="text-xs text-slate-400">{attendance.customerName}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-800 p-3 md:border-l md:border-t-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Recentes</p>
              <div className="max-h-80 space-y-1.5 overflow-auto">
                {recent.length === 0 ? <p className="px-3 py-5 text-sm text-slate-400">Sem histórico recente.</p> : recent.map((attendance) => (
                  <Link key={attendance.id} href={`/attendimentos/${attendance.id}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 transition hover:bg-slate-800">
                    <p className="text-sm font-semibold text-slate-100">{attendance.protocol}</p>
                    <p className="text-xs text-slate-400">{attendance.customerName}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
