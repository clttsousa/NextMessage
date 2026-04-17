'use client';

import { Button } from '@/components/ui/button';

export function UserActions({ user }: { user: { id: string; isActive: boolean } }) {
  const toggle = async () => {
    await fetch(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !user.isActive }) });
    window.location.reload();
  };

  const resetPassword = async () => {
    const pwd = prompt('Digite a nova senha temporária:');
    if (!pwd) return;
    await fetch(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ resetPassword: pwd }) });
    window.location.reload();
  };

  return <div className="flex gap-2"><Button type="button" className="bg-slate-700" onClick={toggle}>{user.isActive ? 'Desativar' : 'Ativar'}</Button><Button type="button" className="bg-amber-700" onClick={resetPassword}>Resetar senha</Button></div>;
}
