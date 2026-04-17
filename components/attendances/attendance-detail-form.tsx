'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';

type FormValues = z.infer<typeof attendanceUpdateSchema>;

export function AttendanceDetailForm({ attendance, canEdit, canClaim, isAdmin, users }: { attendance: any; canEdit: boolean; canClaim: boolean; isAdmin: boolean; users: Array<{ id: string; name: string }>; }) {
  const [msg, setMsg] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(attendanceUpdateSchema),
    defaultValues: {
      status: attendance.status,
      serviceResult: attendance.serviceResult ?? '',
      outcome: attendance.outcome ?? '',
      notes: attendance.notes ?? '',
      needsFollowUp: attendance.needsFollowUp,
      followUpDate: attendance.followUpDate ? new Date(attendance.followUpDate).toISOString() : null,
      becameServiceOrder: attendance.becameServiceOrder,
      serviceOrderNumber: attendance.serviceOrderNumber ?? '',
      serviceOrderJustification: attendance.serviceOrderJustification ?? '',
      cancellationReason: attendance.cancellationReason ?? ''
    }
  });

  const status = watch('status');
  const needsFollowUp = watch('needsFollowUp');
  const becameOs = watch('becameServiceOrder');

  const statusHint = useMemo(() => {
    if (status === 'RETORNAR_DEPOIS') return 'Defina a data de retorno para manter o fluxo consistente.';
    if (status === 'CANCELADO') return 'Informe motivo de cancelamento para auditoria e rastreabilidade.';
    if (status === 'RESOLVIDO') return 'Descreva brevemente como o problema foi resolvido.';
    return 'Atualize status e detalhes operacionais com precisão.';
  }, [status]);

  const submit = async (values: FormValues) => {
    setMsg('');
    const res = await fetch(`/api/attendances/${attendance.id}`, { method: 'PATCH', body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || 'Erro ao atualizar');
    setMsg('Atendimento atualizado com sucesso.');
    window.location.reload();
  };

  const claim = async () => {
    setBusyAction('claim');
    const res = await fetch(`/api/attendances/${attendance.id}/claim`, { method: 'POST' });
    if (res.ok) window.location.reload();
    else setMsg((await res.json()).error || 'Falha ao assumir');
    setBusyAction('');
  };

  const reassign = async (userId: string) => {
    if (!confirm('Confirmar reatribuição deste atendimento?')) return;
    setBusyAction('reassign');
    const res = await fetch(`/api/attendances/${attendance.id}/reassign`, { method: 'POST', body: JSON.stringify({ assignedTo: userId }) });
    if (res.ok) window.location.reload();
    else setMsg((await res.json()).error || 'Falha ao reatribuir');
    setBusyAction('');
  };

  const reopen = async () => {
    if (!confirm('Confirmar reabertura do atendimento?')) return;
    setBusyAction('reopen');
    const res = await fetch(`/api/attendances/${attendance.id}/reopen`, { method: 'POST' });
    if (res.ok) window.location.reload();
    else setMsg((await res.json()).error || 'Falha ao reabrir');
    setBusyAction('');
  };

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {canClaim && <Button type="button" disabled={busyAction === 'claim'} onClick={claim}>Assumir atendimento</Button>}
          {isAdmin && attendance.assignedTo && (
            <select onChange={(e) => e.target.value && reassign(e.target.value)} defaultValue="" className="max-w-xs">
              <option value="">Reatribuir responsável...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          {isAdmin && (attendance.status === 'RESOLVIDO' || attendance.status === 'VIROU_OS' || attendance.status === 'CANCELADO') && (
            <Button type="button" variant="secondary" disabled={busyAction === 'reopen'} onClick={reopen}>Reabrir atendimento</Button>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-400">{statusHint}</p>
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <section className="surface grid gap-3 p-4 md:grid-cols-2">
          <h3 className="section-title md:col-span-2">Evolução do atendimento</h3>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Status</label>
            <select {...register('status')} disabled={!canEdit}><option value="PENDENTE">Pendente</option><option value="EM_ATENDIMENTO">Em atendimento</option><option value="SEM_RETORNO">Sem retorno</option><option value="RETORNAR_DEPOIS">Retornar depois</option><option value="RESOLVIDO">Resolvido</option><option value="VIROU_OS">Virou O.S.</option><option value="CANCELADO">Cancelado</option></select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Resultado do contato</label>
            <input {...register('serviceResult')} disabled={!canEdit} placeholder="Ex.: contato sem aceite" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-300">Desfecho</label>
            <textarea {...register('outcome')} disabled={!canEdit} placeholder="Descreva o desfecho do atendimento" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-300">Observações</label>
            <textarea {...register('notes')} disabled={!canEdit} placeholder="Contexto adicional para o time" />
          </div>
        </section>

        <section className="surface grid gap-3 p-4 md:grid-cols-2">
          <h3 className="section-title md:col-span-2">Retorno e O.S.</h3>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-2 text-sm"><input type="checkbox" {...register('needsFollowUp')} disabled={!canEdit} className="w-auto" /> Precisa de retorno</label>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Data de retorno (ISO)</label>
            <input {...register('followUpDate')} disabled={!canEdit || !needsFollowUp} placeholder="2026-04-20T10:00:00.000Z" />
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-2 text-sm"><input type="checkbox" {...register('becameServiceOrder')} disabled={!canEdit} className="w-auto" /> Virou ordem de serviço</label>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Número da O.S.</label>
            <input {...register('serviceOrderNumber')} disabled={!canEdit || !becameOs} placeholder="Número da O.S." />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Justificativa sem O.S.</label>
            <input {...register('serviceOrderJustification')} disabled={!canEdit} placeholder="Motivo quando não houver número" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Motivo de cancelamento</label>
            <input {...register('cancellationReason')} disabled={!canEdit || status !== 'CANCELADO'} />
          </div>
        </section>

        {(Object.values(errors).length > 0 || msg) && (
          <section className="surface p-4">
            {Object.values(errors).map((e, i) => <p key={i} className="text-sm text-rose-300">• {e?.message as string}</p>)}
            {msg && <p className="mt-2 text-sm text-emerald-300">{msg}</p>}
          </section>
        )}

        {canEdit && <Button disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar atualização'}</Button>}
      </form>
    </div>
  );
}
