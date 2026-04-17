'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type FormValues = z.infer<typeof attendanceUpdateSchema>;

export function AttendanceDetailForm({ attendance, canEdit, canClaim, isAdmin, users }: { attendance: any; canEdit: boolean; canClaim: boolean; isAdmin: boolean; users: Array<{id:string;name:string}>; }) {
  const [msg, setMsg] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
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

  const submit = async (values: FormValues) => {
    setMsg('');
    const res = await fetch(`/api/attendances/${attendance.id}`, { method: 'PATCH', body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || 'Erro ao atualizar');
    setMsg('Atendimento atualizado com sucesso.');
    window.location.reload();
  };

  const claim = async () => {
    const res = await fetch(`/api/attendances/${attendance.id}/claim`, { method: 'POST' });
    if (res.ok) window.location.reload();
    else setMsg((await res.json()).error || 'Falha ao assumir');
  };

  const reassign = async (userId: string) => {
    const res = await fetch(`/api/attendances/${attendance.id}/reassign`, { method: 'POST', body: JSON.stringify({ assignedTo: userId }) });
    if (res.ok) window.location.reload();
    else setMsg((await res.json()).error || 'Falha ao reatribuir');
  };

  const reopen = async () => {
    const res = await fetch(`/api/attendances/${attendance.id}/reopen`, { method: 'POST' });
    if (res.ok) window.location.reload();
    else setMsg((await res.json()).error || 'Falha ao reabrir');
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {canClaim && <Button type="button" onClick={claim}>Assumir atendimento</Button>}
          {isAdmin && (attendance.status === 'RESOLVIDO' || attendance.status === 'VIROU_OS' || attendance.status === 'CANCELADO') && (
            <ConfirmDialog
              trigger={<Button type="button" variant="secondary">Reabrir atendimento</Button>}
              title="Reabrir atendimento"
              description="Este atendimento voltará para a fila operacional com status ativo. Deseja continuar?"
              confirmLabel="Sim, reabrir"
              onConfirm={reopen}
            />
          )}
          {isAdmin && attendance.assignedTo && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-2">
              <label className="text-xs text-slate-300">Reatribuir responsável</label>
              <select onChange={(e) => e.target.value && reassign(e.target.value)} defaultValue="" className="min-w-52">
                <option value="">Selecione</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </Card>

      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-50">Status e responsabilidade</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><label className="mb-1 block">Status</label><select {...register('status')} disabled={!canEdit}><option value="PENDENTE">Pendente</option><option value="EM_ATENDIMENTO">Em atendimento</option><option value="SEM_RETORNO">Sem retorno</option><option value="RETORNAR_DEPOIS">Retornar depois</option><option value="RESOLVIDO">Resolvido</option><option value="VIROU_OS">Virou O.S.</option><option value="CANCELADO">Cancelado</option></select></div>
            <div><label className="mb-1 block">Resultado do contato</label><input {...register('serviceResult')} disabled={!canEdit} placeholder="Resumo objetivo do contato" /></div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-50">Evolução do atendimento</h3>
          <div className="space-y-3">
            <div><label className="mb-1 block">Desfecho</label><textarea {...register('outcome')} disabled={!canEdit} /></div>
            <div><label className="mb-1 block">Observações</label><textarea {...register('notes')} disabled={!canEdit} /></div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-50">Retorno e O.S.</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3"><input type="checkbox" className="h-4 w-4" {...register('needsFollowUp')} disabled={!canEdit} />Precisa de retorno</label>
            <div><label className="mb-1 block">Data de retorno (ISO)</label><input {...register('followUpDate')} disabled={!canEdit} /></div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3"><input type="checkbox" className="h-4 w-4" {...register('becameServiceOrder')} disabled={!canEdit} />Virou ordem de serviço</label>
            <div><label className="mb-1 block">Número da O.S.</label><input {...register('serviceOrderNumber')} disabled={!canEdit} /></div>
            <div><label className="mb-1 block">Justificativa sem O.S.</label><input {...register('serviceOrderJustification')} disabled={!canEdit} /></div>
            <div><label className="mb-1 block">Motivo do cancelamento</label><input {...register('cancellationReason')} disabled={!canEdit} /></div>
          </div>
        </Card>

        {Object.values(errors).map((e, i) => <p key={i} className="text-sm text-rose-300">{e?.message as string}</p>)}
        {msg && <p className="text-sm text-emerald-300">{msg}</p>}
        {canEdit && <Button disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar atualização'}</Button>}
      </form>
    </div>
  );
}
