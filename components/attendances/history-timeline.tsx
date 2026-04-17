'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, BadgeCheck, CircleAlert, MessageSquareText, RotateCcw, UserCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
  performerName: string | null;
};

const filters = [
  { key: 'todos', label: 'Tudo' },
  { key: 'status', label: 'Status' },
  { key: 'reatribuicoes', label: 'Reatribuições' },
  { key: 'resolucao', label: 'Resolução' },
  { key: 'contato', label: 'Comentários/contato' }
] as const;

const typeMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; group: typeof filters[number]['key'] }> = {
  CREATED: { icon: CircleAlert, color: 'bg-blue-400', group: 'status' },
  CLAIMED: { icon: UserCheck, color: 'bg-emerald-400', group: 'status' },
  UPDATED: { icon: MessageSquareText, color: 'bg-amber-400', group: 'contato' },
  REASSIGNED: { icon: ArrowRightLeft, color: 'bg-violet-400', group: 'reatribuicoes' },
  REOPENED: { icon: RotateCcw, color: 'bg-cyan-400', group: 'status' },
  RESOLVED: { icon: BadgeCheck, color: 'bg-emerald-500', group: 'resolucao' },
  CANCELED: { icon: XCircle, color: 'bg-rose-500', group: 'resolucao' }
};

export function HistoryTimeline({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('todos');

  const grouped = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === 'todos') return true;
      const group = typeMeta[item.actionType]?.group ?? 'status';
      return filter === group;
    });

    return filtered.reduce<Record<string, Item[]>>((acc, item) => {
      const day = format(new Date(item.createdAt), 'dd/MM/yyyy');
      if (!acc[day]) acc[day] = [];
      acc[day].push(item);
      return acc;
    }, {});
  }, [items, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={cn('rounded-lg border px-3 py-1.5 text-xs font-semibold transition', filter === option.key ? 'border-blue-400/50 bg-blue-500/15 text-blue-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([day, entries]) => (
          <div key={day}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{day}</p>
            <ul className="grid gap-3 md:grid-cols-2">
              {entries.map((h, index) => {
                const meta = typeMeta[h.actionType] ?? typeMeta.UPDATED;
                const Icon = meta.icon;
                return (
                  <li key={h.id} className="animate-[fadein_.28s_ease] rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                    <div className="flex items-start gap-3">
                      <span className={cn('mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full', meta.color, 'bg-opacity-20')}>
                        <Icon className="h-4 w-4 text-slate-100" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-100">{h.description}</p>
                        <p className="mt-1 text-xs text-slate-400">{h.performerName ?? 'Sistema'} • {format(new Date(h.createdAt), 'HH:mm')}</p>
                      </div>
                      <span className="text-[11px] text-slate-500">#{entries.length - index}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
