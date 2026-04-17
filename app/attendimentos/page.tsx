import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { AttendancesTable } from '@/components/attendances/attendances-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';

export default async function AttendancesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAuth();

  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;

  const attendances = await prisma.attendance.findMany({
    where: {
      AND: [
        q ? { OR: [{ customerName: { contains: q, mode: 'insensitive' } }, { protocol: { contains: q } }, { phone: { contains: q } }] } : {},
        status ? { status: status as any } : {}
      ]
    },
    include: { assignee: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Atendimentos" subtitle="Gerencie fila, responsável e próximos passos com prioridade operacional." actions={<Link href="/attendimentos/novo"><Button>Novo atendimento</Button></Link>} />

      <Card>
        <form className="grid gap-3 md:grid-cols-[1.3fr,1fr,auto,auto] md:items-end">
          <div>
            <label className="mb-1 block">Busca inteligente</label>
            <input name="q" defaultValue={q} placeholder="Cliente, protocolo ou telefone" />
          </div>
          <div>
            <label className="mb-1 block">Status</label>
            <select name="status" defaultValue={status || ''}>
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ATENDIMENTO">Em atendimento</option>
              <option value="SEM_RETORNO">Sem retorno</option>
              <option value="RETORNAR_DEPOIS">Retornar depois</option>
              <option value="RESOLVIDO">Resolvido</option>
              <option value="VIROU_OS">Virou O.S.</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <Button className="h-[42px]" type="submit">Aplicar filtros</Button>
          <Link href="/attendimentos" className="inline-flex h-[42px] items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800">Limpar</Link>
        </form>
      </Card>

      <AttendancesTable data={attendances.map(a => ({ id: a.id, protocol: a.protocol, customerName: a.customerName, phone: a.phone, reason: a.reason, status: a.status, assigneeName: a.assignee?.name || null, referenceDate: a.referenceDate.toISOString(), originalAttendantName: a.originalAttendantName }))} />
    </div>
  );
}
