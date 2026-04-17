'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export function UserActions({ user }: { user: { id: string; isActive: boolean } }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [openReset, setOpenReset] = useState(false);
  const [loading, setLoading] = useState<'toggle' | 'password' | null>(null);

  const toggle = async () => {
    setLoading('toggle');
    const response = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) });
    setLoading(null);
    if (!response.ok) {
      toast.error('Não foi possível atualizar o status do usuário.');
      return;
    }

    toast.success(user.isActive ? 'Usuário desativado.' : 'Usuário ativado.');
    router.refresh();
  };

  const resetPassword = async () => {
    if (!password.trim()) return;
    setLoading('password');
    const response = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resetPassword: password }) });
    setLoading(null);
    if (!response.ok) {
      toast.error('Não foi possível redefinir a senha.');
      return;
    }

    toast.success('Senha temporária redefinida com sucesso.');
    setOpenReset(false);
    setPassword('');
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmDialog
        trigger={<Button type="button" variant={user.isActive ? 'danger' : 'secondary'} disabled={loading === 'toggle'}>{loading === 'toggle' ? 'Processando...' : user.isActive ? 'Desativar' : 'Ativar'}</Button>}
        title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
        description={user.isActive ? 'Esse usuário perderá acesso imediato ao sistema.' : 'O usuário voltará a ter acesso imediato ao sistema.'}
        confirmLabel={user.isActive ? 'Confirmar desativação' : 'Confirmar ativação'}
        destructive={user.isActive}
        onConfirm={toggle}
      />

      <Dialog open={openReset} onOpenChange={setOpenReset}>
        <DialogTrigger asChild><Button type="button" variant="secondary">Redefinir senha</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha temporária</DialogTitle>
            <DialogDescription>Defina uma senha temporária para o usuário. Oriente-o a alterá-la no próximo login.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-1 block">Nova senha temporária</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Digite a senha temporária" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenReset(false)}>Cancelar</Button>
            <Button onClick={resetPassword} disabled={!password.trim() || loading === 'password'}>{loading === 'password' ? <><Spinner className="mr-2" />Salvando...</> : 'Salvar senha'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
