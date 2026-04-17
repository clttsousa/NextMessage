import { AttendanceStatus } from '@prisma/client';
import { AppError } from '@/lib/api/http';

const transitions: Record<AttendanceStatus, AttendanceStatus[]> = {
  PENDENTE: ['EM_ATENDIMENTO', 'CANCELADO'],
  EM_ATENDIMENTO: ['SEM_RETORNO', 'RETORNAR_DEPOIS', 'RESOLVIDO', 'VIROU_OS', 'CANCELADO'],
  SEM_RETORNO: ['EM_ATENDIMENTO', 'RETORNAR_DEPOIS', 'RESOLVIDO', 'CANCELADO'],
  RETORNAR_DEPOIS: ['EM_ATENDIMENTO', 'SEM_RETORNO', 'RESOLVIDO', 'CANCELADO'],
  RESOLVIDO: [],
  VIROU_OS: [],
  CANCELADO: []
};

export function validateStatusTransition(from: AttendanceStatus, to: AttendanceStatus) {
  if (from === to) return;
  if (!transitions[from].includes(to)) {
    throw new AppError(422, `Transição de status inválida: ${from} -> ${to}`);
  }
}

export function getReopenStatus(assignedTo: string | null) {
  return assignedTo ? 'EM_ATENDIMENTO' : 'PENDENTE';
}
