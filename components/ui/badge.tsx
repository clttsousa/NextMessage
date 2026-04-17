import { AttendanceStatus, UserRole } from '@prisma/client';
import { STATUS_LABELS } from '@/lib/constants/status';
import { cn } from '@/lib/utils';

const colors: Record<AttendanceStatus, string> = {
  PENDENTE: 'border-slate-500/40 bg-slate-500/15 text-slate-100',
  EM_ATENDIMENTO: 'border-blue-500/40 bg-blue-500/15 text-blue-100',
  SEM_RETORNO: 'border-amber-500/40 bg-amber-500/15 text-amber-100',
  RETORNAR_DEPOIS: 'border-violet-500/40 bg-violet-500/15 text-violet-100',
  RESOLVIDO: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100',
  VIROU_OS: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-100',
  CANCELADO: 'border-rose-500/40 bg-rose-500/15 text-rose-100'
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', colors[status])}>{STATUS_LABELS[status]}</span>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', role === 'ADMIN' ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100' : 'border-sky-500/40 bg-sky-500/15 text-sky-100')}>
      {role === 'ADMIN' ? 'Administrador' : 'Atendente'}
    </span>
  );
}
