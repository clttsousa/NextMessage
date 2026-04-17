import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { CreateUserForm } from '@/components/users/create-user-form';
import { UserActions } from '@/components/users/user-actions';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';

export default async function UsersPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAdmin();

  const q = typeof searchParams.q === 'string' ? searchParams.q : '';

  const users = await prisma.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {},
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Gestão de usuários" subtitle="Administre contas, perfis, status de acesso e segurança operacional." />

      <form className="surface flex flex-col gap-3 p-4 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Buscar por nome ou e-mail" />
        <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Buscar</button>
      </form>

      <CreateUserForm />

      {users.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" description="Não há usuários para o filtro selecionado." />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr><th className="p-3 text-left">Usuário</th><th className="p-3 text-left">Perfil</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Último login</th><th className="p-3 text-left">Ações</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-800/80 align-top hover:bg-slate-800/40">
                  <td className="p-3"><p className="font-medium">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${u.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-200' : 'bg-slate-700 text-slate-200'}`}>{u.role === 'ADMIN' ? 'Administrador' : 'Atendente'}</span></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${u.isActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>{u.isActive ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="p-3 text-slate-400">{u.lastLoginAt ? u.lastLoginAt.toISOString() : 'Nunca acessou'}</td>
                  <td className="p-3"><UserActions user={{ id: u.id, isActive: u.isActive }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
