'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/lib/schemas/user';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

type FormValues = z.infer<typeof userSchema>;

export function CreateUserForm() {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(userSchema), defaultValues: { role: 'ATTENDANT', isActive: true, mustChangePassword: true } });

  const submit = async (values: FormValues) => {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || 'Erro ao criar usuário');
    else { setMsg('Usuário criado com sucesso'); router.refresh(); }
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-50">Criar usuário</h2>
      <p className="mt-1 text-sm text-slate-400">Cadastre novos operadores e configure o perfil de acesso.</p>
      <form onSubmit={handleSubmit(submit)} className="mt-4 grid gap-3 md:grid-cols-2">
        <div><label className="mb-1 block">Nome completo</label><input placeholder="Ex.: Maria Souza" {...register('name')} /></div>
        <div><label className="mb-1 block">E-mail</label><input placeholder="usuario@empresa.com" {...register('email')} /></div>
        <div><label className="mb-1 block">Senha temporária</label><input placeholder="Defina uma senha" type="password" {...register('password')} /></div>
        <div><label className="mb-1 block">Perfil</label><select {...register('role')}><option value="ATTENDANT">Atendente</option><option value="ADMIN">Administrador</option></select></div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3"><input type="checkbox" className="h-4 w-4" {...register('isActive')} />Conta ativa</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 p-3"><input type="checkbox" className="h-4 w-4" {...register('mustChangePassword')} />Troca de senha no primeiro login</label>
        {Object.values(errors).map((e, i) => <p key={i} className="text-sm text-rose-300 md:col-span-2">{e?.message as string}</p>)}
        {msg && <p className="text-sm text-emerald-300 md:col-span-2">{msg}</p>}
        <div className="md:col-span-2"><Button disabled={isSubmitting}>Criar usuário</Button></div>
      </form>
    </Card>
  );
}
