export type ParsedAttendance = {
  customerName: string;
  address: string;
  reason: string;
  phone: string;
  protocol: string;
  originalAttendantName: string;
};

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function matchField(input: string, field: string, next: string[]) {
  const lookahead = next.map((n) => `(?=${n}\\s*:)`).join('|');
  const regex = new RegExp(`${field}\\s*:\\s*(.*?)(?:${lookahead}|$)`, 'i');
  return input.match(regex)?.[1]?.trim() ?? '';
}

export function parseWhatsappAttendance(raw: string): ParsedAttendance {
  const text = normalize(raw);

  const customerName = matchField(text, 'Nome', ['Endere[çc]o', 'Motivo', 'Telefone', 'Protocolo', 'Atendente']);
  const address = matchField(text, 'Endere[çc]o', ['Motivo', 'Telefone', 'Protocolo', 'Atendente']);
  const reason = matchField(text, 'Motivo', ['Telefone', 'Protocolo', 'Atendente']);
  const phone = matchField(text, 'Telefone', ['Protocolo', 'Atendente']).replace(/\D/g, '');
  const protocol = matchField(text, 'Protocolo', ['Atendente']).replace(/\s+/g, '');
  const originalAttendantName = matchField(text, 'Atendente', []);

  return {
    customerName,
    address,
    reason,
    phone,
    protocol,
    originalAttendantName
  };
}

export function hasMinimumParsedData(data: ParsedAttendance) {
  return Boolean(data.customerName && data.protocol && data.phone && data.reason);
}
