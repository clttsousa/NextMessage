'use client';

import { Button } from '@/components/ui/button';

export function UserActions({ user }: { user: { id: string; isActive: boolean } }) {
  const toggle = async () => {
    const ok = confirm(user.isActive ? 'Deseja realmente desativar este usuário?' : 'Deseja reativar este usuário?');
    if (!ok) return;
    await fetch(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !user.isActive }) });
    window.location.reload();
  };

  const resetPassword = async () => {
    const pwd = prompt('Digite a nova senha temporária:');
    if (!pwd) return;
    const ok = confirm('Confirmar redefinição de senha?');
    if (!ok) return;
    await fetch(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ resetPassword: pwd }) });
    window.location.reload();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant={user.isActive ? 'danger' : 'secondary'} className="px-3 py-1.5 text-xs" onClick={toggle}>{user.isActive ? 'Desativar' : 'Ativar'}</Button>
      <Button type="button" variant="ghost" className="px-3 py-1.5 text-xs" onClick={resetPassword}>Resetar senha</Button>
    </div>
  );
}
