import { NextRequest, NextResponse } from 'next/server';

export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function ensureJsonContentType(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new AppError(415, 'Content-Type deve ser application/json');
  }
}

export async function withErrorHandling<T>(handler: () => Promise<T>) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Unhandled API error', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
