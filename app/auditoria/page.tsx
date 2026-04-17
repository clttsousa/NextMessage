import { requireAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { SemanticDiff } from '@/components/audit/semantic-diff';

export default async function AuditPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div className="space-y-4">
      <PageHeader title="Auditoria" subtitle="Rastreie alterações de forma semântica, com comparação de antes/depois por campo." />
      <div className="space-y-3">
        {logs.map((l) => (
          <Card key={l.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <AvatarInitials name={l.actor?.name ?? 'Sistema'} className="h-7 w-7 text-[10px]" />
                <div>
                  <p className="text-sm font-medium text-slate-100">{l.actor?.name ?? 'Sistema'} · <span className="text-blue-200">{l.action}</span></p>
                  <p className="text-xs text-slate-400">{l.entityType} #{l.entityId.slice(0, 8)}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{format(l.createdAt, 'dd/MM/yyyy HH:mm:ss')}</span>
            </div>

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
