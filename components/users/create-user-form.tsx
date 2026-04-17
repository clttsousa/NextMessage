'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/lib/schemas/user';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type FormValues = z.infer<typeof userSchema>;

export function CreateUserForm() {
  const [msg, setMsg] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(userSchema), defaultValues: { role: 'ATTENDANT', isActive: true, mustChangePassword: true } });

  const submit = async (values: FormValues) => {
    const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || 'Erro');
    else { setMsg('Usuário criado com sucesso'); window.location.reload(); }
  };

  return <form onSubmit={handleSubmit(submit)} className="grid gap-2 rounded-lg border border-slate-800 p-3 md:grid-cols-3">
    <input placeholder="Nome" {...register('name')} />
    <input placeholder="E-mail" {...register('email')} />
    <input placeholder="Senha" type="password" {...register('password')} />
    <select {...register('role')}><option value="ATTENDANT">Atendente</option><option value="ADMIN">Administrador</option></select>
    <label className="flex items-center gap-2"><input type="checkbox" {...register('isActive')} />Ativo</label>
    <label className="flex items-center gap-2"><input type="checkbox" {...register('mustChangePassword')} />Troca de senha no primeiro login</label>
    {Object.values(errors).map((e, i) => <p key={i} className="text-rose-300 text-sm md:col-span-3">{e?.message as string}</p>)}
    {msg && <p className="text-sm md:col-span-3">{msg}</p>}
    <Button disabled={isSubmitting} className="md:col-span-3">Criar usuário</Button>
  </form>;
}
