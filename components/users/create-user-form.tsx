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
    setMsg('');
    const res = await fetch('/api/users', { method: 'POST', body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || 'Erro ao criar usuário');
    setMsg('Usuário criado com sucesso.');
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="surface grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
      <h2 className="section-title md:col-span-2 xl:col-span-3">Criar usuário</h2>
      <div><label className="mb-1 block text-sm text-slate-300">Nome</label><input placeholder="Nome completo" {...register('name')} /></div>
      <div><label className="mb-1 block text-sm text-slate-300">E-mail</label><input placeholder="email@empresa.com.br" {...register('email')} /></div>
      <div><label className="mb-1 block text-sm text-slate-300">Senha inicial</label><input type="password" placeholder="Senha temporária" {...register('password')} /></div>
      <div><label className="mb-1 block text-sm text-slate-300">Perfil</label><select {...register('role')}><option value="ATTENDANT">Atendente</option><option value="ADMIN">Administrador</option></select></div>
      <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-2 text-sm"><input type="checkbox" className="w-auto" {...register('isActive')} />Conta ativa</label>
      <label className="flex items-center gap-2 rounded-xl border border-slate-700 p-2 text-sm"><input type="checkbox" className="w-auto" {...register('mustChangePassword')} />Forçar troca de senha no primeiro acesso</label>
      {Object.values(errors).map((e, i) => <p key={i} className="text-rose-300 text-sm md:col-span-2 xl:col-span-3">• {e?.message as string}</p>)}
      {msg && <p className="text-sm text-slate-200 md:col-span-2 xl:col-span-3">{msg}</p>}
      <div className="md:col-span-2 xl:col-span-3"><Button disabled={isSubmitting}>{isSubmitting ? 'Criando...' : 'Criar usuário'}</Button></div>
    </form>
  );
}
