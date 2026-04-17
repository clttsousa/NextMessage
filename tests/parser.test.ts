import { describe, expect, it } from 'vitest';
import { parseWhatsappAttendance } from '@/lib/services/parser/whatsapp-parser';

describe('whatsapp parser', () => {
  it('parseia campos essenciais', () => {
    const parsed = parseWhatsappAttendance(`Nome: Ana Silva\nTelefone: (11) 99999-0000\nProtocolo: ABC-123\nMotivo: Sem sinal\nEndereço: Rua A\nAtendente: João`);

    expect(parsed.customerName).toBe('Ana Silva');
    expect(parsed.phone).toBe('11999990000');
    expect(parsed.protocol).toBe('ABC-123');
  });

  it('limita tamanho de entrada', () => {
    expect(() => parseWhatsappAttendance('a'.repeat(9000))).toThrow(/Mensagem muito longa/);
  });
});
