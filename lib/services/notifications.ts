import { AttendanceHistory } from '@prisma/client';

export type NotificationLevel = 'sucesso' | 'aviso' | 'critico';

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  attendanceId: string;
  attendanceProtocol?: string;
  level: NotificationLevel;
  createdAt: string;
  actionType: string;
};

const actionMap: Record<string, { title: string; level: NotificationLevel }> = {
  CREATED: { title: 'Novo atendimento criado', level: 'sucesso' },
  CLAIMED: { title: 'Atendimento assumido', level: 'sucesso' },
  REASSIGNED: { title: 'Atendimento reatribuído', level: 'aviso' },
  REOPENED: { title: 'Atendimento reaberto', level: 'aviso' },
  RESOLVED: { title: 'Atendimento resolvido', level: 'sucesso' },
  UPDATED: { title: 'Status atualizado', level: 'aviso' },
  CANCELED: { title: 'Atendimento cancelado', level: 'critico' },
  SLA_NEAR_LIMIT: { title: 'SLA próximo do limite', level: 'aviso' },
  SLA_BREACHED: { title: 'SLA estourado', level: 'critico' }
};

export function mapHistoryToNotification(history: AttendanceHistory & { attendance?: { protocol: string } | null }): NotificationItem {
  const mapped = actionMap[history.actionType] ?? { title: 'Atualização operacional', level: 'aviso' };
  return {
    id: history.id,
    title: mapped.title,
    description: history.description,
    attendanceId: history.attendanceId,
    attendanceProtocol: history.attendance?.protocol,
    level: mapped.level,
    actionType: history.actionType,
    createdAt: history.createdAt.toISOString()
  };
}
