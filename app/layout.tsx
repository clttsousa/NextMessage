import './globals.css';
import { getCurrentUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/app-shell';
import { ToastProvider } from '@/components/ui/toast-provider';
import { prisma } from '@/lib/db/prisma';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  let pendingCount = 0;
  let quickAttendances: Array<{ id: string; protocol: string; customerName: string }> = [];

  if (currentUser) {
    [pendingCount, quickAttendances] = await Promise.all([
      prisma.attendance.count({ where: { status: { in: ['PENDENTE', 'SEM_RETORNO', 'RETORNAR_DEPOIS'] } } }),
      prisma.attendance.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
        select: { id: true, protocol: true, customerName: true }
      })
    ]);
  }

  return (
    <html lang="pt-BR">
      <body>
        {currentUser ? (
          <AppShell
            user={{ name: currentUser.name, role: currentUser.role }}
            pendingCount={pendingCount}
            commandAttendances={quickAttendances}
          >
            {children}
          </AppShell>
        ) : (
          children
        )}
        <ToastProvider />
      </body>
    </html>
  );
}
