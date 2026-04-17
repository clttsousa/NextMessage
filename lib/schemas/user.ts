import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  mustChangePassword: z.boolean().default(false),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').optional()
});
