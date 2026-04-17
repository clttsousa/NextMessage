import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { PageHeader } from '@/components/ui/page-header';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/animated-number';

export default async function DashboardPage() {
  const { session } = await requireAuth();

  const [total, pendente, andamento, semRetorno, followUp, resolvido, virouOs, byUser, recent, myAttendances, critical] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: 'PENDENTE' } }),
    prisma.attendance.count({ where: { status: 'EM_ATENDIMENTO' } }),
    prisma.attendance.count({ where: { status: 'SEM_RETORNO' } }),
    prisma.attendance.count({ where: { status: 'RETORNAR_DEPOIS' } }),
    prisma.attendance.count({ where: { status: 'RESOLVIDO' } }),
    prisma.attendance.count({ where: { status: 'VIROU_OS' } }),
    prisma.attendance.groupBy({ by: ['assignedTo'], _count: true }),
    prisma.attendance.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { assignee: true } }),
    prisma.attendance.findMany({ where: { assignedTo: session.userId }, take: 6, orderBy: [{ createdAt: 'desc' }] }),
    prisma.attendance.findMany({ where: { status: { in: ['PENDENTE', 'SEM_RETORNO', 'RETORNAR_DEPOIS'] } }, take: 6, orderBy: { referenceDate: 'asc' }, include: { assignee: true } })
  ]);
  const responsibleIds = byUser.map((entry) => entry.assignedTo).filter((id): id is string => Boolean(id));
  const activeUsers = responsibleIds.length
    ? await prisma.user.findMany({ where: { id: { in: responsibleIds }, isActive: true }, select: { id: true, name: true } })
    : [];
  const userNameById = new Map(activeUsers.map((u) => [u.id, u.name]));

  const metrics = [
    ['Total', total],
    ['Pendentes', pendente],
    ['Em atendimento', andamento],
    ['Sem retorno', semRetorno],
    ['Retornar depois', followUp],
    ['Resolvidos', resolvido],
    ['Viraram O.S.', virouOs]
  ];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Visão estratégica" title="Dashboard operacional" subtitle="Prioridades, ownership e próximos passos em um único painel de ação." actions={<Link href="/attendimentos"><Button variant="secondary">Ver fila completa</Button></Link>} />

      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-7">
        {metrics.map(([label, value]) => (
          <Card key={label as string} className="p-4 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
            <p className="text-sm text-slate-300">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-50"><AnimatedNumber value={value as number} /></p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.25fr,1fr,1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Atendimentos recentes</h2>
            <p className="text-xs text-slate-400">Últimas movimentações</p>
          </div>
          <ul className="space-y-2">
            {recent.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 transition hover:bg-slate-800/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-100">{a.protocol} · {a.customerName}</p>
                    <p className="text-xs text-slate-400">{a.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <PriorityBadge referenceDate={a.referenceDate} status={a.status} />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                  <AvatarInitials name={a.assignee?.name ?? 'Não atribuído'} className="h-6 w-6 text-[10px]" />
                  <span>{a.assignee?.name ?? 'Sem responsável'}</span>
                  <span className="text-slate-500">•</span>
                  <span>{format(a.createdAt, 'dd/MM HH:mm')}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Itens críticos / SLA</h2>
            <Link href="/attendimentos" className="text-xs text-blue-200 hover:text-blue-100">Ir para fila</Link>
          </div>
          <ul className="space-y-2">
            {critical.length === 0 ? <li className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-400">Sem itens críticos no momento.</li> : critical.map((a) => (
              <li key={a.id} className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                <p className="font-medium text-slate-100">{a.protocol} · {a.customerName}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                  <PriorityBadge referenceDate={a.referenceDate} status={a.status} />
                  <span>{a.assignee?.name ?? 'Sem responsável'}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold">Distribuição por responsável</h2>
            <ul className="mt-3 space-y-2">
              {byUser.map((i) => {
                const responsibleName = i.assignedTo ? userNameById.get(i.assignedTo) ?? `Usuário (${i.assignedTo.slice(0, 6)})` : 'Não atribuído';
                return (
                <li key={i.assignedTo ?? 'none'} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-200"><AvatarInitials name={responsibleName} className="h-7 w-7" />{responsibleName}</span>
                  <span className="font-semibold text-slate-100">{i._count}</span>
                </li>
              );})}
            </ul>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Minha fila</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {myAttendances.length === 0 ? <li className="text-slate-400">Sem atendimentos atribuídos no momento.</li> : myAttendances.map((a) => <li key={a.id} className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2"><span className="truncate text-slate-200">{a.protocol} · {a.customerName}</span><StatusBadge status={a.status} /></li>)}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}
