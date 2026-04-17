import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { mapHistoryToNotification } from '@/lib/services/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response('Não autenticado', { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let lastCursor = request.headers.get('last-event-id') || request.headers.get('x-last-notification-id') || '';

  const stream = new ReadableStream({
    start(controller) {
      const write = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      const pushUpdates = async () => {
        try {
          const latest = await prisma.attendanceHistory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: { attendance: { select: { protocol: true } } }
          });
          const items = latest.map(mapHistoryToNotification);
          const hasNew = Boolean(items[0] && items[0].id !== lastCursor);
          if (items[0]) {
            lastCursor = items[0].id;
          }
          write('notifications', { items, hasNew });
        } catch {
          write('heartbeat', { ok: true });
        }
      };

      void pushUpdates();
      const interval = setInterval(() => {
        if (closed) return;
        void pushUpdates();
      }, 12000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
