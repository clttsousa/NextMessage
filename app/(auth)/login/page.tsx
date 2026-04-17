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
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Falha ao autenticar');
      return;
    }
    const data = await res.json();
    window.location.href = data.mustChangePassword ? '/trocar-senha' : '/dashboard';
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4 rounded-xl border border-slate-800 bg-card p-6">
        <h1 className="text-2xl font-semibold">Acesso ao Painel Operacional</h1>
        <div>
          <label>E-mail</label>
          <input className="w-full" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-rose-300">{errors.email.message}</p>}
        </div>
        <div>
          <label>Senha</label>
          <input className="w-full" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-rose-300">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <Button disabled={isSubmitting} className="w-full">{isSubmitting ? 'Entrando...' : 'Entrar'}</Button>
      </form>
    </div>
  );
}
