import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { AttendancesWorkspace } from '@/components/attendances/attendances-workspace';

export default async function AttendancesPage() {
  await requireAuth();

  const attendances = await prisma.attendance.findMany({ include: { assignee: true }, orderBy: { createdAt: 'desc' }, take: 200 });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Fila operacional" title="Atendimentos" subtitle="Use busca tolerante a erros, visão kanban e filtros rápidos para atuar com mais velocidade." actions={<Link href="/attendimentos/novo"><Button>Novo atendimento</Button></Link>} />
      <AttendancesWorkspace rows={attendances.map(a => ({ id: a.id, protocol: a.protocol, customerName: a.customerName, phone: a.phone, reason: a.reason, status: a.status, assigneeName: a.assignee?.name || null, referenceDate: a.referenceDate.toISOString(), originalAttendantName: a.originalAttendantName }))} />
    </div>
  );
}
