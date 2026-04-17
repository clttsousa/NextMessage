'use client';

import { Attendance, AttendanceStatus } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { StatusTransitionStepper } from '@/components/ui/status-transition-stepper';
import { cn } from '@/lib/utils';

type FormValues = z.infer<typeof attendanceUpdateSchema>;

type AttendanceDetail = Attendance;

export function AttendanceDetailForm({
  attendance,
  canEdit,
  canClaim,
  isAdmin,
  users,
  protocol,
  customerName
}: {
  attendance: AttendanceDetail;
  canEdit: boolean;
  canClaim: boolean;
  isAdmin: boolean;
  users: Array<{ id: string; name: string }>;
  protocol: string;
  customerName: string;
}) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(attendanceUpdateSchema),
    defaultValues: {
      status: attendance.status,
      serviceResult: attendance.serviceResult ?? '',
      outcome: attendance.outcome ?? '',
      notes: attendance.notes ?? '',
      needsFollowUp: attendance.needsFollowUp,
      followUpDate: attendance.followUpDate ? attendance.followUpDate.toISOString() : null,
      becameServiceOrder: attendance.becameServiceOrder,
      serviceOrderNumber: attendance.serviceOrderNumber ?? '',
      serviceOrderJustification: attendance.serviceOrderJustification ?? '',
      cancellationReason: attendance.cancellationReason ?? ''
    }
  });

  const status = watch('status');
  const needsFollowUp = watch('needsFollowUp');
  const becameServiceOrder = watch('becameServiceOrder');

  useEffect(() => {
    const current = JSON.parse(localStorage.getItem('ops.recent.protocols') ?? '[]') as Array<{ id: string; protocol: string; customerName: string }>;
    const next = [{ id: attendance.id, protocol, customerName }, ...current.filter((item) => item.id !== attendance.id)].slice(0, 10);
    localStorage.setItem('ops.recent.protocols', JSON.stringify(next));
  }, [attendance.id, protocol, customerName]);

  const submit = async (values: FormValues) => {
    const res = await fetch(`/api/attendances/${attendance.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Falha ao atualizar atendimento', { description: data.error || 'Confira os campos e tente novamente.' });
      return;
    }
    toast.success('Atendimento atualizado', { description: 'As informações mais recentes já estão disponíveis.' });
    router.refresh();
  };

  const runSimpleAction = async (label: string, promise: Promise<Response>, successMessage: string) => {
    setActionLoading(label);
    try {
      const res = await promise;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error('Falha na operação', { description: data.error || 'Não foi possível concluir.' });
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  };

  const canReopen = isAdmin && ['RESOLVIDO', 'VIROU_OS', 'CANCELADO'].includes(attendance.status as AttendanceStatus);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {canClaim && (
            <Button
              type="button"
              disabled={!!actionLoading}
              onClick={() => runSimpleAction('claim', fetch(`/api/attendances/${attendance.id}/claim`, { method: 'POST' }), 'Atendimento assumido.')}
            >
              {actionLoading === 'claim' ? <><Spinner className="mr-2" />Assumindo...</> : 'Assumir atendimento'}
            </Button>
          )}
          {canReopen && (
            <ConfirmDialog
              trigger={<Button type="button" variant="secondary" disabled={!!actionLoading}>{actionLoading === 'reopen' ? 'Reabrindo...' : 'Reabrir atendimento'}</Button>}
              title="Reabrir atendimento"
              description="Este atendimento voltará para a fila operacional com status ativo. Deseja continuar?"
              confirmLabel="Sim, reabrir"
              onConfirm={() => runSimpleAction('reopen', fetch(`/api/attendances/${attendance.id}/reopen`, { method: 'POST' }), 'Atendimento reaberto.')}
            />
          )}
          {isAdmin && attendance.assignedTo && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-2">
              <label className="text-xs text-slate-300">Reatribuir responsável</label>
              <select
                onChange={(e) =>
                  e.target.value &&
                  runSimpleAction(
                    'reassign',
                    fetch(`/api/attendances/${attendance.id}/reassign`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignedTo: e.target.value })
                    }),
                    'Responsável reatribuído com sucesso.'
                  )
                }
                defaultValue=""
                disabled={!!actionLoading}
                className="min-w-52"
              >
                <option value="">Selecione</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      <form onSubmit={handleSubmit(submit)} className="space-y-4 pb-20 md:pb-0">
        <StatusTransitionStepper current={attendance.status} selected={status} />

        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-50">Status e responsabilidade</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block">Status</label>
              <select {...register('status')} disabled={!canEdit || isSubmitting}>
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ATENDIMENTO">Em atendimento</option>
                <option value="SEM_RETORNO">Sem retorno</option>
                <option value="RETORNAR_DEPOIS">Retornar depois</option>
                <option value="RESOLVIDO">Resolvido</option>
                <option value="VIROU_OS">Virou O.S.</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block">Resultado do contato</label>
              <input {...register('serviceResult')} disabled={!canEdit || isSubmitting} placeholder="Resumo objetivo do contato" />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-50">Evolução do atendimento</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block">Desfecho</label>
              <textarea {...register('outcome')} disabled={!canEdit || isSubmitting} />
            </div>
            <div>
              <label className="mb-1 block">Observações</label>
              <textarea {...register('notes')} disabled={!canEdit || isSubmitting} />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-50">Retorno e O.S.</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
              <input type="checkbox" className="h-4 w-4" {...register('needsFollowUp')} disabled={!canEdit || isSubmitting} />Precisa de retorno
            </label>
            <div className={cn('transition-all duration-200', needsFollowUp ? 'opacity-100' : 'pointer-events-none max-h-0 overflow-hidden opacity-40 md:max-h-20')}>
              <label className="mb-1 block">Data de retorno (ISO)</label>
              <input {...register('followUpDate')} disabled={!canEdit || isSubmitting || !needsFollowUp} placeholder="Obrigatório quando há retorno" />
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
              <input type="checkbox" className="h-4 w-4" {...register('becameServiceOrder')} disabled={!canEdit || isSubmitting} />Virou ordem de serviço
            </label>
            <div className={cn('transition-all duration-200', becameServiceOrder ? 'opacity-100' : 'pointer-events-none max-h-0 overflow-hidden opacity-40 md:max-h-20')}>
              <label className="mb-1 block">Número da O.S.</label>
              <input {...register('serviceOrderNumber')} disabled={!canEdit || isSubmitting || !becameServiceOrder} placeholder="Informe o número da O.S." />
            </div>

            {!becameServiceOrder ? (
              <div className="md:col-span-2">
                <label className="mb-1 block">Justificativa sem O.S.</label>
                <input {...register('serviceOrderJustification')} disabled={!canEdit || isSubmitting} placeholder="Explique quando o atendimento não virou O.S." />
              </div>
            ) : null}

            {status === 'CANCELADO' ? (
              <div className="md:col-span-2">
                <label className="mb-1 block">Motivo do cancelamento</label>
                <input {...register('cancellationReason')} disabled={!canEdit || isSubmitting} />
              </div>
            ) : null}
          </div>
        </Card>

        {Object.values(errors).map((e, i) => (
          <p key={i} className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {e?.message as string}
          </p>
        ))}

        {canEdit && (
          <div className="mobile-sticky-actions">
            <Button className="w-full md:w-auto" disabled={isSubmitting || !!actionLoading}>
              {isSubmitting ? <><Spinner className="mr-2" />Salvando...</> : 'Salvar atualização'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
