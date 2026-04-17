import { ReactNode } from 'react';
import { AttendanceStatus } from '@prisma/client';
import { STATUS_LABELS } from '@/lib/constants/status';
import { cn } from '@/lib/utils';

const classes: Record<AttendanceStatus, string> = {
  PENDENTE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  EM_ATENDIMENTO: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  SEM_RETORNO: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  RETORNAR_DEPOIS: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  RESOLVIDO: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  VIROU_OS: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  CANCELADO: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
};

export function StatusBadge({ status, className }: { status: AttendanceStatus; className?: string }) {
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide', classes[status], className)}>{STATUS_LABELS[status]}</span>;
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300', className)}>{children}</span>;
}
