import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { AttendanceDetailForm } from '@/components/attendances/attendance-detail-form';
import { format } from 'date-fns';

export default async function AttendanceDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  const attendance = await prisma.attendance.findUnique({ where: { id: params.id }, include: { assignee: true, history: { include: { performer: true }, orderBy: { createdAt: 'desc' } } } });
  if (!attendance) notFound();

  const canEdit = session.role === 'ADMIN' || attendance.assignedTo === session.userId;
  const canClaim = !attendance.assignedTo;
  const users = session.role === 'ADMIN' ? await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true } }) : [];

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold">Atendimento {attendance.protocol}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-300">
          <span>Cliente: {attendance.customerName}</span>
          <span>Telefone: {attendance.phone}</span>
          <span>Responsável: {attendance.assignee?.name ?? 'Não atribuído'}</span>
          <StatusBadge status={attendance.status} />
        </div>
        <p className="mt-3 text-sm">Motivo: {attendance.reason}</p>
      </Card>

      <AttendanceDetailForm attendance={attendance} canEdit={canEdit} canClaim={canClaim} isAdmin={session.role === 'ADMIN'} users={users} />

      <Card>
        <h2 className="text-lg font-semibold">Histórico</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {attendance.history.map((h) => <li key={h.id} className="border-l border-slate-700 pl-3">{h.description} • {h.performer?.name ?? 'Sistema'} • {format(h.createdAt, 'dd/MM/yyyy HH:mm')}</li>)}
        </ul>
      </Card>
    </div>
  );
}
