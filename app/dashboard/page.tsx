import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';

export default async function DashboardPage() {
  await requireAuth();

  const [total, pendente, andamento, semRetorno, followUp, resolvido, virouOs, byUser, recent] = await Promise.all([
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: 'PENDENTE' } }),
    prisma.attendance.count({ where: { status: 'EM_ATENDIMENTO' } }),
    prisma.attendance.count({ where: { status: 'SEM_RETORNO' } }),
    prisma.attendance.count({ where: { status: 'RETORNAR_DEPOIS' } }),
    prisma.attendance.count({ where: { status: 'RESOLVIDO' } }),
    prisma.attendance.count({ where: { status: 'VIROU_OS' } }),
    prisma.attendance.groupBy({ by: ['assignedTo'], _count: true }),
    prisma.attendance.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { assignee: true } })
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard Operacional</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[['Total', total], ['Pendentes', pendente], ['Em atendimento', andamento], ['Sem retorno', semRetorno], ['Retornar depois', followUp], ['Resolvidos', resolvido], ['Virou O.S.', virouOs]].map(([l,v]) => (
          <Card key={l}><p className="text-sm text-slate-300">{l}</p><p className="text-3xl font-bold">{v}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Distribuição por responsável</h2>
        <ul className="mt-2 text-sm">{byUser.map((i) => <li key={i.assignedTo ?? 'none'}>{i.assignedTo ?? 'Não atribuído'}: {i._count}</li>)}</ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Atendimentos recentes</h2>
        <ul className="mt-2 space-y-2 text-sm">{recent.map((a) => <li key={a.id}>{a.protocol} • {a.customerName} • {a.assignee?.name ?? 'Sem responsável'}</li>)}</ul>
      </Card>
    </div>
  );
}
