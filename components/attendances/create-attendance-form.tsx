'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { attendanceCreateSchema } from '@/lib/schemas/attendance';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

const formSchema = attendanceCreateSchema.extend({
  referenceDateInput: z.string().min(1, 'Data de referência é obrigatória')
}).omit({ referenceDate: true });

type FormValues = z.infer<typeof formSchema>;

export function CreateAttendanceForm() {
  const router = useRouter();
  const [rawMessage, setRawMessage] = useState('');
  const [parsing, setParsing] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { referenceDateInput: new Date().toISOString().slice(0, 10) }
  });

  const parseMessage = async () => {
    setParsing(true);
    const res = await fetch('/api/attendances/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawMessage }) });
    const data = await res.json();
    setParsing(false);
    if (!res.ok) {
      toast.error('Não foi possível interpretar a mensagem', { description: data.error || 'Confira o conteúdo da mensagem colada.' });
      return;
    }

    setValue('customerName', data.customerName);
    setValue('address', data.address);
    setValue('reason', data.reason);
    setValue('phone', data.phone);
    setValue('protocol', data.protocol);
    setValue('originalAttendantName', data.originalAttendantName);
    toast.success('Mensagem interpretada com sucesso', { description: 'Revise os campos antes de concluir o cadastro.' });
  };

  const submit = async (values: FormValues) => {
    const payload = {
      ...values,
      referenceDate: new Date(`${values.referenceDateInput}T00:00:00.000Z`).toISOString()
    };
    const res = await fetch('/api/attendances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Erro ao criar atendimento', { description: data.error || 'Verifique os dados informados.' });
      return;
    }

    toast.success('Atendimento criado com sucesso');
    router.push(`/attendimentos/${data.id}`);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Entrada bruta (WhatsApp)</h2>
        <textarea value={rawMessage} onChange={(e) => setRawMessage(e.target.value)} className="w-full min-h-28" placeholder="Cole aqui a mensagem completa do grupo" />
        <Button type="button" variant="secondary" onClick={parseMessage} disabled={parsing || !rawMessage.trim()}>{parsing ? <><Spinner className="mr-2" />Interpretando...</> : 'Interpretar mensagem automaticamente'}</Button>
      </Card>

      <form onSubmit={handleSubmit(submit)} className="surface grid gap-3 p-4 md:grid-cols-3">
        <h2 className="md:col-span-3 text-lg font-semibold">Cadastro estruturado</h2>
        <div><label>Protocolo</label><input {...register('protocol')} /></div>
        <div><label>Cliente</label><input {...register('customerName')} /></div>
        <div><label>Telefone</label><input {...register('phone')} /></div>
        <div className="md:col-span-2"><label>Endereço</label><input {...register('address')} /></div>
        <div><label>Atendente original</label><input {...register('originalAttendantName')} /></div>
        <div className="md:col-span-3"><label>Motivo</label><textarea {...register('reason')} /></div>
        <div><label>Data de referência</label><input type="date" {...register('referenceDateInput')} /></div>
        {Object.values(errors).map((e, i) => <p key={i} className="md:col-span-3 text-sm text-rose-300">{e?.message as string}</p>)}
        <Button disabled={isSubmitting} className="md:col-span-3">{isSubmitting ? <><Spinner className="mr-2" />Criando...</> : 'Criar atendimento'}</Button>
      </form>
    </div>
  );
}
