import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { AttendancesTable } from '@/components/attendances/attendances-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';

const PAGE_SIZE = 20;

export default async function AttendancesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAuth();

  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;
  const page = Math.max(1, Number(typeof searchParams.page === 'string' ? searchParams.page : 1));

  const where = {
    AND: [
      q ? { OR: [{ customerName: { contains: q, mode: 'insensitive' as const } }, { protocol: { contains: q } }, { phone: { contains: q } }] } : {},
      status ? { status: status as never } : {}
    ]
  };

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({ where, include: { assignee: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.attendance.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const queryBase = new URLSearchParams();
  if (q) queryBase.set('q', q);
  if (status) queryBase.set('status', status);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Fila operacional" title="Atendimentos" subtitle="Acompanhe SLA, ownership e próximos passos com foco em velocidade de ação." actions={<Link href="/attendimentos/novo"><Button>Novo atendimento</Button></Link>} />

      <Card className="sticky top-3 z-20">
        <form className="grid gap-3 md:grid-cols-[1.7fr,1fr,auto,auto] md:items-end">
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

      {attendances.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-semibold text-slate-100">Nenhum atendimento encontrado</p>
          <p className="mt-1 text-sm text-slate-400">Ajuste os filtros ou limpe a busca para carregar novamente a fila.</p>
        </Card>
      ) : (
        <AttendancesTable data={attendances.map(a => ({ id: a.id, protocol: a.protocol, customerName: a.customerName, phone: a.phone, reason: a.reason, status: a.status, assigneeName: a.assignee?.name || null, referenceDate: a.referenceDate.toISOString(), originalAttendantName: a.originalAttendantName }))} />
      )}

      <Card className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-300">Página {page} de {totalPages} • {total} registros</p>
        <div className="flex gap-2">
          <Link aria-disabled={page <= 1} className={`rounded-lg border px-3 py-1.5 text-sm ${page <= 1 ? 'pointer-events-none border-slate-800 text-slate-500' : 'border-slate-600 text-slate-100 hover:bg-slate-800'}`} href={`/attendimentos?${new URLSearchParams({ ...Object.fromEntries(queryBase), page: String(page - 1) }).toString()}`}>Anterior</Link>
          <Link aria-disabled={page >= totalPages} className={`rounded-lg border px-3 py-1.5 text-sm ${page >= totalPages ? 'pointer-events-none border-slate-800 text-slate-500' : 'border-slate-600 text-slate-100 hover:bg-slate-800'}`} href={`/attendimentos?${new URLSearchParams({ ...Object.fromEntries(queryBase), page: String(page + 1) }).toString()}`}>Próxima</Link>
        </div>
      </Card>
    </div>
  );
}
