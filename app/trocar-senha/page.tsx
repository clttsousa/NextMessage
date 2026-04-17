'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

const schema = z
  .object({
    password: z
      .string()
      .min(10, 'Mínimo de 10 caracteres')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
      .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula')
      .regex(/[0-9]/, 'Inclua ao menos um número')
      .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um caractere especial'),
    confirmPassword: z.string().min(1, 'Confirme a senha')
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem'
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError('');
    setSuccess('');

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: values.password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Falha ao alterar senha');
      return;
    }

    setSuccess('Senha alterada com sucesso. Redirecionando...');
    setTimeout(() => router.push('/dashboard'), 600);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-100">Troca obrigatória de senha</h1>
      <p className="text-sm text-slate-300">Por segurança, você precisa definir uma nova senha antes de continuar.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div>
          <label className="mb-1 block">Nova senha</label>
          <input type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-rose-300">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1 block">Confirmar nova senha</label>
          <input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-sm text-rose-300">{errors.confirmPassword.message}</p>}
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}
        <Button disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar nova senha'}</Button>
      </form>
    </div>
  );
}
