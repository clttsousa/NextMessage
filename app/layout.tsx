import './globals.css';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/app-shell';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="pt-BR">
      <body>
        {session ? <AppShell role={session.role} userName={session.name}>{children}</AppShell> : children}
      </body>
    </html>
  );
}
