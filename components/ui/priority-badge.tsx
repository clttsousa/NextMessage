import { AttendanceStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

function getPriority(referenceDate: string | Date, status: AttendanceStatus) {
  if (['RESOLVIDO', 'VIROU_OS', 'CANCELADO'].includes(status)) {
    return { label: 'Concluído', tone: 'neutral' as const };
  }

  const ref = new Date(referenceDate).getTime();
  const now = Date.now();
  const diffHours = (now - ref) / (1000 * 60 * 60);

  if (diffHours >= 36) return { label: 'SLA estourado', tone: 'critical' as const };
  if (diffHours >= 24) return { label: 'Urgente', tone: 'high' as const };
  if (diffHours >= 16) return { label: 'Próximo do SLA', tone: 'warning' as const };
  return { label: 'Dentro do prazo', tone: 'ok' as const };
}

const tones = {
  neutral: 'border-slate-600 bg-slate-800/80 text-slate-200',
  critical: 'border-rose-500/50 bg-rose-500/15 text-rose-200',
  high: 'border-orange-500/50 bg-orange-500/15 text-orange-200',
  warning: 'border-amber-500/50 bg-amber-500/15 text-amber-100',
  ok: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100'
};

export function PriorityBadge({ referenceDate, status, className }: { referenceDate: string | Date; status: AttendanceStatus; className?: string }) {
  const priority = getPriority(referenceDate, status);

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', tones[priority.tone], className)}>
      {priority.label}
    </span>
  );
}

export const priorityAssumption = 'SLA visual: até 16h dentro do prazo; 16h-24h próximo do SLA; 24h-36h urgente; acima de 36h estourado.';
