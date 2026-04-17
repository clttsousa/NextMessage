import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/common/metric-card';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const session = await requireAuth();

  const [total, pendente, andamento, semRetorno, followUp, resolvido, virouOs, myCount, byUser, recent, followUpList, activeUsers] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: 'PENDENTE' } }),
    prisma.attendance.count({ where: { status: 'EM_ATENDIMENTO' } }),
    prisma.attendance.count({ where: { status: 'SEM_RETORNO' } }),
    prisma.attendance.count({ where: { status: 'RETORNAR_DEPOIS' } }),
    prisma.attendance.count({ where: { status: 'RESOLVIDO' } }),
    prisma.attendance.count({ where: { status: 'VIROU_OS' } }),
    prisma.attendance.count({ where: { assignedTo: session.userId } }),
    prisma.attendance.groupBy({ by: ['assignedTo'], _count: true }),
    prisma.attendance.findMany({ take: 8, orderBy: { updatedAt: 'desc' }, include: { assignee: true } }),
    prisma.attendance.findMany({ where: { needsFollowUp: true }, take: 6, orderBy: { followUpDate: 'asc' }, include: { assignee: true } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true } })
  ]);

  const userMap = new Map(activeUsers.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-5">
      <PageHeader title="Visão operacional" subtitle="Acompanhe o que exige ação imediata, ownership e evolução diária dos atendimentos." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total de atendimentos" value={total} />
        <MetricCard label="Pendentes" value={pendente} tone="warning" hint="Exigem priorização inicial" />
        <MetricCard label="Em atendimento" value={andamento} tone="primary" hint="Em andamento pelo time" />
        <MetricCard label="Sem retorno" value={semRetorno} tone="warning" />
        <MetricCard label="Retornar depois" value={followUp} tone="primary" />
        <MetricCard label="Resolvidos" value={resolvido} tone="success" />
        <MetricCard label="Viraram O.S." value={virouOs} tone="success" />
        <MetricCard label="Meus atendimentos" value={myCount} hint="Itens atualmente atribuídos a você" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Movimentações recentes</h2>
            <p className="section-subtitle">Últimas alterações do fluxo</p>
          </div>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="section-subtitle">Nenhuma movimentação recente.</p>
            ) : recent.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{a.protocol} • {a.customerName}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Responsável: {a.assignee?.name ?? 'Não atribuído'} • Atualizado em {format(a.updatedAt, 'dd/MM HH:mm')}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="section-title">Itens com retorno pendente</h2>
            <div className="mt-3 space-y-2">
              {followUpList.length === 0 ? <p className="section-subtitle">Nenhum atendimento aguardando retorno.</p> : followUpList.map((a) => (
                <div key={a.id} className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-sm">
                  <p className="font-medium">{a.customerName}</p>
                  <p className="text-xs text-slate-400">{a.protocol} • {a.assignee?.name ?? 'Sem responsável'}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Carga por responsável</h2>
            <div className="mt-3 space-y-2 text-sm">
              {byUser.map((row) => (
                <div key={row.assignedTo ?? 'na'} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
                  <span className="text-slate-300">{row.assignedTo ? userMap.get(row.assignedTo) ?? 'Usuário removido' : 'Sem responsável'}</span>
                  <span className="font-semibold">{row._count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
