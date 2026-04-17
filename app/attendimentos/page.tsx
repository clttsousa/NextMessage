import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { AttendancesTable } from '@/components/attendances/attendances-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';

export default async function AttendancesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const session = await requireAuth();

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
    <div>
      <PageHeader
        title="Atendimentos"
        subtitle="Gerencie ownership, prioridade e evolução dos atendimentos com rapidez operacional."
        actions={<Link href="/attendimentos/novo"><Button>Novo atendimento</Button></Link>}
      />

      <form className="surface mb-4 grid gap-3 p-4 lg:grid-cols-[1.5fr_220px_160px]">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Busca rápida</label>
          <input name="q" defaultValue={q} placeholder="Cliente, protocolo ou telefone" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Status</label>
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
        <div className="flex items-end gap-2">
          <Button className="w-full">Aplicar filtros</Button>
          <Link href="/attendimentos" className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Limpar</Link>
        </div>
      </form>

      {attendances.length === 0 ? (
        <EmptyState title="Nenhum atendimento encontrado" description="Ajuste os filtros ou crie um novo atendimento para iniciar o fluxo operacional." action={<Link href="/attendimentos/novo"><Button>Criar atendimento</Button></Link>} />
      ) : (
        <AttendancesTable
          currentUserId={session.userId}
          data={attendances.map((a) => ({
            id: a.id,
            protocol: a.protocol,
            customerName: a.customerName,
            phone: a.phone,
            reason: a.reason,
            status: a.status,
            assigneeName: a.assignee?.name || null,
            assignedTo: a.assignedTo,
            referenceDate: a.referenceDate.toISOString(),
            originalAttendantName: a.originalAttendantName
          }))}
        />
      )}
    </div>
  );
}
