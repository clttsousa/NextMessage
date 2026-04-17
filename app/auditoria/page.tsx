import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';

export default async function AuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Auditoria</h1>
      <Card>
        <table className="w-full text-sm">
          <thead><tr><th className="p-2 text-left">Quando</th><th className="p-2 text-left">Usuário</th><th className="p-2 text-left">Entidade</th><th className="p-2 text-left">Ação</th><th className="p-2 text-left">Detalhes</th></tr></thead>
          <tbody>{logs.map((l) => <tr key={l.id} className="border-t border-slate-800 align-top"><td className="p-2">{l.createdAt.toISOString()}</td><td className="p-2">{l.actor?.name ?? 'Sistema'}</td><td className="p-2">{l.entityType}#{l.entityId.slice(0,8)}</td><td className="p-2">{l.action}</td><td className="p-2"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify({ old: l.oldValues, new: l.newValues }, null, 2)}</pre></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
