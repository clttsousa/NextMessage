import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { StatusBadge, Pill } from '@/components/ui/badge';
import { AttendanceDetailForm } from '@/components/attendances/attendance-detail-form';
import { format } from 'date-fns';
import { Timeline } from '@/components/common/timeline';
import { PageHeader } from '@/components/common/page-header';

export default async function AttendanceDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  const attendance = await prisma.attendance.findUnique({ where: { id: params.id }, include: { assignee: true, history: { include: { performer: true }, orderBy: { createdAt: 'desc' } } } });
  if (!attendance) notFound();

  const canEdit = session.role === 'ADMIN' || attendance.assignedTo === session.userId;
  const canClaim = !attendance.assignedTo;
  const users = session.role === 'ADMIN' ? await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true } }) : [];

  return (
    <div className="space-y-5">
      <PageHeader title={`Atendimento ${attendance.protocol}`} subtitle="Workspace operacional para acompanhamento completo do atendimento." actions={<StatusBadge status={attendance.status} />} />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card>
            <h2 className="section-title">Identificação do cliente</h2>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <p><span className="text-slate-400">Cliente:</span> {attendance.customerName}</p>
              <p><span className="text-slate-400">Telefone:</span> {attendance.phone}</p>
              <p><span className="text-slate-400">Atendente original:</span> {attendance.originalAttendantName}</p>
              <p><span className="text-slate-400">Data de referência:</span> {format(attendance.referenceDate, 'dd/MM/yyyy')}</p>
              <p className="md:col-span-2"><span className="text-slate-400">Endereço:</span> {attendance.address}</p>
              <p className="md:col-span-2"><span className="text-slate-400">Motivo:</span> {attendance.reason}</p>
            </div>
          </Card>

          <AttendanceDetailForm attendance={attendance} canEdit={canEdit} canClaim={canClaim} isAdmin={session.role === 'ADMIN'} users={users} />
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="section-title">Status e responsabilidade</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-slate-300">Responsável atual</p>
              <Pill>{attendance.assignee?.name ?? 'Ainda sem responsável'}</Pill>
              {attendance.assignedAt && <p className="text-xs text-slate-400">Atribuído em {format(attendance.assignedAt, 'dd/MM/yyyy HH:mm')}</p>}
              {attendance.contactedAt && <p className="text-xs text-slate-400">Contatado em {format(attendance.contactedAt, 'dd/MM/yyyy HH:mm')}</p>}
              {attendance.needsFollowUp && <p className="rounded-lg border border-violet-500/40 bg-violet-500/10 p-2 text-xs text-violet-200">Requer retorno {attendance.followUpDate ? `em ${format(attendance.followUpDate, 'dd/MM/yyyy HH:mm')}` : 'com data pendente'}.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Histórico operacional</h2>
            <div className="mt-4">
              <Timeline items={attendance.history.map((h) => ({ id: h.id, title: h.description, subtitle: h.performer?.name ?? 'Sistema', meta: format(h.createdAt, 'dd/MM/yyyy HH:mm') }))} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
