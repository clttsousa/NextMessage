import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { CreateUserForm } from '@/components/users/create-user-form';
import { UserActions } from '@/components/users/user-actions';
import { format } from 'date-fns';
import { RoleBadge } from '@/components/ui/badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { PageHeader } from '@/components/ui/page-header';

export default async function UsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4">
      <PageHeader title="Gestão de usuários" subtitle="Administre acesso, perfis e segurança da equipe operacional." />
      <CreateUserForm />
      <Card className="overflow-auto p-0">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-300">
              <th className="p-3 text-left font-medium">Usuário</th>
              <th className="p-3 text-left font-medium">Perfil</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">Último login</th>
              <th className="p-3 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800/80 align-top transition hover:bg-slate-800/35">
                <td className="p-3">
                  <div className="inline-flex items-center gap-2">
                    <AvatarInitials name={u.name} />
                    <div>
                      <p className="font-medium text-slate-100">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3"><RoleBadge role={u.role} /></td>
                <td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-600/20 text-slate-300'}`}>{u.isActive ? 'Ativo' : 'Inativo'}</span></td>
                <td className="p-3 text-slate-300">{u.lastLoginAt ? format(u.lastLoginAt, 'dd/MM/yyyy HH:mm') : 'Nunca acessou'}</td>
                <td className="p-3"><UserActions user={{ id: u.id, isActive: u.isActive }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
