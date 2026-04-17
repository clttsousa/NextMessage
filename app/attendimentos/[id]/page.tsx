import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { AttendanceDetailForm } from '@/components/attendances/attendance-detail-form';
import { format } from 'date-fns';
import { AvatarInitials } from '@/components/ui/avatar-initials';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { PageHeader } from '@/components/ui/page-header';

export default async function AttendanceDetailPage({ params }: { params: { id: string } }) {
  const { session } = await requireAuth();
  const attendance = await prisma.attendance.findUnique({ where: { id: params.id }, include: { assignee: true, history: { include: { performer: true }, orderBy: { createdAt: 'desc' } } } });
  if (!attendance) notFound();

  const canEdit = session.role === 'ADMIN' || attendance.assignedTo === session.userId;
  const canClaim = !attendance.assignedTo;
  const users = session.role === 'ADMIN' ? await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true } }) : [];

  return (
    <div className="space-y-4">
      <PageHeader title={`Atendimento ${attendance.protocol}`} subtitle="Workspace operacional completo para condução, acompanhamento e registro do atendimento." />

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <h2 className="text-lg font-semibold">Identificação e cliente</h2>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="text-slate-400">Cliente</dt><dd className="font-medium text-slate-100">{attendance.customerName}</dd></div>
            <div><dt className="text-slate-400">Telefone</dt><dd className="font-medium text-slate-100">{attendance.phone}</dd></div>
            <div><dt className="text-slate-400">Endereço</dt><dd className="font-medium text-slate-100">{attendance.address}</dd></div>
            <div><dt className="text-slate-400">Atendente original</dt><dd className="font-medium text-slate-100">{attendance.originalAttendantName}</dd></div>
            <div><dt className="text-slate-400">Data de referência</dt><dd className="font-medium text-slate-100">{format(attendance.referenceDate, 'dd/MM/yyyy HH:mm')}</dd></div>
            <div><dt className="text-slate-400">Motivo</dt><dd className="font-medium text-slate-100">{attendance.reason}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Status e responsabilidade</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={attendance.status} />
            <PriorityBadge referenceDate={attendance.referenceDate} status={attendance.status} />
          </div>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-xs text-slate-400">Responsável atual</p>
            <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-100"><AvatarInitials name={attendance.assignee?.name ?? 'Não atribuído'} />{attendance.assignee?.name ?? 'Não atribuído'}</p>
            <p className="mt-2 text-xs text-slate-400">Atribuído em: {attendance.assignedAt ? format(attendance.assignedAt, 'dd/MM/yyyy HH:mm') : '—'}</p>
            <p className="text-xs text-slate-400">Contato em: {attendance.contactedAt ? format(attendance.contactedAt, 'dd/MM/yyyy HH:mm') : '—'}</p>
          </div>
        </Card>
      </div>

      <AttendanceDetailForm attendance={attendance} canEdit={canEdit} canClaim={canClaim} isAdmin={session.role === 'ADMIN'} users={users} />

      <Card>
        <h2 className="text-lg font-semibold">Histórico do atendimento</h2>
        <ul className="mt-4 space-y-3">
          {attendance.history.map((h) => (
            <li key={h.id} className="relative border-l border-slate-700 pl-4">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-blue-400" />
              <p className="text-sm font-medium text-slate-100">{h.description}</p>
              <p className="mt-1 text-xs text-slate-400">{h.performer?.name ?? 'Sistema'} • {format(h.createdAt, 'dd/MM/yyyy HH:mm')}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
