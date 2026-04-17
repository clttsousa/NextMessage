import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { CreateUserForm } from '@/components/users/create-user-form';
import { UserActions } from '@/components/users/user-actions';

export default async function UsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Gestão de Usuários</h1>
      <CreateUserForm />
      <Card>
        <table className="w-full text-sm">
          <thead><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">E-mail</th><th className="p-2 text-left">Perfil</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Último login</th><th className="p-2 text-left">Ações</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u.id} className="border-t border-slate-800"><td className="p-2">{u.name}</td><td className="p-2">{u.email}</td><td className="p-2">{u.role}</td><td className="p-2">{u.isActive ? 'Ativo' : 'Inativo'}</td><td className="p-2">{u.lastLoginAt?.toISOString() ?? '-'}</td><td className="p-2"><UserActions user={{ id: u.id, isActive: u.isActive }} /></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
