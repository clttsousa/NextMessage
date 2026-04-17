import { requireAuth } from '@/lib/auth/guards';
import { CreateAttendanceForm } from '@/components/attendances/create-attendance-form';
import { PageHeader } from '@/components/ui/page-header';

export default async function NewAttendancePage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <PageHeader title="Novo atendimento" subtitle="Cole a mensagem do WhatsApp para pré-preenchimento e conclua o cadastro com validação estruturada." eyebrow="Cadastro operacional" />
      <CreateAttendanceForm />
    </div>
  );
}
