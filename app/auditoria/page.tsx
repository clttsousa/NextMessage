import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { SemanticDiff } from '@/components/audit/semantic-diff';
import { Button } from '@/components/ui/button';

export default async function AuditPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAdmin();

  const actor = typeof searchParams.actor === 'string' ? searchParams.actor : undefined;
  const action = typeof searchParams.action === 'string' ? searchParams.action : undefined;
  const entity = typeof searchParams.entity === 'string' ? searchParams.entity : undefined;

  const logs = await prisma.auditLog.findMany({
    where: {
      actorUserId: actor || undefined,
      action: action || undefined,
      entityType: entity || undefined
    },
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const actors = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, take: 50 });
  const actionOptions = ['LOGIN', 'CREATE', 'UPDATE', 'REOPEN', 'REASSIGN', 'RESET_PASSWORD', 'CLAIM', 'CHANGE_PASSWORD'];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Governança" title="Auditoria" subtitle="Rastreie alterações com leitura semântica de actor, ação, entidade e diferenças por campo." />

      <Card>
        <form className="grid gap-3 md:grid-cols-[1.2fr,1fr,1fr,auto] md:items-end">
          <div>
            <label className="mb-1 block">Usuário</label>
            <select name="actor" defaultValue={actor ?? ''}>
              <option value="">Todos</option>
              {actors.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block">Ação</label>
            <select name="action" defaultValue={action ?? ''}>
              <option value="">Todas</option>
              {actionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block">Entidade</label>
            <input name="entity" defaultValue={entity} placeholder="Ex: ATTENDANCE" />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Filtrar</Button>
            <a href="/auditoria" className="inline-flex h-10 items-center rounded-xl border border-slate-700 px-4 text-sm">Limpar</a>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {logs.map((l) => (
          <Card key={l.id}>
            <div className="grid gap-3 lg:grid-cols-[1.7fr,auto] lg:items-center">
              <div className="flex items-center gap-2">
                <AvatarInitials name={l.actor?.name ?? 'Sistema'} className="h-8 w-8 text-[10px]" />
                <div>
                  <p className="text-sm font-medium text-slate-100">{l.actor?.name ?? 'Sistema'} · <span className="text-blue-200">{l.action}</span></p>
                  <p className="text-xs text-slate-400">{l.entityType} #{l.entityId.slice(0, 8)}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{format(l.createdAt, 'dd/MM/yyyy HH:mm:ss')}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Campos alterados: {Object.keys(((l.newValues ?? {}) as Record<string, unknown>)).filter((key) => ((l.oldValues ?? {}) as Record<string, unknown>)[key] !== ((l.newValues ?? {}) as Record<string, unknown>)[key]).length}</p>

            <details className="mt-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-200">Ver diferenças</summary>
              <div className="mt-3"><SemanticDiff oldValues={l.oldValues} newValues={l.newValues} /></div>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
