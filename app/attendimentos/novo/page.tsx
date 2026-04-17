import { requireAuth } from '@/lib/auth/guards';
import { CreateAttendanceForm } from '@/components/attendances/create-attendance-form';
import { PageHeader } from '@/components/common/page-header';

export default async function NewAttendancePage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <PageHeader title="Novo atendimento" subtitle="Cadastre manualmente ou use a interpretação automática da mensagem do WhatsApp." />
      <CreateAttendanceForm />
    </div>
  );
}
