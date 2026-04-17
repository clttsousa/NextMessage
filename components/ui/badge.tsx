import { AttendanceStatus } from '@prisma/client';
import { STATUS_LABELS } from '@/lib/constants/status';

const colors: Record<AttendanceStatus, string> = {
  PENDENTE: 'bg-slate-600',
  EM_ATENDIMENTO: 'bg-blue-600',
  SEM_RETORNO: 'bg-amber-600',
  RETORNAR_DEPOIS: 'bg-purple-600',
  RESOLVIDO: 'bg-emerald-600',
  VIROU_OS: 'bg-cyan-600',
  CANCELADO: 'bg-rose-600'
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold text-white ${colors[status]}`}>{STATUS_LABELS[status]}</span>;
}
