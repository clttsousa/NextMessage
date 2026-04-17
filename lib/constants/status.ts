import { AttendanceStatus } from '@prisma/client';

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PENDENTE: 'Pendente',
  EM_ATENDIMENTO: 'Em atendimento',
  SEM_RETORNO: 'Sem retorno',
  RETORNAR_DEPOIS: 'Retornar depois',
  RESOLVIDO: 'Resolvido',
  VIROU_OS: 'Virou O.S.',
  CANCELADO: 'Cancelado'
};
