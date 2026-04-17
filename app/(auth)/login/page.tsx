'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/schemas/auth';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

type FormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: FormValues) => {
    setError('');
    const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Falha ao autenticar');
      return;
    }
    window.location.href = '/dashboard';
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_40%)]" />
      <div className="surface relative z-10 w-full max-w-4xl overflow-hidden p-0 md:grid md:grid-cols-2">
        <div className="hidden border-r border-slate-800 bg-slate-900/70 p-8 md:block">
          <p className="text-xs uppercase tracking-[0.22em] text-blue-300">NextMessage Ops</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Gestão de atendimentos com clareza operacional</h1>
          <p className="mt-3 text-sm text-slate-400">Centralize ownership, status e histórico em uma plataforma interna mais confiável para o time.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Entrar</h2>
          <p className="text-sm text-slate-400">Acesse com sua conta corporativa.</p>
          <div>
            <label className="mb-1 block text-sm text-slate-300">E-mail</label>
            <input type="email" {...register('email')} placeholder="voce@empresa.com.br" />
            {errors.email && <p className="mt-1 text-sm text-rose-300">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Senha</label>
            <input type="password" {...register('password')} placeholder="Sua senha" />
            {errors.password && <p className="mt-1 text-sm text-rose-300">{errors.password.message}</p>}
          </div>
          {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-sm text-rose-300">{error}</p>}
          <Button disabled={isSubmitting} className="w-full">{isSubmitting ? 'Entrando...' : 'Entrar no painel'}</Button>
        </form>
      </div>
    </div>
  );
}
