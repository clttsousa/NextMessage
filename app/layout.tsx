import './globals.css';
import { getCurrentUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/app-shell';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body>{currentUser ? <AppShell user={{ name: currentUser.name, role: currentUser.role }}>{children}</AppShell> : children}</body>
    </html>
  );
}
