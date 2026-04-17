import { describe, expect, it } from 'vitest';
import { getReopenStatus, validateStatusTransition } from '@/lib/services/attendance/rules';

describe('attendance rules', () => {
  it('permite transição válida', () => {
    expect(() => validateStatusTransition('EM_ATENDIMENTO', 'RESOLVIDO')).not.toThrow();
  });

  it('bloqueia transição inválida', () => {
    expect(() => validateStatusTransition('PENDENTE', 'RESOLVIDO')).toThrow(/Transição de status inválida/);
  });

  it('reabre para pendente sem responsável', () => {
    expect(getReopenStatus(null)).toBe('PENDENTE');
  });

  it('reabre para em atendimento com responsável', () => {
    expect(getReopenStatus('user-1')).toBe('EM_ATENDIMENTO');
  });
});
