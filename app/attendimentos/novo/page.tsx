import { requireAuth } from '@/lib/auth/guards';
import { CreateAttendanceForm } from '@/components/attendances/create-attendance-form';

export default async function NewAttendancePage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Novo atendimento</h1>
      <p className="text-sm text-slate-300">Você pode colar a mensagem do WhatsApp para pré-preenchimento e ajustar antes de salvar.</p>
      <CreateAttendanceForm />
    </div>
  );
}
