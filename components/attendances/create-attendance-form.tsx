'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceCreateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';

const formSchema = attendanceCreateSchema.extend({
  referenceDateInput: z.string().min(1, 'Data de referência é obrigatória')
}).omit({ referenceDate: true });

type FormValues = z.infer<typeof formSchema>;

export function CreateAttendanceForm() {
  const [rawMessage, setRawMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { referenceDateInput: new Date().toISOString().slice(0, 10) }
  });

  const parseMessage = async () => {
    setFeedback('');
    const res = await fetch('/api/attendances/parse', { method: 'POST', body: JSON.stringify({ rawMessage }) });
    const data = await res.json();
    if (!res.ok) return setFeedback(data.error || 'Não foi possível interpretar a mensagem');
    setValue('customerName', data.customerName);
    setValue('address', data.address);
    setValue('reason', data.reason);
    setValue('phone', data.phone);
    setValue('protocol', data.protocol);
    setValue('originalAttendantName', data.originalAttendantName);
    setFeedback('Campos preenchidos automaticamente. Revise e confirme o cadastro.');
  };

  const submit = async (values: FormValues) => {
    setFeedback('');
    const payload = { ...values, referenceDate: new Date(`${values.referenceDateInput}T00:00:00.000Z`).toISOString() };
    const res = await fetch('/api/attendances', { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return setFeedback(data.error || 'Erro ao criar atendimento');
    window.location.href = `/attendimentos/${data.id}`;
  };

  return (
    <div className="space-y-4">
      <section className="surface p-4">
        <h2 className="section-title">Importação rápida do WhatsApp</h2>
        <p className="section-subtitle mt-1">Cole a mensagem recebida para pré-preencher os campos operacionais.</p>
        <textarea value={rawMessage} onChange={(e) => setRawMessage(e.target.value)} className="mt-3 min-h-28" placeholder="Cole aqui a mensagem completa do grupo" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={parseMessage}>Interpretar mensagem</Button>
          <Button type="button" variant="ghost" onClick={() => setRawMessage('')}>Limpar texto</Button>
        </div>
      </section>

      <form onSubmit={handleSubmit(submit)} className="surface grid gap-3 p-4 md:grid-cols-2">
        <h2 className="section-title md:col-span-2">Cadastro estruturado</h2>
        <div><label className="mb-1 block text-sm text-slate-300">Protocolo</label><input {...register('protocol')} /></div>
        <div><label className="mb-1 block text-sm text-slate-300">Cliente</label><input {...register('customerName')} /></div>
        <div className="md:col-span-2"><label className="mb-1 block text-sm text-slate-300">Endereço</label><input {...register('address')} /></div>
        <div><label className="mb-1 block text-sm text-slate-300">Telefone</label><input {...register('phone')} /></div>
        <div><label className="mb-1 block text-sm text-slate-300">Atendente original</label><input {...register('originalAttendantName')} /></div>
        <div className="md:col-span-2"><label className="mb-1 block text-sm text-slate-300">Motivo</label><textarea {...register('reason')} /></div>
        <div><label className="mb-1 block text-sm text-slate-300">Data de referência</label><input type="date" {...register('referenceDateInput')} /></div>

        {Object.values(errors).map((e, i) => <p key={i} className="md:col-span-2 text-sm text-rose-300">• {e?.message as string}</p>)}
        {feedback && <p className="md:col-span-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-sm text-slate-200">{feedback}</p>}
        <div className="md:col-span-2"><Button disabled={isSubmitting}>{isSubmitting ? 'Criando...' : 'Criar atendimento'}</Button></div>
      </form>
    </div>
  );
}
