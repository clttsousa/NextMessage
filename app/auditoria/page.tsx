import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';

export default async function AuditPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAdmin();

  const action = typeof searchParams.action === 'string' ? searchParams.action : '';
  const entity = typeof searchParams.entity === 'string' ? searchParams.entity : '';

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(entity ? { entityType: entity } : {})
    },
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Auditoria" subtitle="Rastreie eventos críticos com contexto de ator, entidade e alterações realizadas." />

      <form className="surface grid gap-3 p-4 md:grid-cols-3">
        <select name="entity" defaultValue={entity}>
          <option value="">Todas as entidades</option>
          <option value="AUTH">Autenticação</option>
          <option value="USER">Usuário</option>
          <option value="ATTENDANCE">Atendimento</option>
        </select>
        <input name="action" defaultValue={action} placeholder="Ação (ex.: UPDATE, CLAIM)" />
        <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Filtrar</button>
      </form>

      {logs.length === 0 ? (
        <EmptyState title="Sem eventos de auditoria" description="Não há logs para os filtros selecionados." />
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <Card key={l.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{l.action} • {l.entityType}</p>
                  <p className="text-xs text-slate-400">{l.actor?.name ?? 'Sistema'} • {l.createdAt.toISOString()} • #{l.entityId.slice(0, 8)}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{l.ipAddress ?? 'IP não informado'}</span>
              </div>
              <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <summary className="cursor-pointer text-sm text-slate-300">Ver before/after</summary>
                <pre className="mt-2 overflow-auto text-xs text-slate-300">{JSON.stringify({ old: l.oldValues, new: l.newValues }, null, 2)}</pre>
              </details>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
