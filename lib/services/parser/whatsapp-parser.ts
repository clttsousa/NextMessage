export type ParsedAttendance = {
  customerName: string;
  address: string;
  reason: string;
  phone: string;
  protocol: string;
  originalAttendantName: string;
};

const MAX_INPUT_CHARS = 8000;

const aliases: Record<keyof ParsedAttendance, string[]> = {
  customerName: ['nome', 'cliente'],
  address: ['endereço', 'endereco'],
  reason: ['motivo', 'problema', 'solicitação', 'solicitacao'],
  phone: ['telefone', 'celular', 'fone', 'contato'],
  protocol: ['protocolo'],
  originalAttendantName: ['atendente', 'responsável', 'responsavel']
};

export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\r/g, '')
    .trim();
}

export function assertParserInput(raw: string) {
  if (raw.length > MAX_INPUT_CHARS) {
    throw new Error(`Mensagem muito longa. Limite de ${MAX_INPUT_CHARS} caracteres.`);
  }
}

export function parseWhatsappAttendance(raw: string): ParsedAttendance {
  assertParserInput(raw);

  const lines = normalize(raw)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const result: ParsedAttendance = {
    customerName: '',
    address: '',
    reason: '',
    phone: '',
    protocol: '',
    originalAttendantName: ''
  };

  for (const line of lines) {
    const normalizedLine = line.toLowerCase();

    for (const [field, fieldAliases] of Object.entries(aliases) as Array<[keyof ParsedAttendance, string[]]>) {
      if (result[field]) continue;

      const matchedAlias = fieldAliases.find((alias) => normalizedLine.startsWith(`${alias}:`) || normalizedLine.startsWith(`${alias} -`));
      if (!matchedAlias) continue;

      const value = line.split(/[:-]/).slice(1).join(':').trim();
      result[field] = value;
    }
  }

  result.phone = result.phone.replace(/\D/g, '');
  result.protocol = result.protocol.replace(/\s+/g, '');

  return result;
}

export function hasMinimumParsedData(data: ParsedAttendance) {
  return Boolean(data.customerName && data.protocol && data.phone && data.reason);
}
