'use client';

import { Attendance, AttendanceStatus } from '@prisma/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type FormValues = z.infer<typeof attendanceUpdateSchema>;

type AttendanceDetail = Attendance;

export function AttendanceDetailForm({
  attendance,
  canEdit,
  canClaim,
  isAdmin,
  users
}: {
  attendance: AttendanceDetail;
  canEdit: boolean;
  canClaim: boolean;
  isAdmin: boolean;
  users: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

  const submit = async (values: FormValues) => {
    setError('');
    setMsg('');
    const res = await fetch(`/api/attendances/${attendance.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Erro ao atualizar');
    setMsg('Atendimento atualizado com sucesso.');
    router.refresh();
  };

  const runSimpleAction = async (label: string, promise: Promise<Response>, successMessage: string) => {
    setError('');
    setMsg('');
    setActionLoading(label);
    try {
      const res = await promise;
      if (!res.ok) {
        setError((await res.json()).error || 'Falha na operação');
        return;
      }
      setMsg(successMessage);
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
              {actionLoading === 'claim' ? 'Assumindo...' : 'Assumir atendimento'}
            </Button>
          )}
          {canReopen && (
            <ConfirmDialog
              trigger={<Button type="button" variant="secondary" disabled={!!actionLoading}>Reabrir atendimento</Button>}
              title="Reabrir atendimento"
              description="Este atendimento voltará para a fila operacional com status ativo. Deseja continuar?"
              confirmLabel="Sim, reabrir"
              onConfirm={() => runSimpleAction('reopen', fetch(`/api/attendances/${attendance.id}/reopen`, { method: 'POST' }), 'Atendimento reaberto.')}
            />
          )}
          {isAdmin && attendance.assignedTo && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-2">
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

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
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
            <div>
              <label className="mb-1 block">Data de retorno (ISO)</label>
              <input {...register('followUpDate')} disabled={!canEdit || isSubmitting} />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3">
              <input type="checkbox" className="h-4 w-4" {...register('becameServiceOrder')} disabled={!canEdit || isSubmitting} />Virou ordem de serviço
            </label>
            <div>
              <label className="mb-1 block">Número da O.S.</label>
              <input {...register('serviceOrderNumber')} disabled={!canEdit || isSubmitting} />
            </div>
            <div>
              <label className="mb-1 block">Justificativa sem O.S.</label>
              <input {...register('serviceOrderJustification')} disabled={!canEdit || isSubmitting} />
            </div>
            <div>
              <label className="mb-1 block">Motivo do cancelamento</label>
              <input {...register('cancellationReason')} disabled={!canEdit || isSubmitting} />
            </div>
          </div>
        </Card>

        {Object.values(errors).map((e, i) => (
          <p key={i} className="text-sm text-rose-300">
            {e?.message as string}
          </p>
        ))}
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {msg && <p className="text-sm text-emerald-300">{msg}</p>}
        {canEdit && <Button disabled={isSubmitting || !!actionLoading}>{isSubmitting ? 'Salvando...' : 'Salvar atualização'}</Button>}
      </form>
    </div>
  );
}
