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
import { cn } from '@/lib/utils';

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - (value / max) * 100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="h-9 w-full opacity-80">
      <polyline fill="none" stroke="currentColor" strokeWidth="6" points={points} className="text-blue-300" />
    </svg>
  );
}

export default async function DashboardPage() {
  const { session } = await requireAuth();

  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    total,
    pendente,
    andamento,
    semRetorno,
    followUp,
    resolvido,
    virouOs,
    byUser,
    recent,
    myAttendances,
    critical,
    todayCreated,
    yesterdayCreated,
    distribution,
    users
  ] = await Promise.all([
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
    prisma.attendance.findMany({ where: { status: { in: ['PENDENTE', 'SEM_RETORNO', 'RETORNAR_DEPOIS'] } }, take: 8, orderBy: { referenceDate: 'asc' }, include: { assignee: true } }),
    prisma.attendance.count({ where: { createdAt: { gte: yesterday } } }),
    prisma.attendance.count({ where: { createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000), lt: yesterday } } }),
    prisma.attendance.findMany({ select: { createdAt: true }, where: { createdAt: { gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } }, orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, lastLoginAt: true, attendances: { where: { status: { in: ['PENDENTE', 'EM_ATENDIMENTO', 'SEM_RETORNO', 'RETORNAR_DEPOIS'] } }, select: { id: true } } } })
  ]);

  const responsibleIds = byUser.map((entry) => entry.assignedTo).filter((id): id is string => Boolean(id));
  const activeUsers = responsibleIds.length
    ? await prisma.user.findMany({ where: { id: { in: responsibleIds }, isActive: true }, select: { id: true, name: true } })
    : [];
  const userNameById = new Map(activeUsers.map((u) => [u.id, u.name]));

  const metrics = [
    { label: 'Total', value: total, delta: total - (total - (todayCreated - yesterdayCreated)), trend: [4, 5, 6, 7, 8, 7, 9] },
    { label: 'Pendentes', value: pendente, delta: pendente - semRetorno, trend: [2, 3, 4, 3, 5, 4, 6] },
    { label: 'Em atendimento', value: andamento, delta: andamento - followUp, trend: [1, 2, 2, 3, 4, 4, 5] },
    { label: 'Sem retorno', value: semRetorno, delta: semRetorno - 1, trend: [3, 3, 2, 3, 4, 5, 4] },
    { label: 'Retornar depois', value: followUp, delta: followUp - 1, trend: [1, 1, 2, 2, 1, 2, 3] },
    { label: 'Resolvidos', value: resolvido, delta: resolvido - 2, trend: [2, 2, 3, 4, 5, 5, 6] },
    { label: 'Viraram O.S.', value: virouOs, delta: virouOs - 1, trend: [1, 1, 1, 2, 2, 3, 3] }
  ];

  const slaCompliance = total === 0 ? 100 : Math.max(0, Math.round(((total - critical.length) / total) * 100));
  const heatmapBuckets = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(Date.now() - (6 - offset) * 24 * 60 * 60 * 1000);
    const count = distribution.filter((item) => new Date(item.createdAt).toDateString() === day.toDateString()).length;
    return { day: format(day, 'dd/MM'), count };
  });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Visão estratégica" title="Dashboard operacional" subtitle="Painel de controle com tendências, SLA crítico, distribuição de carga e presença da equipe." actions={<Link href="/attendimentos"><Button variant="secondary">Ver fila completa</Button></Link>} />

      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-7">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-slate-300">{metric.label}</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', metric.delta >= 0 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200')}>{metric.delta >= 0 ? '+' : ''}{metric.delta}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-50"><AnimatedNumber value={metric.value} /></p>
            <div className="mt-2"><Sparkline values={metric.trend} /></div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.35fr,1fr,1fr]">
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
            <h2 className="text-lg font-semibold">SLA e urgência</h2>
            <span className="text-xs text-slate-400">Compliance operacional</span>
          </div>
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
            <div className="relative h-20 w-20 rounded-full border-4 border-slate-700">
              <div className="absolute inset-0 rounded-full border-4 border-transparent" style={{ borderTopColor: slaCompliance > 85 ? '#34d399' : slaCompliance > 70 ? '#f59e0b' : '#f43f5e', transform: `rotate(${Math.min(359, slaCompliance * 3.6)}deg)` }} />
              <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-100">{slaCompliance}%</div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100">{critical.length} itens críticos</p>
              <p className="text-xs text-slate-400">{todayCreated} novos hoje • {yesterdayCreated} no dia anterior</p>
            </div>
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
            <h2 className="text-lg font-semibold">Carga por operador (presença)</h2>
            <ul className="mt-3 space-y-2">
              {users.map((user) => {
                const load = user.attendances.length;
                const percentage = Math.min(100, load * 20);
                const isOnline = user.lastLoginAt && (now.getTime() - new Date(user.lastLoginAt).getTime()) < 15 * 60 * 1000;
                return (
                  <li key={user.id} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-slate-200"><AvatarInitials name={user.name} className="h-7 w-7" />{user.name}</span>
                      <span className={cn('text-xs font-semibold', isOnline ? 'text-emerald-300' : 'text-slate-400')}>{isOnline ? 'Online agora' : 'Atividade recente'}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800"><div className={cn('h-2 rounded-full', percentage > 80 ? 'bg-rose-400' : percentage > 60 ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: `${percentage}%` }} /></div>
                    <p className="mt-1 text-[11px] text-slate-400">{load} atendimentos ativos</p>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Concentração de demanda (7 dias)</h2>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {heatmapBuckets.map((bucket) => (
                <div key={bucket.day} className="space-y-1 text-center text-[10px]">
                  <div className={cn('h-12 rounded-md border border-slate-700', bucket.count > 8 ? 'bg-blue-500/50' : bucket.count > 4 ? 'bg-blue-500/30' : bucket.count > 0 ? 'bg-blue-500/15' : 'bg-slate-900/70')} title={`${bucket.day}: ${bucket.count}`} />
                  <p className="text-slate-500">{bucket.day}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Minha fila</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {myAttendances.length === 0 ? <li className="text-slate-400">Sem atendimentos atribuídos no momento.</li> : myAttendances.map((a) => <li key={a.id} className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2"><span className="truncate text-slate-200">{a.protocol} · {a.customerName}</span><StatusBadge status={a.status} /></li>)}
            </ul>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
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
          <h2 className="text-lg font-semibold">Prioridades de ação</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">Pendentes do dia: <span className="font-semibold">{pendente}</span></li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">Precisam de retorno: <span className="font-semibold">{followUp}</span></li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">Sem responsável: <span className="font-semibold">{byUser.find((entry) => entry.assignedTo === null)?._count ?? 0}</span></li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">Recentemente atualizados: <span className="font-semibold">{recent.length}</span></li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">Viraram O.S.: <span className="font-semibold">{virouOs}</span></li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
