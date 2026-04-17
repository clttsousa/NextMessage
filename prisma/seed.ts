import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? 'Administrador';

  if (!email || !password) throw new Error('Defina ADMIN_SEED_EMAIL e ADMIN_SEED_PASSWORD');

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash: hash, role: UserRole.ADMIN, isActive: true },
    create: { name, email, passwordHash: hash, role: UserRole.ADMIN, isActive: true, mustChangePassword: true }
  });

  console.log(`Admin inicial pronto: ${email}`);
}

main().finally(() => prisma.$disconnect());
