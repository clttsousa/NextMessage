import { AttendanceStatus } from '@prisma/client';
import { z } from 'zod';

export const attendanceCreateSchema = z.object({
  protocol: z.string().min(5, 'Protocolo obrigatório'),
  customerName: z.string().min(3, 'Cliente obrigatório'),
  address: z.string().min(5, 'Endereço obrigatório'),
  phone: z.string().min(8, 'Telefone obrigatório'),
  reason: z.string().min(5, 'Motivo obrigatório'),
  originalAttendantName: z.string().min(3, 'Atendente original obrigatório'),
  referenceDate: z.string().datetime()
});

export const attendanceUpdateSchema = z.object({
  status: z.nativeEnum(AttendanceStatus),
  contactedAt: z.string().datetime().optional().nullable(),
  serviceResult: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  needsFollowUp: z.boolean().default(false),
  followUpDate: z.string().datetime().optional().nullable(),
  becameServiceOrder: z.boolean().default(false),
  serviceOrderNumber: z.string().optional().nullable(),
  serviceOrderJustification: z.string().optional().nullable(),
  cancellationReason: z.string().optional().nullable()
}).superRefine((v, ctx) => {
  if (v.status === 'RETORNAR_DEPOIS' && !v.followUpDate) {
    ctx.addIssue({ code: 'custom', path: ['followUpDate'], message: 'Data de retorno é obrigatória' });
  }
  if (v.status === 'RESOLVIDO' && !v.outcome?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['outcome'], message: 'Descreva a resolução' });
  }
  if ((v.status === 'VIROU_OS' || v.becameServiceOrder) && !v.serviceOrderNumber?.trim() && !v.serviceOrderJustification?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['serviceOrderNumber'], message: 'Informe O.S. ou justificativa' });
  }
  if (v.status === 'CANCELADO' && !v.cancellationReason?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['cancellationReason'], message: 'Motivo de cancelamento obrigatório' });
  }
});
