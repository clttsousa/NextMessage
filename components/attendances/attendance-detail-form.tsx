'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceUpdateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';

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
    setMsg('Atendimento atualizado com sucesso');
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
      {canClaim && <Button type="button" onClick={claim}>Assumir atendimento</Button>}
      {isAdmin && attendance.assignedTo && (
        <div className="flex gap-2 items-center">
          <label>Reatribuir:</label>
          <select onChange={(e) => e.target.value && reassign(e.target.value)} defaultValue="">
            <option value="">Selecione</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
      {isAdmin && (attendance.status === 'RESOLVIDO' || attendance.status === 'VIROU_OS' || attendance.status === 'CANCELADO') && (
        <Button type="button" onClick={reopen} className="bg-amber-600">Reabrir atendimento</Button>
      )}
      <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-lg border border-slate-800 p-4 md:grid-cols-2">
        <div><label>Status</label><select {...register('status')} disabled={!canEdit}><option value="PENDENTE">Pendente</option><option value="EM_ATENDIMENTO">Em atendimento</option><option value="SEM_RETORNO">Sem retorno</option><option value="RETORNAR_DEPOIS">Retornar depois</option><option value="RESOLVIDO">Resolvido</option><option value="VIROU_OS">Virou O.S.</option><option value="CANCELADO">Cancelado</option></select></div>
        <div><label>Resultado do contato</label><input {...register('serviceResult')} disabled={!canEdit} /></div>
        <div className="md:col-span-2"><label>Desfecho</label><textarea {...register('outcome')} disabled={!canEdit} /></div>
        <div className="md:col-span-2"><label>Observações</label><textarea {...register('notes')} disabled={!canEdit} /></div>
        <div><label>Número da O.S.</label><input {...register('serviceOrderNumber')} disabled={!canEdit} /></div>
        <div><label>Justificativa sem O.S.</label><input {...register('serviceOrderJustification')} disabled={!canEdit} /></div>
        <div className="md:col-span-2"><label>Motivo cancelamento</label><input {...register('cancellationReason')} disabled={!canEdit} /></div>
        <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" {...register('needsFollowUp')} disabled={!canEdit} /><label>Precisa de retorno</label></div>
        <div><label>Data de retorno (ISO)</label><input {...register('followUpDate')} disabled={!canEdit} /></div>
        <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" {...register('becameServiceOrder')} disabled={!canEdit} /><label>Virou ordem de serviço</label></div>
        {Object.values(errors).map((e, i) => <p key={i} className="md:col-span-2 text-sm text-rose-300">{e?.message as string}</p>)}
        {canEdit && <Button disabled={isSubmitting} className="md:col-span-2">Salvar atualização</Button>}
      </form>
      {msg && <p className="text-sm text-amber-300">{msg}</p>}
    </div>
  );
}
