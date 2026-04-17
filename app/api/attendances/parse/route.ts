import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/api-guards';
import { ensureJsonContentType, withErrorHandling } from '@/lib/api/http';
import { hasMinimumParsedData, parseWhatsappAttendance } from '@/lib/services/parser/whatsapp-parser';

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireApiAuth();
    ensureJsonContentType(request);

    const body = (await request.json()) as { rawMessage?: string };
    if (!body.rawMessage?.trim()) return NextResponse.json({ error: 'Cole a mensagem bruta para análise' }, { status: 400 });

    const parsed = parseWhatsappAttendance(body.rawMessage);
    if (!hasMinimumParsedData(parsed)) {
      return NextResponse.json(
        {
          error: 'Não foi possível identificar todos os campos essenciais. Revise e ajuste manualmente.'
        },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  });
}
