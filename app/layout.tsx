import './globals.css';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/app-shell';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="pt-BR">
      <body>{session ? <AppShell user={{ name: session.name, role: session.role }}>{children}</AppShell> : children}</body>
    </html>
  );
}
