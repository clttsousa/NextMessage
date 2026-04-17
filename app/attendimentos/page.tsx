import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { AttendancesTable } from '@/components/attendances/attendances-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Atendimentos</h1>
        <Link href="/attendimentos/novo"><Button>Novo atendimento</Button></Link>
      </div>
      <form className="grid gap-3 rounded-lg border border-slate-800 p-3 md:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Buscar por cliente, protocolo ou telefone" />
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
        <button className="rounded-md border border-slate-700 px-3">Filtrar</button>
      </form>
      <AttendancesTable data={attendances.map(a => ({ id: a.id, protocol: a.protocol, customerName: a.customerName, phone: a.phone, status: a.status, assigneeName: a.assignee?.name || null }))} />
    </div>
  );
}
