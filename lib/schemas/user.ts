import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(10, 'Senha deve ter ao menos 10 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial');

export const userSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  mustChangePassword: z.boolean().default(false),
  password: strongPasswordSchema.optional()
});
