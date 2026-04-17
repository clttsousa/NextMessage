import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, actions, eyebrow, className }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string; className?: string }) {
  return (
    <div className={cn('surface flex flex-wrap items-start justify-between gap-4 px-5 py-4 md:px-6', className)}>
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-300 md:max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
