import { AttendanceStatus } from '@prisma/client';
import { STATUS_LABELS } from '@/lib/constants/status';
import { cn } from '@/lib/utils';

const flow: AttendanceStatus[] = ['PENDENTE', 'EM_ATENDIMENTO', 'SEM_RETORNO', 'RETORNAR_DEPOIS', 'RESOLVIDO', 'VIROU_OS', 'CANCELADO'];

export function StatusTransitionStepper({ current, selected }: { current: AttendanceStatus; selected: AttendanceStatus }) {
  const currentIndex = flow.indexOf(current);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Fluxo de status</p>
      <ol className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-7">
        {flow.map((step, index) => {
          const isCurrent = step === current;
          const isSelected = step === selected;
          const isPast = index < currentIndex;
          const allowed = Math.abs(index - currentIndex) <= 2 || isCurrent;

          return (
            <li
              key={step}
              className={cn(
                'rounded-xl border px-3 py-2 text-xs transition',
                isCurrent && 'border-blue-400/60 bg-blue-500/20 text-blue-100',
                isSelected && !isCurrent && 'border-violet-400/60 bg-violet-500/15 text-violet-100',
                isPast && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
                !isPast && !isCurrent && !isSelected && 'border-slate-700 text-slate-300'
              )}
            >
              <p className="font-semibold">{STATUS_LABELS[step]}</p>
              <p className="mt-1 text-[11px] text-slate-400">{allowed ? 'Transição operacional permitida' : 'Validação necessária'}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
